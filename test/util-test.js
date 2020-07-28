/* global describe, it */
const UTIL = require('../lib/util');
const FS = require('fs');
const PATH = require('path');
const NOCK = require('./nock');
const ASSERT = require('assert-diff');

describe('util.getGeneralInfo()', () => {
  it('parses the general information of a playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      const plistID = 'someID';
      const info_obj = UTIL.getGeneralInfo(dataIn.toString(), plistID);
      ASSERT.deepEqual(info_obj, {
        id: plistID,
        url: `https://www.youtube.com/playlist?list=${plistID}`,
        title: '⚡️ NCS: Electronic',
        visibility: 'everyone',
        description: null,
        total_items: 1048,
        views: 11868132,
        last_updated: 'Last updated on Apr 17, 2018',
        author: {
          id: 'UC_aEa8K-EOJ3D6gOs7HcyNg',
          name: 'NoCopyrightSounds',
          avatar: 'https://yt3.ggpht.com/-p-S-magPRTs/AAAAAAAAAAI/AAAAAAAAAAA/VkK9BqrRyuU/s100-mo-c-c0xffffffff-rj-k-no/photo.jpg', // eslint-disable-line max-len
          user: 'NoCopyrightSounds',
          channel_url: 'https://www.youtube.com/channel/UC_aEa8K-EOJ3D6gOs7HcyNg',
          user_url: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
        nextpage: null,
        items: [],
      });
      done();
    });
  });

  it('parses the general information of another playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/multiple_page_playlist/page1.html'), (err, data) => {
      ASSERT.ifError(err);
      const plistID = 'someID';
      const info_obj = UTIL.getGeneralInfo(data.toString(), plistID);
      ASSERT.deepEqual(info_obj, {
        id: plistID,
        url: `https://www.youtube.com/playlist?list=${plistID}`,
        title: '🔥 NCS: House',
        visibility: 'everyone',
        description: 'All House music uploads.',
        total_items: 155,
        views: 128553172,
        last_updated: 'Last updated on Apr 24, 2018',
        author: {
          id: 'UC_aEa8K-EOJ3D6gOs7HcyNg',
          name: 'NoCopyrightSounds',
          avatar: 'https://yt3.ggpht.com/-p-S-magPRTs/AAAAAAAAAAI/AAAAAAAAAAA/VkK9BqrRyuU/s100-mo-c-c0xffffffff-rj-k-no/photo.jpg', // eslint-disable-line max-len
          user: 'NoCopyrightSounds',
          channel_url: 'https://www.youtube.com/channel/UC_aEa8K-EOJ3D6gOs7HcyNg',
          user_url: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
        nextpage: null,
        items: [],
      });
      done();
    });
  });
});

describe('util.getVideoContainers()', () => {
  it('parses out all video containers of a playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, data) => {
      ASSERT.ifError(err);
      const containers = UTIL.getVideoContainers(data.toString());
      ASSERT.deepEqual(containers.length, 4);
      done();
    });
  });

  it('parses out all video containers of another playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/multiple_page_playlist/page1.html'), (err, data) => {
      ASSERT.ifError(err);
      const containers = UTIL.getVideoContainers(data.toString());
      ASSERT.strictEqual(containers.length, 100);
      done();
    });
  });

  it('check whether video container is as expected', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/video4.html'), (errOut, dataOut) => {
        ASSERT.ifError(errOut);
        const containers = UTIL.getVideoContainers(dataIn.toString());
        ASSERT.strictEqual(containers[3], dataOut.toString());
        done();
      });
    });
  });
});

describe('util.buildVideoObject()', () => {
  it('parses a video from its container', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/video4.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      const vidObj = UTIL.buildVideoObject(dataIn.toString());
      ASSERT.deepEqual(vidObj, {
        id: 'yHU6g3-35IU',
        url: 'https://www.youtube.com/watch?v=yHU6g3-35IU&list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5&index=43&t=0s',
        url_simple: 'https://www.youtube.com/watch?v=yHU6g3-35IU',
        title: 'NIVIRO - The Guardian Of Angels [NCS Release]',
        thumbnail: 'https://i.ytimg.com/vi/yHU6g3-35IU/hqdefault.jpg',
        duration: '3:36',
        author: {
          name: 'NoCopyrightSounds',
          ref: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
      });
      done();
    });
  });

  it('parse a private video', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/video2.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      const vidObj = UTIL.buildVideoObject(dataIn.toString());
      ASSERT.deepEqual(vidObj, {
        id: 'YG-9u6_J05w',
        url: 'https://www.youtube.com/watch?v=YG-9u6_J05w&list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5&index=41',
        url_simple: 'https://www.youtube.com/watch?v=YG-9u6_J05w',
        title: '[Private video]',
        thumbnail: 'https://s.ytimg.com/yts/img/no_thumbnail-vfl4t3-4R.jpg',
        duration: null,
        author: {
          name: null,
          ref: null,
        },
      });
      done();
    });
  });
});

