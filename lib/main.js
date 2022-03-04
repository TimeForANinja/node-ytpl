const UTIL = require('./utils.js');
const QS = require('querystring');
const PARSE_ITEM = require('./parseItem.js');
const MINIGET = require('miniget');

const YT_HOSTS = ['www.youtube.com', 'youtube.com', 'music.youtube.com', 'youtu.be'];
const BASE_PLIST_URL = 'https://www.youtube.com/playlist?';
const BASE_API_URL = 'https://www.youtube.com/youtubei/v1/browse?key=';

const main = module.exports = async(linkOrId, options, rt = 3) => {
  if (rt === 0) throw new Error('Unable to find JSON!');
  // Set default values
  const plistId = await main.getPlaylistID(linkOrId);
  const opts = UTIL.checkArgs(plistId, options);

  const ref = BASE_PLIST_URL + QS.encode(opts.query);
  const body = await MINIGET(ref, opts.requestOptions).text();
  const parsed = UTIL.parseBody(body, opts);
  // Retry if unable to find json => most likely old response
  if (!parsed.json) return main(linkOrId, opts, rt - 1);

  // Pass Errors from the API
  if (parsed.json.alerts && !parsed.json.contents) {
    let error = parsed.json.alerts.find(a => a.alertRenderer && a.alertRenderer.type === 'ERROR');
    if (error) throw new Error(`API-Error: ${UTIL.parseText(error.alertRenderer.text, '* no message *')}`);
  }

  // Youtube might just load the main page and set statuscode 204
  if (!parsed.json.sidebar) throw new Error('Unknown Playlist');

  const info = parsed.json.sidebar
    .playlistSidebarRenderer.items
    .find(x => Object.keys(x)[0] === 'playlistSidebarPrimaryInfoRenderer')
    .playlistSidebarPrimaryInfoRenderer;
  const secInfo = parsed.json.sidebar
    .playlistSidebarRenderer.items
    .find(x => Object.keys(x)[0] === 'playlistSidebarSecondaryInfoRenderer');
  const info_owner = !secInfo ? null : secInfo
    .playlistSidebarSecondaryInfoRenderer
    .videoOwner.videoOwnerRenderer;
  const thumbnails = (
    info.thumbnailRenderer.playlistVideoThumbnailRenderer ||
    info.thumbnailRenderer.playlistCustomThumbnailRenderer
  ).thumbnail.thumbnails.sort((a, b) => b.width - a.width);

  const resp = {
    id: plistId,
    url: `${BASE_PLIST_URL}list=${plistId}`,
    title: UTIL.parseText(info.title, ''),
    estimatedItemCount: UTIL.parseIntegerFromText(info.stats[0]),
    views: info.stats.length === 3 ? UTIL.parseIntegerFromText(info.stats[1]) : 0,
    thumbnails,
    bestThumbnail: thumbnails[0],
    lastUpdated: UTIL.parseText(info.stats[2], ''),
    description: info.description ? UTIL.parseText(info.description, '') : null,
    visibility: info.badges && JSON.stringify(info.badges).includes('UNLISTED') ? 'unlisted' : 'everyone',
    author: !secInfo ? null : {
      name: info_owner.title.runs[0].text,
      url: new URL(info_owner.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_PLIST_URL).toString(),
      avatars: info_owner.thumbnail.thumbnails.sort((a, b) => b.width - a.width),
      bestAvatar: info_owner.thumbnail.thumbnails.sort((a, b) => b.width - a.width)[0],
      channelID: info_owner.navigationEndpoint.browseEndpoint.browseId,
    },
    items: [],
    continuation: null,
  };

  // Parse videos
  const rawVideoList = parsed.json.contents
    .twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
    .sectionListRenderer.contents[0]
    .itemSectionRenderer.contents[0]
    .playlistVideoListRenderer.contents;
  resp.items = rawVideoList.map(PARSE_ITEM).filter(a => a).filter((_, index) => index < opts.limit);

  // Adjust tracker
  opts.limit -= resp.items.length;
  opts.pages -= 1;

  // Parse the nextpageToken
  const continuation = rawVideoList.find(x => Object.keys(x)[0] === 'continuationItemRenderer');
  let token = null;
  if (continuation) token = continuation.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
  // Only provide continuation if we're pulling all items or using paging
  if (token && opts.limit === Infinity) resp.continuation = [parsed.apiKey, token, parsed.context, opts];

  // We're already on last page or hit the limit
  if (!token || opts.limit < 1 || opts.pages < 1) return resp;

  // Recursively fetch more items
  const nestedResp = await parsePage2(parsed.apiKey, token, parsed.context, opts);
  // Merge the responses
  resp.items.push(...nestedResp.items);
  resp.continuation = nestedResp.continuation;
  return resp;
};
main.version = require('../package.json').version;

