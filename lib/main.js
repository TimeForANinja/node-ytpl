const URL = require('url');
const UTIL = require('./util.js');
const MINIGET = require('miniget');
const FIRSTPAGE = require('./firstpage.js');
const NONFIRSTPAGE = require('./nonfirstpage.js');

const getPlaylist = module.exports = async(linkOrId, options) => {
  // Set default values
  options = UTIL.checkArgs(linkOrId, options);
  const plistID = await getPlaylist.getPlaylistID(linkOrId);
  // Fetch meta and headers
  // Headers are added to <options> object
  const plistObj = await FIRSTPAGE(plistID, options);

  if (plistObj.nextpage && options.limit >= 1) {
    // Fetch more videos recursively
    const plistItems = await NONFIRSTPAGE(plistObj.nextpage, options);
    // Add fetched videos to response object
    plistObj.items.push(...plistItems);
  }

  delete plistObj.nextpage;
  return plistObj;
};

getPlaylist.validateURL = linkOrId => {
  // Validate inputs
  if (typeof linkOrId !== 'string') {
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
  const p = parsed.pathname.split('/');
  const maybeType = p[p.length - 2];
  const maybeId = p[p.length - 1];
  if (maybeType === 'channel') {
    if (CHANNEL_REGEX.test(maybeId)) {
      return true;
    }
  } else if (maybeType === 'user') {
    return true;
  }
  return false;
};

// Parse the input to a id (or error)
const PLAYLIST_REGEX = exports.PLAYLIST_REGEX = /^(PL|UU|LL|RD)[a-zA-Z0-9-_]{16,41}$/;
const ALBUM_REGEX = exports.ALBUM_REGEX = /^OLAK5uy_[a-zA-Z0-9-_]{33}$/;
const CHANNEL_REGEX = exports.CHANNEL_REGEX = /^UC[a-zA-Z0-9-_]{22,32}$/;
getPlaylist.getPlaylistID = async linkOrId => {
  // Validate inputs
  if (typeof linkOrId !== 'string') {
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
  const p = parsed.pathname.split('/');
  const maybeType = p[p.length - 2];
  const maybeId = p[p.length - 1];
  if (maybeType === 'channel') {
    if (CHANNEL_REGEX.test(maybeId)) {
      return `UU${maybeId.substr(2)}`;
    }
  } else if (maybeType === 'user') {
    // eslint-disable-next-line no-return-await
    return await userToChannelUploadList(maybeId);
  }
  throw new Error(`Unable to find a id in "${linkOrId}"`);
};

// Gets the channel uploads id of a user (needed for uploads playlist)
const CHANNEL_ONPAGE_REGEXP = /channel_id=UC([\w-]{22,32})"/;
const userToChannelUploadList = async user => {
  const body = await MINIGET(`https://www.youtube.com/user/${user}`).text();
  const channelMatch = body.match(CHANNEL_ONPAGE_REGEXP);
  if (channelMatch) return `UU${channelMatch[1]}`;
  throw new Error(`unable to resolve the user: ${user}`);
};