describe('util.getPlaylistId()', () => {
  it('errors when no string provided', done => {
    UTIL.getPlaylistId(undefined, err => {
      ASSERT.strictEqual(err.message, 'The link has to be a string');
      done();
    });
  });

  it('instantly returns valid (raw) playlist id', done => {
    const rawID = 'PL1234567890abcdefghijkl';
    UTIL.getPlaylistId(rawID, (err, id) => {
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, rawID);
      done();
    });
  });

  it('instantly returns valid (raw) album id', done => {
    const rawID = 'OLAK5uy_0123456789ABCDEFGHIJKLMNOPQRSTUVW';
    UTIL.getPlaylistId(rawID, (err, id) => {
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, rawID);
      done();
    });
  });

  it('instantly returns valid (raw) user id', done => {
    const rawID = 'UC0123456789ABCDEFGHIJKLMNOPQRS';
    const playlistID = 'UU0123456789ABCDEFGHIJKLMNOPQRS';
    UTIL.getPlaylistId(rawID, (err, id) => {
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, playlistID);
      done();
    });
  });

  it('parses valid lists from query', done => {
    UTIL.getPlaylistId('https://www.youtube.com/watch?v=U9BwWKXjVaI&list=PL1234567890abcdefghijkl', (err, id) => {
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, 'PL1234567890abcdefghijkl');
      done();
    });
  });

  it('parses valid lists from query using Promise', done => {
    UTIL.getPlaylistId('https://www.youtube.com/watch?v=U9BwWKXjVaI&list=PL1234567890abcdefghijkl')
      .then(id => {
        ASSERT.strictEqual(id, 'PL1234567890abcdefghijkl');
        done();
      })
      .catch(err => {
        ASSERT.ifError(err);
      });
  });

  it('parses valid album', done => {
    UTIL.getPlaylistId('https://www.youtube.com/playlist?list=OLAK5uy_n7Ax9WNKAuQVwrnzKHsRZtHGzEcxEDVnY', (err, id) => {
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, 'OLAK5uy_n7Ax9WNKAuQVwrnzKHsRZtHGzEcxEDVnY');
      done();
    });
  });

  it('errors for invalid lists in query', done => {
    UTIL.getPlaylistId('https://www.youtube.com/watch?v=DLzxrzFCyOs&list=', err => {
      ASSERT.strictEqual(err.message, 'invalid list query in url');
      done();
    });
  });

  it('parses valid channels', done => {
    UTIL.getPlaylistId('https://www.youtube.com/channel/UC1234567890abcdefghijkl', (err, id) => {
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, 'UU1234567890abcdefghijkl');
      done();
    });
  });

  it('errors for invalid channels', done => {
    UTIL.getPlaylistId('https://www.youtube.com/channel/invalidID', err => {
      ASSERT.strictEqual(err.message, 'Unable to find a id in https://www.youtube.com/channel/invalidID');
      done();
    });
  });

  it('parses a valid user', done => {
    const scope = NOCK({
      user_to_channel: 'someUser',
      target_channel: 'someChannelUniqueIdentifier',
    });
    UTIL.getPlaylistId('https://www.youtube.com/user/someUser', (err, id) => {
      scope.ifError(err);
      ASSERT.ifError(err);
      ASSERT.strictEqual(id, 'UUsomeChannelUniqueIdentifier');
      scope.done();
      done();
    });
  });

  it('parses a invalid user', done => {
    const scope = NOCK({
      user_to_channel: 'a',
      target_channel: null,
    });
    UTIL.getPlaylistId('https://www.youtube.com/user/a', err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'unable to resolve the user: a');
      scope.done();
      done();
    });
  });

  it('errors for links nether including channel nor user', done => {
    UTIL.getPlaylistId('https://www.youtube.com/invalidType', err => {
      ASSERT.strictEqual(err.message, 'Unable to find a id in https://www.youtube.com/invalidType');
      done();
    });
  });

  it('returns promise without callback', done => {
    const scope = NOCK({
      user_to_channel: 'abc',
      target_channel: null,
    });
    let resp = UTIL.getPlaylistId('https://www.youtube.com/user/abc').catch(err => {
      scope.ifError(err);
      ASSERT.ok(resp instanceof Promise);
      ASSERT.strictEqual(err.message, 'unable to resolve the user: abc');
      done();
    });
  });
});

