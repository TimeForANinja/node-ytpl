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
  before(() => {
    NOCK.disableNetConnect();
  });

  after(() => {
    NOCK.enableNetConnect();
  });

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

  it('errors for unknown list query', async() => {
    const ref = 'https://www.youtube.com/watch?v=J2X5mJ3HDYE&list=ASDF';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /invalid or unknown list query in url/,
    );
  });

  it('errors for half links', async() => {
    const ref = 'https://www.youtube.com/channel';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /Unable to find a id in ./,
    );
  });

  it('errors for 2-part links without id', async() => {
    const ref = 'https://www.youtube.com/channel/ASDF';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /Unable to find a id in ./,
    );
  });

  it('errors for alternative links', async() => {
    const ref = 'https://google.com/whatever';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /not a known youtube link/,
    );
  });

  it('errors for youtu.be links', async() => {
    const ref = 'https://youtu.be/channel/whatever';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /not a known youtube link/,
    );
  });

  it('resolves user to channel', async() => {
    const scope = NOCK(YT_HOST)
      .get('/user/ASDF')
      .replyWithFile(200, 'test/pages/userPage.html');

    const ref = 'https://www.youtube.com/user/ASDF';
    const uploads = await YTPL.getPlaylistID(ref);
    ASSERT.equal(uploads, 'UUqwGaUvq_l0RKszeHhZ5leA');
    scope.done();
  });

  it('failed to resolve user to channel', async() => {
    const scope = NOCK(YT_HOST)
      .get('/user/ASDF')
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const ref = 'https://www.youtube.com/user/ASDF';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /unable to resolve the ref: ./,
    );
    scope.done();
  });

  it('resolves short-channel to uploads-list', async() => {
    const scope = NOCK(YT_HOST)
      .get('/c/ASDF')
      .replyWithFile(200, 'test/pages/userPage.html');

    const ref = 'https://www.youtube.com/c/ASDF';
    const channel = await YTPL.getPlaylistID(ref);
    ASSERT.equal(channel, 'UUqwGaUvq_l0RKszeHhZ5leA');
    scope.done();
  });

  it('resolves channel to uploads-list', async() => {
    const ref = 'https://www.youtube.com/channel/UCqwGaUvq_l0RKszeHhZ5leA';
    const channel = await YTPL.getPlaylistID(ref);
    ASSERT.equal(channel, 'UUqwGaUvq_l0RKszeHhZ5leA');
  });
});

describe('YTPL.validateID()', () => {
  it('false without parameter', () => {
    ASSERT.equal(YTPL.validateID(), false);
  });

  it('false when parameter is an empty string', () => {
    ASSERT.equal(YTPL.validateID(''), false);
  });

  it('false when parameter is not a string', () => {
    ASSERT.equal(YTPL.validateID(1337), false);
  });

  it('false for Mixes', () => {
    const ref = 'https://www.youtube.com/watch?v=J2X5mJ3HDYE&list=RDQMN70qZKnl_M8&start_radio=1';
    ASSERT.equal(YTPL.validateID(ref), false);
  });

  it('false for unknown list query', () => {
    const ref = 'https://www.youtube.com/watch?v=J2X5mJ3HDYE&list=ASDF';
    ASSERT.equal(YTPL.validateID(ref), false);
  });

  it('false for half links', () => {
    const ref = 'https://www.youtube.com/channel';
    ASSERT.equal(YTPL.validateID(ref), false);
  });

  it('false for 2-part links without id', () => {
    const ref = 'https://www.youtube.com/channel/ASDF';
    ASSERT.equal(YTPL.validateID(ref), false);
  });

  it('false for alternative links', () => {
    const ref = 'https://google.com/whatever';
    ASSERT.equal(YTPL.validateID(ref), false);
  });

  it('false for youtu.be links', () => {
    const ref = 'https://youtu.be/channel/whatever';
    ASSERT.equal(YTPL.validateID(ref), false);
  });

  it('true for users', () => {
    const ref = 'https://www.youtube.com/user/ASDF';
    ASSERT.equal(YTPL.validateID(ref), true);
  });

  it('true for short-channels', () => {
    const ref = 'https://www.youtube.com/c/ASDF';
    ASSERT.equal(YTPL.validateID(ref), true);
  });

  it('true for regular channels', () => {
    const ref = 'https://www.youtube.com/channel/UCqwGaUvq_l0RKszeHhZ5leA';
    ASSERT.equal(YTPL.validateID(ref), true);
  });
});
