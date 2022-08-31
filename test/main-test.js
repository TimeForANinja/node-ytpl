/* global describe, it, before, after */
const ASSERT = require('assert-diff');
ASSERT.options.strict = true;
const YTPL = require('../');
const NOCK = require('nock');
const PATH = require('path');
const FS = require('fs');

const YT_HOST = 'https://www.youtube.com';
const PLAYLIST_PATH = '/playlist';
const API_PATH = '/youtubei/v1/browse';

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

  it('Errors for unknown Playlists - variant 2', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'UU2-i3KuYoODXsM99Z3' })
      .replyWithFile(200, 'test/pages/landingPage.html');

    await ASSERT.rejects(
      YTPL('UU2-i3KuYoODXsM99Z3'),
      /Unknown Playlist/,
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

  it('parses page with playlistShowMetadataRenderer in contents', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL2aBZuCeDwlQN4aWkYJlwjjNRr8N5Qtt1' })
      .replyWithFile(200, 'test/pages/metadataAttributeResponse.html');

    const resp = await YTPL('PL2aBZuCeDwlQN4aWkYJlwjjNRr8N5Qtt1', { limit: 5 });
    ASSERT.equal(resp.items.length, 5);
    ASSERT.equal(resp.continuation, null);
    scope.done();
  });

  it('parses first page using limit', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { limit: 40 });
    ASSERT.equal(resp.items.length, 40);
    ASSERT.equal(resp.continuation, null);
    scope.done();
  });

  it('parses multiple pages using limit', async() => {
    const scope1 = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const scope2 = NOCK(YT_HOST)
      .post(API_PATH, () => true)
      .query({ key: '<apikey>' })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { limit: 110 });
    ASSERT.equal(resp.items.length, 110);
    ASSERT.equal(resp.continuation, null);
    scope1.done();
    scope2.done();
  });

  it('returns no continuation with limit', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { limit: 40 });
    ASSERT.equal(resp.items.length, 40);
    ASSERT.equal(resp.continuation, null);
    scope.done();
  });

  it('parses & compare meta data from a regular playlist', async() => {
    const dataDir = 'test/pages/';
    const targetData = FS.readFileSync(`${dataDir}withDescription.json`);
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK' })
      .replyWithFile(200, `${dataDir}withDescription.html`);
    const resp = await YTPL('PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK', { limit: 100 });
    ASSERT.deepEqual(resp, JSON.parse(targetData));
    scope.done();
  });

  it('compare first page', async() => {
    const data_dir = 'test/pages/';
    const data = Array.from(
      new Set(FS.readdirSync('./')
        .filter(a => a.startsWith('firstpage'))
        .map(a => a.substr(0, a.length - PATH.extname(a).length))))
      .map(a => PATH.resolve(data_dir, a))
      .map(a => ({ in: `${a}.html`, out: `${a}.json` }));

    for (let i = 0; i < data.length; i++) {
      const scope = NOCK(YT_HOST)
        .get(PLAYLIST_PATH)
        .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
        .replyWithFile(200, data[i].in);
      const parsed = JSON.parse(FS.readFileSync(data[i].out, 'utf8'));

      const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { limit: 40 });
      resp.items = resp.items.length;
      ASSERT.deepEqual(
        resp,
        parsed,
        `failed to parse page variation ${(i + 1).toString().padStart(2, '0')}`,
      );
      scope.done();
    }
  });

  it('parse first page', async() => {
    const scope = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { pages: 1 });
    ASSERT.equal(resp.items.length, 100);
    ASSERT.equal(resp.continuation[0], '<apikey>');
    ASSERT.equal(resp.continuation[1], '<firstContinuationToken>');
    ASSERT.equal(resp.continuation[2].client.clientVersion, '<client_version>');
    scope.done();
  });

  it('continues with second page', async() => {
    const scope1 = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const scope2 = NOCK(YT_HOST)
      .post(API_PATH, body => body.continuation === '<firstContinuationToken>')
      .query({ key: '<apikey>' })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { pages: 2 });
    ASSERT.equal(resp.items.length, 200);
    ASSERT.equal(resp.continuation[0], '<apikey>');
    ASSERT.equal(resp.continuation[1], '<secondContinuationToken>');
    ASSERT.equal(resp.continuation[2].client.clientVersion, '<client_version>');
    scope1.done();
    scope2.done();
  });

  it('continues with second page recursively', async() => {
    const scope1 = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const scope2 = NOCK(YT_HOST)
      .post(API_PATH, body => body.continuation === '<firstContinuationToken>')
      .query({ key: '<apikey>' })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const scope3 = NOCK(YT_HOST)
      .post(API_PATH, body => body.continuation === '<secondContinuationToken>')
      .query({ key: '<apikey>' })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { pages: 3 });
    ASSERT.equal(resp.items.length, 300);
    scope1.done();
    scope2.done();
    scope3.done();
  });
});

