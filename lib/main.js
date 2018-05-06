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
  } else if (!optionsOrCallback.limit) {
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