describe('util.userToChannelUploadList()', () => {
  it('resolves a user to his uploads list', done => {
    const scope = NOCK({
      user_to_channel: 'someUser',
      target_channel: 'someChannelUniqueIdentifier',
    });
    UTIL.userToChannelUploadList('someUser', (err, channelID) => {
      scope.ifError(err);
      ASSERT.ifError(err);
      ASSERT.strictEqual('UUsomeChannelUniqueIdentifier', channelID);
      scope.done();
      done();
    });
  });

  it('errors when its not able to', done => {
    const scope = NOCK({
      user_to_channel: 'a',
      target_channel: null,
    });
    UTIL.userToChannelUploadList('a', err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'unable to resolve the user: a');
      scope.done();
      done();
    });
  });

  it('errors when user is invalid', done => {
    UTIL.userToChannelUploadList('&&', err => {
      ASSERT.strictEqual(
        err.message,
        'request failed with err: Nock: Disallowed net connect for "www.youtube.com:443/user/&&"');
      done();
    });
  });
});

describe('util.between()', () => {
  it('`left` positioned at the start', () => {
    const rs = UTIL.between('<b>hello there friend</b>', '<b>', '</b>');
    ASSERT.strictEqual(rs, 'hello there friend');
  });

  it('somewhere in the middle', () => {
    const rs = UTIL.between('something everything nothing', ' ', ' ');
    ASSERT.strictEqual(rs, 'everything');
  });

  it('not found', () => {
    const rs = UTIL.between('oh oh _where_ is it', '<b>', '</b>');
    ASSERT.strictEqual(rs, '');
  });

  it('`right` before `left`', () => {
    const rs = UTIL.between('>>> a <this> and that', '<', '>');
    ASSERT.strictEqual(rs, 'this');
  });

  it('`right` not found', () => {
    const rs = UTIL.between('something [around[ somewhere', '[', ']');
    ASSERT.strictEqual(rs, '');
  });
});

describe('util.removeHtml()', () => {
  it('remove html', () => {
    ASSERT.strictEqual(
      UTIL.removeHtml('<a href="/someref">Artist1 - Nova (Official)</a><div class="pl-video-owner">'),
      'Artist1 - Nova (Official)',
    );
  });

  it('replace unknown characters', () => {
    // eslint-disable-next-line max-len
    ASSERT.strictEqual(UTIL.removeHtml('Artist1 &amp; Artist2 - Nova (Official)'), 'Artist1 & Artist2 - Nova (Official)');
  });

  it('keeps newlines', () => {
    // eslint-disable-next-line max-len
    ASSERT.strictEqual(UTIL.removeHtml('Artist1 &amp; Artist2 <br> Nova (Official)'), 'Artist1 & Artist2\nNova (Official)');
  });
});

describe('util.getClientVersion()', () => {
  it('returns the correct client version', () => {
    ASSERT.strictEqual(
      UTIL.getClientVersion('yt.setConfig({INNERTUBE_CONTEXT_CLIENT_VERSION: "1.20200716.00.00",GAPI_HINT_PARAMS:'),
      '1.20200716.00.00',
    );
  });

  it('returns an empty string if `CLIENT_VERSION` is not capital', () => {
    ASSERT.strictEqual(
      UTIL.getClientVersion('yt.setConfig({INNERTUBE_CONTEXT_client_version: "1.20200716.00.00",GAPI_HINT_PARAMS:'),
      '',
    );
  });

  it('returns an empty string if not found', () => {
    ASSERT.strictEqual(UTIL.getClientVersion('should not find anything'), '');
  });
});

describe('util.getClientName()', () => {
  it('returns the correct client name', () => {
    ASSERT.strictEqual(
      UTIL.getClientName(`Y9_11qcW8",INNERTUBE_CONTEXT_CLIENT_NAME: 1,'VISITOR_DATA': "Cg`),
      '1',
    );
  });

  it('returns an empty string if `CLIENT_NAME` is not capital', () => {
    ASSERT.strictEqual(
      UTIL.getClientName(`Y9_11qcW8",INNERTUBE_CONTEXT_client_name: 1,'VISITOR_DATA': "Cg`),
      '',
    );
  });

  it('returns an empty string if not found', () => {
    ASSERT.strictEqual(UTIL.getClientName('should not find anything'), '');
  });
});
