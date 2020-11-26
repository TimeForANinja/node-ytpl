const URL = require('url');
const UTIL = require('./utils.js');
const QS = require('querystring');
const PARSE_ITEM = require('./parseItem.js');
const MINIGET = require('miniget');

const BASE_PLIST_URL = 'https://www.youtube.com/playlist?';
const BASE_API_URL = 'https://www.youtube.com/youtubei/v1/browse?key=';

const main = module.exports = async(linkOrId, options, rt = 3) => {
  if (rt === 0) throw new Error('Unable to find JSON!');
  // Set default values
  const plistId = await main.getPlaylistID(linkOrId);
  const opts = UTIL.checkArgs(plistId, options);

  const ref = BASE_PLIST_URL + QS.encode(opts.query);
  const body = await MINIGET(ref, opts).text();
  const parsed = UTIL.parseBody(body, opts);
  // Retry if unable to find json => most likely old response
  console.dir(body);
  if (!parsed.json) return main(linkOrId, opts, rt - 1);

  const info = parsed.json.sidebar
    .playlistSidebarRenderer.items[0]
    .playlistSidebarPrimaryInfoRenderer;

  const resp = {
    id: plistId,
    url: BASE_PLIST_URL + plistId,
    title: UTIL.parseText(info.title),
    estimated_items: UTIL.parseIntegerFromText(info.stats[0]),
    views: info.stats.length === 3 ? UTIL.parseIntegerFromText(info.stats[1]) : 0,
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

  // Parse the nextpageToken
  const continuation = rawVideoList.find(x => Object.keys(x)[0] === 'continuationItemRenderer');
  let token = null;
  if (continuation) token = continuation.continuationItemRenderer.continuationEndpoint.continuationCommand.token;

  // We're already on last page or hit the limit
  if (!token || opts.limit < 1) return resp;

  // Recursively fetch more items
  const nestedResp = await parsePage2(parsed.apiKey, token, parsed.context, opts);

  // Merge the responses
  resp.items.push(...nestedResp);
  return resp;
};

const parsePage2 = async(apiKey, token, context, opts) => {
  const json = await UTIL.doPost(BASE_API_URL + apiKey, opts, { context, continuation: token });

  const wrapper = json.onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems;

  // Parse items
  const parsedItems = wrapper.map(PARSE_ITEM).filter(a => a).filter((_, index) => index < opts.limit);

  // Adjust tracker
  opts.limit -= parsedItems.length;

  // Parse the nextpageToken
  const continuation = wrapper.find(x => Object.keys(x)[0] === 'continuationItemRenderer');
  let nextToken = null;
  if (continuation) nextToken = continuation.continuationItemRenderer.continuationEndpoint.continuationCommand.token;

  // We're already on last page or hit the limit
  if (!nextToken || opts.limit < 1) return parsedItems;

  // Recursively fetch more items
  const nestedResp = await parsePage2(apiKey, nextToken, context, opts);
  parsedItems.push(...nestedResp);
  return parsedItems;
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
  const parsed = URL.parse(linkOrId, true);
  if (Object.prototype.hasOwnProperty.call(parsed.query, 'list')) {
    if (PLAYLIST_REGEX.test(parsed.query.list) || ALBUM_REGEX.test(parsed.query.list)) {
      return true;
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
const PLAYLIST_REGEX = exports.PLAYLIST_REGEX = /^(PL|UU|LL|RD)[a-zA-Z0-9-_]{16,41}$/;
const ALBUM_REGEX = exports.ALBUM_REGEX = /^OLAK5uy_[a-zA-Z0-9-_]{33}$/;
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
  const parsed = URL.parse(linkOrId, true);
  if (Object.prototype.hasOwnProperty.call(parsed.query, 'list')) {
    if (PLAYLIST_REGEX.test(parsed.query.list) || ALBUM_REGEX.test(parsed.query.list)) {
      return parsed.query.list;
    }
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
