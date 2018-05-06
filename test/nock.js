/* global before, after */
const PATH = require('path');
const NOCK = require('nock');

const YT_HOST = 'https://www.youtube.com';
const PLAYLIST_PATH = '/playlist?list=';
const ADDITIONAL_REQ = '/browse_ajax?action_continuation=1&continuation=whatup&getpage=';
const USER_PATH = '/user/';
const PLAYLIST_TRACE = '&hl=en&disable_polymer=true';

before(() => { NOCK.disableNetConnect(); });
after(() => { NOCK.enableNetConnect(); });

exports = module.exports = (id, opts) => {
  const scopes = [];
  if (typeof id === 'object') {
    opts = id;
    id = undefined;
  }

  if (opts.page_type === 'single_page') {
    scopes.push(
      NOCK(YT_HOST)
        .get(PLAYLIST_PATH + id + PLAYLIST_TRACE)
        .replyWithFile(opts.statusCode || 200, PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'))
    );
  } else if (opts.page_type === 'multiple_page') {
    if (opts.pages.includes(1)) {
      scopes.push(
        NOCK(YT_HOST)
          .get(PLAYLIST_PATH + id + PLAYLIST_TRACE)
          .replyWithFile(opts.statusCode || 200, PATH.resolve(__dirname, 'files/multiple_page_playlist/page1.html'))
      );
    }
    if (opts.pages.includes(2)) {
      scopes.push(
        NOCK(YT_HOST)
          .get(`${ADDITIONAL_REQ}1${PLAYLIST_TRACE}`)
          .replyWithFile(opts.statusCode || 200, PATH.resolve(__dirname, 'files/multiple_page_playlist/page2.html'))
      );
    }
    if (opts.pages.includes(3)) {
      scopes.push(
        NOCK(YT_HOST)
          .get(`${ADDITIONAL_REQ}2${PLAYLIST_TRACE}`)
          .replyWithFile(opts.statusCode || 200, PATH.resolve(__dirname, 'files/multiple_page_playlist/page3.html'))
      );
    }
  }

  if (opts.error) {
    scopes.push(
      NOCK(YT_HOST)
        .get(PLAYLIST_PATH + id + PLAYLIST_TRACE)
        .reply(400)
    );
  }

  if (opts.user_to_channel) {
    scopes.push(
      NOCK(YT_HOST)
        .get(USER_PATH + opts.user_to_channel)
        .reply(
          opts.statusCode || 200,
          opts.target_channel ? `channel_id=UC${opts.target_channel}"` : 'no channel id in here'
        )
    );
  }

  return {
    ifError: err => { if (err) NOCK.cleanAll(); },
    done: () => scopes.forEach(scope => scope.done()),
  };
};
