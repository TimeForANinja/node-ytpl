const FIRSTPAGE = require('./firstpage.js');
const NONFIRSTPAGE = require('./nonfirstpage.js');
const util = require('./util.js');

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36'; // eslint-disable-line max-len
const getPlaylist = module.exports = (linkOrId, optionsOrCallback, callback) => { // eslint-disable-line consistent-return, max-len
  // Set default values
  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
    optionsOrCallback = { limit: 100, headers: { 'user-agent': DEFAULT_USER_AGENT } };
  } else if (typeof optionsOrCallback !== 'object') {
    optionsOrCallback = { limit: 100, headers: { 'user-agent': DEFAULT_USER_AGENT } };
  } else if (optionsOrCallback.limit === 0) {
    optionsOrCallback.limit = Infinity;
  } else if (!optionsOrCallback.hasOwnProperty('limit') || isNaN(optionsOrCallback.limit)) {
    optionsOrCallback.limit = 100;
  }
  if (!optionsOrCallback.hasOwnProperty('headers')) {
    optionsOrCallback.headers = { 'user-agent': DEFAULT_USER_AGENT };
  } else if (!optionsOrCallback.headers.hasOwnProperty('user-agent')) {
    optionsOrCallback.headers['user-agent'] = DEFAULT_USER_AGENT;
  }
  // Return promise if no callback is defined
  if (!callback) {
    return new Promise((resolve, reject) => {
      getPlaylist(linkOrId, optionsOrCallback, (err, info) => { // eslint-disable-line consistent-return
        if (err) return reject(err);
        resolve(info);
      });
    });
  }
  // The property linkOrId is always required
  if (!linkOrId || typeof linkOrId !== 'string') return callback('No valid link or id was provided');
  // Resolve the id
  util.getPlaylistId(linkOrId, (err, playlistId) => { // eslint-disable-line consistent-return
    if (err) return callback(err);
    // Get the first page
    FIRSTPAGE(playlistId, optionsOrCallback, (innerErr, plistObj) => { // eslint-disable-line consistent-return, max-len
      if (innerErr) return callback(innerErr);
      if (!plistObj.nextpage || (!isNaN(optionsOrCallback.limit) && optionsOrCallback.limit < 1)) {
        delete plistObj.nextpage;
        return callback(null, plistObj);
      }

      // Start recurring function downloading more pages after the first
      NONFIRSTPAGE(plistObj.nextpage, optionsOrCallback, (err2, plistItems) => { // eslint-disable-line consistent-return, max-len
        if (err2) return callback(err2);
        // Concat the items from firstpage and the other pages
        delete plistObj.nextpage;
        plistObj.items.push(...plistItems);
        callback(null, plistObj);
      });
    });
  });
};

// Mostly equal to util.getPlaylistId
const URL = require('url');
getPlaylist.validateURL = link => {
  if (typeof link !== 'string') return false;
  if (util.PLAYLIST_REGEX.test(link)) return true;

  const parsed = URL.parse(link, true);
  if (Object.hasOwnProperty.call(parsed.query, 'list')) {
    return util.PLAYLIST_REGEX.test(parsed.query.list) || util.ALBUM_REGEX.test(parsed.query.list);
  }
  const p = parsed.pathname.split('/');
  const maybeType = p[p.length - 2];
  const maybeId = p[p.length - 1];
  if (maybeType === 'channel') {
    return util.CHANNEL_REGEX.test(maybeId);
  } else if (maybeType === 'user') {
    return maybeId.length > 0;
  }
  return false;
};

getPlaylist.getPlaylistID = util.getPlaylistId;
