/* global describe, it, before, after */
const ASSERT = require('assert-diff');
ASSERT.options.strict = true;
const YTPL = require('../');
const NOCK = require('nock');

const YT_HOST = 'https://www.youtube.com';
const PLAYLIST_PATH = '/playlist';

describe('YTPL()', () => {
  before(() => {
    NOCK.disableNetConnect();
  });

  after(() => {
    NOCK.enableNetConnect();
  });

  it('Errors for unknown Playlists', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/notexistspage.html');

    await ASSERT.rejects(
      YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV'),
      /API-Error: The playlist does not exist\./,
    );
    scope.done();
  });

  it('Errors for private Playlists', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/privatepage.html');

    await ASSERT.rejects(
      YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV'),
      /API-Error: This playlist is private\./,
    );
    scope.done();
  });
});
