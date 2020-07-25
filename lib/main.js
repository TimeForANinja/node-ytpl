const FIRSTPAGE = require('./firstpage.js');
const NONFIRSTPAGE = require('./nonfirstpage.js');
const util = require('./util.js');

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36'; // eslint-disable-line max-len
const DEFAULT_HEADERS = {
  'user-agent': DEFAULT_USER_AGENT,
};
const main = module.exports = (linkOrId, optionsOrCallback, callback, noWarn = false) => { // eslint-disable-line consistent-return, max-len
  // Set default values
  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
    optionsOrCallback = { limit: 100 };
  } else if (typeof optionsOrCallback !== 'object') {
    optionsOrCallback = { limit: 100 };
  } else if (optionsOrCallback.limit === 0) {
    // TODO: remove when done
    if (main.do_warn_deprecate) {
      console.warn(
        `/************************************************************************
 * the behavior of limit: 0 in ytpl will be changed in the next release *
 *     set \`ytpl.do_warn_deprecate = false\` to disable this message     *
 ************************************************************************/`);
    }
    optionsOrCallback.limit = Infinity;
  } else if (!optionsOrCallback.hasOwnProperty('limit') || isNaN(optionsOrCallback.limit)) {
    optionsOrCallback.limit = 100;
  }
  optionsOrCallback.headers = Object.assign({}, DEFAULT_HEADERS, optionsOrCallback.headers);
  // TODO: remove when done
  if (callback && main.do_warn_deprecate && !noWarn) {
    console.warn(
      `/*********************************************************************
 * support for callbacks in ytpl will be removed in the next release *
 *   set \`ytpl.do_warn_deprecate = false;\` to disable this message   *
 *********************************************************************/`);
  }
  // Return promise if no callback is defined
  if (!callback) {
    return new Promise((resolve, reject) => {
      main(linkOrId, optionsOrCallback, (err, info) => { // eslint-disable-line consistent-return
        if (err) return reject(err);
        resolve(info);
      }, true);
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

      optionsOrCallback.headers = Object.assign({}, plistObj.headers, optionsOrCallback.headers);
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

// Mostly equal to main.getPlaylistID
const URL = require('url');
main.validateURL = link => {
  if (typeof link !== 'string') return false;
  if (util.PLAYLIST_REGEX.test(link) ||
    util.ALBUM_REGEX.test(link) ||
    util.CHANNEL_REGEX.test(link)) return true;

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

main.getPlaylistID = (link, callback) => {
  // TODO: remove when done
  if (callback && main.do_warn_deprecate) {
    console.warn(
      `/*********************************************************************
 * support for callbacks in ytpl will be removed in the next release *
 *   set \`ytpl.do_warn_deprecate = false;\` to disable this message   *
 *********************************************************************/`);
  }
  return util.getPlaylistId(link, callback);
};

// Option to disable deprecation messages
main.do_warn_deprecate = true;