const parsePage2 = async(apiKey, token, context, opts) => {
  const json = await UTIL.doPost(BASE_API_URL + apiKey, { context, continuation: token }, opts.requestOptions);

  const wrapper = json.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;

  // Parse items
  const parsedItems = wrapper.map(PARSE_ITEM).filter(a => a).filter((_, index) => index < opts.limit);

  // Adjust tracker
  opts.limit -= parsedItems.length;
  opts.pages -= 1;

  // Parse the nextpageToken
  const continuation = wrapper.find(x => Object.keys(x)[0] === 'continuationItemRenderer');
  let nextToken = null;
  if (continuation) nextToken = continuation.continuationItemRenderer.continuationEndpoint.continuationCommand.token;

  // We're already on last page or hit the limit
  if (!nextToken || opts.limit < 1 || opts.pages < 1) {
    return {
      continuation: nextToken && opts.limit === Infinity ? [apiKey, nextToken, context, opts] : null,
      items: parsedItems,
    };
  }

  // Recursively fetch more items
  const nestedResp = await parsePage2(apiKey, nextToken, context, opts);
  nestedResp.items.unshift(...parsedItems);
  return nestedResp;
};
// eslint-disable-next-line require-await
main.continueReq = async args => {
  if (!Array.isArray(args) || args.length !== 4) throw new Error('invalid continuation array');
  if (!args[0] || typeof args[0] !== 'string') throw new Error('invalid apiKey');
  if (!args[1] || typeof args[1] !== 'string') throw new Error('invalid token');
  if (!args[2] || typeof args[2] !== 'object') throw new Error('invalid context');
  if (!args[3] || typeof args[3] !== 'object') throw new Error('invalid opts');
  if (!isNaN(args[3].limit) && isFinite(args[3].limit)) throw new Error('continueReq only allowed for paged requests');
  args[3].pages = 1;
  args[3].limit = Infinity;
  return parsePage2(...args);
};

// Checks for a (syntactically) valid URL - mostly equals getPlaylistID
main.validateID = linkOrId => {
  // Validate inputs
  if (typeof linkOrId !== 'string' || !linkOrId) {
    return false;
  }
  // Clean id provided
  if (PLAYLIST_REGEX.test(linkOrId) || ALBUM_REGEX.test(linkOrId)) {
    return true;
  }
  if (CHANNEL_REGEX.test(linkOrId)) {
    return true;
  }
  // Playlist link provided
  const parsed = new URL(linkOrId, BASE_PLIST_URL);
  if (!YT_HOSTS.includes(parsed.host)) return false;
  if (parsed.searchParams.has('list')) {
    const listParam = parsed.searchParams.get('list');
    if (PLAYLIST_REGEX.test(listParam) || ALBUM_REGEX.test(listParam)) {
      return true;
    }
    // Mixes currently not supported
    // They would require fetching a video page & resolving the side-loaded playlist
    if (listParam && listParam.startsWith('RD')) {
      return false;
    }
    return false;
  }
  // Shortened channel or user page provided
  const p = parsed.pathname.substr(1).split('/');
  if (p.length < 2 || p.some(a => !a)) return false;
  const maybeType = p[p.length - 2];
  const maybeId = p[p.length - 1];
  if (maybeType === 'channel') {
    if (CHANNEL_REGEX.test(maybeId)) {
      return true;
    }
  } else if (maybeType === 'user') {
    // No request in here since we wanna keep it sync
    return true;
  } else if (maybeType === 'c') {
    // No request in here since we wanna keep it sync
    return true;
  }
  return false;
};

// Parse the input to a id (or error)
const PLAYLIST_REGEX = exports.PLAYLIST_REGEX = /^(FL|PL|UU|LL)[a-zA-Z0-9-_]{16,41}$/;
const ALBUM_REGEX = exports.ALBUM_REGEX = /^(RDC|O)LAK5uy_[a-zA-Z0-9-_]{33}$/;
const CHANNEL_REGEX = exports.CHANNEL_REGEX = /^UC[a-zA-Z0-9-_]{22,32}$/;
main.getPlaylistID = async linkOrId => {
  // Validate inputs
  if (typeof linkOrId !== 'string' || !linkOrId) {
    throw new Error('The linkOrId has to be a string');
  }
  // Clean id provided
  if (PLAYLIST_REGEX.test(linkOrId) || ALBUM_REGEX.test(linkOrId)) {
    return linkOrId;
  }
  if (CHANNEL_REGEX.test(linkOrId)) {
    return `UU${linkOrId.substr(2)}`;
  }
  // Playlist link provided
  const parsed = new URL(linkOrId, BASE_PLIST_URL);
  if (!YT_HOSTS.includes(parsed.host)) throw new Error('not a known youtube link');
  if (parsed.searchParams.has('list')) {
    const listParam = parsed.searchParams.get('list');
    if (PLAYLIST_REGEX.test(listParam) || ALBUM_REGEX.test(listParam)) {
      return listParam;
    }
    // Mixes currently not supported
    // They would require fetching a video page & resolving the side-loaded playlist
    if (listParam && listParam.startsWith('RD')) {
      throw new Error('Mixes not supported');
    }
    // Default case
    throw new Error('invalid or unknown list query in url');
  }
  // Shortened channel or user page provided
  const p = parsed.pathname.substr(1).split('/');
  if (p.length < 2 || p.some(a => !a)) {
    throw new Error(`Unable to find a id in "${linkOrId}"`);
  }
  const maybeType = p[p.length - 2];
  const maybeId = p[p.length - 1];
  if (maybeType === 'channel') {
    if (CHANNEL_REGEX.test(maybeId)) {
      return `UU${maybeId.substr(2)}`;
    }
  } else if (maybeType === 'user') {
    // eslint-disable-next-line no-return-await
    return await toChannelList(`https://www.youtube.com/user/${maybeId}`);
  } else if (maybeType === 'c') {
    // eslint-disable-next-line no-return-await
    return await toChannelList(`https://www.youtube.com/c/${maybeId}`);
  }
  throw new Error(`Unable to find a id in "${linkOrId}"`);
};

// Gets the channel uploads id of a user (needed for uploads playlist)
const CHANNEL_ONPAGE_REGEXP = /channel_id=UC([\w-]{22,32})"/;
const toChannelList = async ref => {
  const body = await MINIGET(ref).text();
  const channelMatch = body.match(CHANNEL_ONPAGE_REGEXP);
  if (channelMatch) return `UU${channelMatch[1]}`;
  throw new Error(`unable to resolve the ref: ${ref}`);
};
