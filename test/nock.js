const path = require('path');
const nock = require('nock');

const YT_HOST        = 'https://www.youtube.com';
const PLAYLIST_PATH  = '/playlist?list=';
const ADDITIONAL_REQ = '/browse_ajax?action_continuation=1&continuation=whatup&getpage=';
const USER_PATH      = '/user/';
const PLAYLIST_TRACE = '&hl=en&disable_polymer=true';

before(() => { nock.disableNetConnect(); });
after(() => { nock.enableNetConnect(); });

exports = module.exports = (id, opts) => {
  var scopes = [];
  if(typeof id === 'object') {
    opts = id;
    id = undefined;
  }

  if(opts.page_type === 'single_page') {
    scopes.push(
      nock(YT_HOST)
        .get(PLAYLIST_PATH + id + PLAYLIST_TRACE)
        .replyWithFile(opts.statusCode || 200, path.resolve(__dirname, 'files/single_page_playlist/page1.html'))
    );
  }
  else if(opts.page_type === 'multiple_page') {
    if(opts.pages.includes(1)) {
      scopes.push(
        nock(YT_HOST)
          .get(PLAYLIST_PATH + id + PLAYLIST_TRACE)
          .replyWithFile(opts.statusCode || 200, path.resolve(__dirname, 'files/multiple_page_playlist/page1.html'))
      );
    }
    if(opts.pages.includes(2)) {
      scopes.push(
        nock(YT_HOST)
          .get(ADDITIONAL_REQ + '1' + PLAYLIST_TRACE)
          .replyWithFile(opts.statusCode || 200, path.resolve(__dirname, 'files/multiple_page_playlist/page2.html'))
      );
    }
    if(opts.pages.includes(3)) {
      scopes.push(
        nock(YT_HOST)
          .get(ADDITIONAL_REQ + '2' + PLAYLIST_TRACE)
          .replyWithFile(opts.statusCode || 200, path.resolve(__dirname, 'files/multiple_page_playlist/page3.html'))
      );
    }
  }

  if(opts.error) {
    scopes.push(
      nock(YT_HOST)
        .get(PLAYLIST_PATH + id + PLAYLIST_TRACE)
        .reply(400)
    );
  }

  if(opts.user_to_channel) {
    scopes.push(
      nock(YT_HOST)
        .get(USER_PATH + opts.user_to_channel)
        .reply(opts.statusCode || 200, opts.target_channel ? 'channel_id=UC' + opts.target_channel + '"': 'no channel id in here')
    );
  }

  return {
    ifError: (err) => {if(err) nock.cleanAll()},
    done: () => scopes.forEach(scope => scope.done())
  }
}