describe('YTPL.continue()', () => {
  before(() => {
    NOCK.disableNetConnect();
  });

  after(() => {
    NOCK.enableNetConnect();
  });

  it('Errors if param is no array of length 4', async() => {
    await ASSERT.rejects(
      YTPL.continueReq(null),
      /invalid continuation array/,
    );
  });

  it('Errors if param is not of length 4', async() => {
    await ASSERT.rejects(
      YTPL.continueReq([1, 2, 3]),
      /invalid continuation array/,
    );
  });

  it('Errors for invalid apiKey', async() => {
    await ASSERT.rejects(
      YTPL.continueReq([1, null, null, null]),
      /invalid apiKey/,
    );
  });

  it('Errors for invalid token', async() => {
    await ASSERT.rejects(
      YTPL.continueReq(['null', 2, null, null]),
      /invalid token/,
    );
  });

  it('Errors for invalid context', async() => {
    await ASSERT.rejects(
      YTPL.continueReq(['null', 'null', 3, null]),
      /invalid context/,
    );
  });

  it('Errors for invalid opts', async() => {
    await ASSERT.rejects(
      YTPL.continueReq(['null', 'null', {}, 4]),
      /invalid opts/,
    );
  });

  it('Errors for non-paged requests', async() => {
    await ASSERT.rejects(
      YTPL.continueReq(['null', 'null', {}, { limit: 3 }]),
      /continueReq only allowed for paged requests/,
    );
  });

  it('does an api request using the provided information', async() => {
    const opts = [
      'apiKey',
      'token',
      { context: 'context' },
      { requestOptions: { headers: { test: 'test' } } },
    ];
    const body = { context: opts[2], continuation: opts[1] };
    const scope = NOCK(YT_HOST, { reqheaders: opts[3].headers })
      .post(API_PATH, JSON.stringify(body))
      .query({ key: opts[0] })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const { items, continuation } = await YTPL.continueReq(opts);
    ASSERT.equal(items.length, 100);
    ASSERT.ok(Array.isArray(continuation));
    ASSERT.equal(continuation[1], '<secondContinuationToken>');
    scope.done();
  });

  it('does not crash with limit=Infinity', async() => {
    const opts = [
      'apiKey',
      'token',
      { context: 'context' },
      { requestOptions: { headers: { test: 'test' } }, limit: Infinity },
    ];
    const body = { context: opts[2], continuation: opts[1] };
    const scope = NOCK(YT_HOST, { reqheaders: opts[3].headers })
      .post(API_PATH, JSON.stringify(body))
      .query({ key: opts[0] })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const { items, continuation } = await YTPL.continueReq(opts);
    ASSERT.equal(items.length, 100);
    ASSERT.ok(Array.isArray(continuation));
    ASSERT.equal(continuation[1], '<secondContinuationToken>');
    scope.done();
  });

  it('does not crash when passing continuation from ytpl()', async() => {
    const scope1 = NOCK(YT_HOST)
      .get(PLAYLIST_PATH)
      .query({ gl: 'US', hl: 'en', list: 'PL0123456789ABCDEFGHIJKLMNOPQRSTUV' })
      .replyWithFile(200, 'test/pages/firstpage_01.html');

    const resp = await YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV', { pages: 1 });

    const body = { context: resp.continuation[2], continuation: resp.continuation[1] };
    const scope2 = NOCK(YT_HOST, { reqheaders: resp.continuation[3].headers })
      .post(API_PATH, JSON.stringify(body))
      .query({ key: resp.continuation[0] })
      .replyWithFile(200, 'test/pages/secondpage_01.html');

    const { items, continuation } = await YTPL.continueReq(resp.continuation);
    ASSERT.equal(items.length, 100);
    ASSERT.ok(Array.isArray(continuation));
    ASSERT.equal(continuation[1], '<secondContinuationToken>');
    scope1.done();
    scope2.done();
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

  it('errors for video links with an embedded mix-playlist', async() => {
    const ref = 'https://www.youtube.com/watch?v=XgxMCUJwV7o&list=RDCMUCFmuxtfNr8z4q4dPlLNozzA&index=1';
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

  it('errors for invalid youtu.be links', async() => {
    const ref = 'https://youtu.be/channel/whatever';
    await ASSERT.rejects(
      YTPL.getPlaylistID(ref),
      /Unable to find a id in ./,
    );
  });

  it('instantly resolves playlists, albums and channels', async() => {
    // Channel:
    ASSERT.equal(
      await YTPL.getPlaylistID('UCqwGaUvq_l0RKszeHhZ5leA'),
      'UUqwGaUvq_l0RKszeHhZ5leA',
    );
    // Album:
    ASSERT.equal(
      await YTPL.getPlaylistID('OLAK5uy_qwGaUvq_l0RKszeHhZ5leA12345asdf12'),
      'OLAK5uy_qwGaUvq_l0RKszeHhZ5leA12345asdf12',
    );
    // Playlist:
    ASSERT.equal(
      await YTPL.getPlaylistID('PLqwGaUvq_l0RKszeHhZ5leA'),
      'PLqwGaUvq_l0RKszeHhZ5leA',
    );
    // Channel-Uploads-Playlist:
    ASSERT.equal(
      await YTPL.getPlaylistID('UUqwGaUvq_l0RKszeHhZ5leA'),
      'UUqwGaUvq_l0RKszeHhZ5leA',
    );
  });

  it('instantly resolves music.youtube.com links', async() => {
    const url = 'https://music.youtube.com/playlist?list=PLnkLprrb5GwjsSGB8SPmS8Wny9Druyy42';
    ASSERT.equal(
      await YTPL.getPlaylistID(url),
      'PLnkLprrb5GwjsSGB8SPmS8Wny9Druyy42',
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
    const uploads = await YTPL.getPlaylistID(ref);
    ASSERT.equal(uploads, 'UUqwGaUvq_l0RKszeHhZ5leA');
    scope.done();
  });

  it('resolves channel to uploads-list', async() => {
    const ref = 'https://www.youtube.com/channel/UCqwGaUvq_l0RKszeHhZ5leA';
    const uploads = await YTPL.getPlaylistID(ref);
    ASSERT.equal(uploads, 'UUqwGaUvq_l0RKszeHhZ5leA');
  });

  it('resolved favorites playlist', async() => {
    const ref = 'https://www.youtube.com/playlist?list=FLqwGaUvq_l0RKszeHhZ5leA';
    const favs = await YTPL.getPlaylistID(ref);
    ASSERT.equal(favs, 'FLqwGaUvq_l0RKszeHhZ5leA');
  });

  it('resolves playlist from video', async() => {
    const ref = 'https://www.youtube.com/watch?v=ASDF&list=UUqwGaUvq_l0RKszeHhZ5leA';
    const uploads = await YTPL.getPlaylistID(ref);
    ASSERT.equal(uploads, 'UUqwGaUvq_l0RKszeHhZ5leA');
  });

  it('resolves playlist from youtu.be share link', async() => {
    const ref = 'https://youtu.be/hIaYzwf0A8A?list=PL37UZ2QfPUvyeqqNi4m_byAjAbSHBIosW';
    const playlist = await YTPL.getPlaylistID(ref);
    ASSERT.equal(playlist, 'PL37UZ2QfPUvyeqqNi4m_byAjAbSHBIosW');
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

  it('false for video links with an embedded mix-playlist', () => {
    const ref = 'https://www.youtube.com/watch?v=XgxMCUJwV7o&list=RDCMUCFmuxtfNr8z4q4dPlLNozzA&index=1';
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

  it('true for raw playlist, album and channel ids', () => {
    // Channel:
    ASSERT.ok(YTPL.validateID('UCqwGaUvq_l0RKszeHhZ5leA'));
    // Album:
    ASSERT.ok(YTPL.validateID('OLAK5uy_qwGaUvq_l0RKszeHhZ5leA12345asdf12'));
    // Playlist:
    ASSERT.ok(YTPL.validateID('PLqwGaUvq_l0RKszeHhZ5leA'));
    // Channel-Uploads-Playlist:
    ASSERT.ok(YTPL.validateID('UUqwGaUvq_l0RKszeHhZ5leA'));
  });

  it('true for users', () => {
    const ref = 'https://www.youtube.com/user/ASDF';
    ASSERT.ok(YTPL.validateID(ref));
  });

  it('true for short-channels', () => {
    const ref = 'https://www.youtube.com/c/ASDF';
    ASSERT.ok(YTPL.validateID(ref));
  });

  it('true for regular channels', () => {
    const ref = 'https://www.youtube.com/channel/UCqwGaUvq_l0RKszeHhZ5leA';
    ASSERT.ok(YTPL.validateID(ref));
  });

  it('true for favorites playlist', () => {
    const ref = 'https://www.youtube.com/playlist?list=FLqwGaUvq_l0RKszeHhZ5leA';
    ASSERT.ok(YTPL.validateID(ref));
  });

  it('true for video inside playlist', () => {
    const ref = 'https://www.youtube.com/watch?v=ASDF&list=UUqwGaUvq_l0RKszeHhZ5leA';
    ASSERT.ok(YTPL.validateID(ref));
  });

  it('true for youtu.be share link', () => {
    const ref = 'https://youtu.be/hIaYzwf0A8A?list=PL37UZ2QfPUvyeqqNi4m_byAjAbSHBIosW';
    ASSERT.ok(YTPL.validateID(ref));
  });
});
