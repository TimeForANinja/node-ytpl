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

describe('YTPL.getPlaylistID()', () => {
  it('errors without parameter', async() => {
    await ASSERT.rejects(
      YTPL.getPlaylistID(),
      /The linkOrId has to be a string/,
    );
  });

  it('errors when parameter is an empty string', async() => {
    await ASSERT.rejects(
      YTPL.getPlaylistID(''),
      /The linkOrId has to be a string/,
    );
  });

  it('errors when parameter is not a string', async() => {
    await ASSERT.rejects(
      YTPL.getPlaylistID(1337),
      /The linkOrId has to be a string/,
    );
  });

  it('errors for Mixes', async() => {
    const ref = 'https://www.youtube.com/watch?v=J2X5mJ3HDYE&list=RDQMN70qZKnl_M8&start_radio=1';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /Mixes not supported/,
    );
  });
});
