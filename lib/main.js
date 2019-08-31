const FIRSTPAGE = require('./firstpage.js');
const NONFIRSTPAGE = require('./nonfirstpage.js');
const util = require('./util.js');

const getPlaylist = module.exports = (linkOrId, optionsOrCallback, callback) => { // eslint-disable-line consistent-return, max-len
  // Set default values
  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
    optionsOrCallback = { limit: 100 };
  } else if (typeof optionsOrCallback !== 'object') {
    optionsOrCallback = { limit: 100 };
  } else if (optionsOrCallback.limit === 0) {
    optionsOrCallback.limit = Infinity;
  } else if (!optionsOrCallback.hasOwnProperty('limit') || isNaN(optionsOrCallback.limit)) {
    optionsOrCallback.limit = 100;
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
const PLAYLIST_REGEX = /^(PL|UU|LL)[a-zA-Z0-9-_]{16,32}$/;
const ALBUM_REGEX = /^OLAK5uy_[a-zA-Z0-9-_]{33}$/;
const CHANNEL_REGEX = /^UC[a-zA-Z0-9-_]{22,32}$/;
getPlaylist.validateURL = link => {
  if (typeof link !== 'string') return false;
  if (PLAYLIST_REGEX.test(link)) return true;

  const parsed = URL.parse(link, true);
  if (Object.hasOwnProperty.call(parsed.query, 'list')) {
    return PLAYLIST_REGEX.test(parsed.query.list) || ALBUM_REGEX.test(parsed.query.list);
  }
  const p = parsed.pathname.split('/');
  const maybeType = p[p.length - 2];
  const maybeId = p[p.length - 1];
  if (maybeType === 'channel') {
    return CHANNEL_REGEX.test(maybeId);
  } else if (maybeType === 'user') {
    return maybeId.length > 0;
  }
  return false;
};
