/* global describe, it */
const FS = require('fs');
const PATH = require('path');
const YTPL = require('..');
const NOCK = require('./nock');
const ASSERT = require('assert-diff');

describe('main()', () => {
  it('try with invalid id', done => {
    let plistID = 'someID';
    YTPL(plistID).catch(err => {
      ASSERT.strictEqual(err.message, `Unable to find a id in "${plistID}"`);
      done();
    });
  });

  it('redirects https error codes', done => {
    let plistID = 'UUsomeChannelIdentifierxxx';
    let scope = NOCK(plistID, {
      error: true,
    });
    YTPL(plistID).catch(err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'Status code: 400');
      scope.done();
      done();
    });
  });

  it('returns promise without callback', done => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = NOCK(plistID, {
      error: true,
    });
    let resp = YTPL(plistID).catch(err => {
      scope.ifError(err);
      ASSERT.ok(resp instanceof Promise);
      ASSERT.strictEqual(err.message, 'Status code: 400');
      scope.done();
      done();
    });
  });

  it('overwrites invalid options', done => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1],
    });
    YTPL(plistID, 'some bullshit').then(resp => {
      ASSERT.strictEqual(resp.items.length, 100);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });

  it('handles limits', done => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1, 2],
    });
    YTPL(plistID, { limit: 200 }).then(resp => {
      ASSERT.strictEqual(resp.items.length, 200);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });

  it('handles infinity limits', done => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1, 2, 3],
    });
    YTPL(plistID, { limit: Infinity }).then(resp => {
      ASSERT.strictEqual(resp.items.length, 255);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });

  it('handles invalid limit format', done => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1],
    });
    YTPL(plistID, { limit: 'invalid type' }).then(resp => {
      ASSERT.strictEqual(resp.items.length, 100);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });

  it('handles albums without author', done => {
    let plistID = 'OLAK5uy_SomeRandomAlbumWithoutKnownAuthor';
    let scope = NOCK(plistID, {
      page_type: 'album',
    });
    const targetPath = PATH.resolve(__dirname, './files/album_page/album_parsed.json');
    const target = JSON.parse(FS.readFileSync(targetPath));
    YTPL(plistID, { limit: 1 }).then(resp => {
      ASSERT.deepEqual(target, resp);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });
});

describe('main.validateID()', () => {
  it('recognises user link', done => {
    ASSERT.strictEqual(YTPL.validateID('www.youtube.com/user/someUser'), true);
    done();
  });

  it('recognises channel link', done => {
    ASSERT.strictEqual(YTPL.validateID('youtube.com/channel/UC0123456789ABCDEFGHIJKLMNOPQRS'), true);
    done();
  });

  it('recognises playlist links', done => {
    ASSERT.strictEqual(YTPL.validateID('http://www.youtube.com/playlist?list=PL0123456789ASDFGHJK'), true);
    done();
  });

  it('recognises playlist id\'s', done => {
    ASSERT.strictEqual(YTPL.validateID('PL0123456789ASDFGHJK'), true);
    done();
  });

  it('recognises album id\'s', done => {
    ASSERT.strictEqual(YTPL.validateID('OLAK5uy_0123456789ABCDEFGHIJKLMNOPQRSTUVW'), true);
    done();
  });

  it('recognises channel id\'s', done => {
    ASSERT.strictEqual(YTPL.validateID('UC0123456789ABCDEFGHIJKLMNOPQRS'), true);
    done();
  });

  it('recognises channel id\'s', done => {
    ASSERT.strictEqual(YTPL.validateID('https://youtube.com/c/whatever'), true);
    done();
  });

  it('fails for videos', done => {
    ASSERT.strictEqual(YTPL.validateID('youtube.com/watch?v=asdf1234'), false);
    done();
  });

  it('fails for random strings', done => {
    ASSERT.strictEqual(YTPL.validateID('asdfagasdas'), false);
    done();
  });
});

describe('main.getPlaylistID()', () => {
  it('errors when no string provided', done => {
    YTPL.getPlaylistID(undefined).catch(err => {
      ASSERT.strictEqual(err.message, 'The linkOrId has to be a string');
      done();
    });
  });

  it('instantly returns valid (raw) playlist id', done => {
    const rawID = 'PL1234567890abcdefghijkl';
    YTPL.getPlaylistID(rawID).then(id => {
      ASSERT.strictEqual(id, rawID);
      done();
    }).catch(err => {
      ASSERT.ifError(err);
    });
  });

  it('instantly returns valid (raw) album id', done => {
    const rawID = 'OLAK5uy_0123456789ABCDEFGHIJKLMNOPQRSTUVW';
    YTPL.getPlaylistID(rawID).then(id => {
      ASSERT.strictEqual(id, rawID);
      done();
    }).catch(err => {
      ASSERT.ifError(err);
    });
  });

  it('instantly returns valid (raw) user id', done => {
    const rawID = 'UC0123456789ABCDEFGHIJKLMNOPQRS';
    const playlistID = 'UU0123456789ABCDEFGHIJKLMNOPQRS';
    YTPL.getPlaylistID(rawID).then(id => {
      ASSERT.strictEqual(id, playlistID);
      done();
    }).catch(err => {
      ASSERT.ifError(err);
    });
  });

  it('parses valid lists from query', done => {
    YTPL.getPlaylistID('https://www.youtube.com/watch?v=U9BwWKXjVaI&list=PL1234567890abcdefghijkl').then(id => {
      ASSERT.strictEqual(id, 'PL1234567890abcdefghijkl');
      done();
    }).catch(err => {
      ASSERT.ifError(err);
    });
  });

  it('parses valid album', done => {
    YTPL.getPlaylistID('https://www.youtube.com/playlist?list=OLAK5uy_n7Ax9WNKAuQVwrnzKHsRZtHGzEcxEDVnY').then(id => {
      ASSERT.strictEqual(id, 'OLAK5uy_n7Ax9WNKAuQVwrnzKHsRZtHGzEcxEDVnY');
      done();
    }).catch(err => {
      ASSERT.ifError(err);
    });
  });

  it('errors for invalid lists in query', done => {
    YTPL.getPlaylistID('https://www.youtube.com/watch?v=DLzxrzFCyOs&list=').catch(err => {
      ASSERT.strictEqual(err.message, 'invalid or unknown list query in url');
      done();
    });
  });

  it('parses valid channels', done => {
    YTPL.getPlaylistID('https://www.youtube.com/channel/UC1234567890abcdefghijkl').then(id => {
      ASSERT.strictEqual(id, 'UU1234567890abcdefghijkl');
      done();
    }).catch(err => {
      ASSERT.ifError(err);
    });
  });

  it('errors for invalid channels', done => {
    YTPL.getPlaylistID('https://www.youtube.com/channel/invalidID').catch(err => {
      ASSERT.strictEqual(err.message, 'Unable to find a id in "https://www.youtube.com/channel/invalidID"');
      done();
    });
  });

  it('parses a valid user', done => {
    const scope = NOCK({
      user_to_channel: 'someUser',
      target_channel: 'someChannelUniqueIdentifier',
    });
    YTPL.getPlaylistID('https://www.youtube.com/user/someUser').then(id => {
      ASSERT.strictEqual(id, 'UUsomeChannelUniqueIdentifier');
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });

  it('parses a invalid user', done => {
    const scope = NOCK({
      user_to_channel: 'a',
      target_channel: null,
    });
    YTPL.getPlaylistID('https://www.youtube.com/user/a').catch(err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'unable to resolve the ref: https://www.youtube.com/user/a');
      scope.done();
      done();
    });
  });

  it('errors for links nether including channel nor user', done => {
    YTPL.getPlaylistID('https://www.youtube.com/invalidType').catch(err => {
      ASSERT.strictEqual(err.message, 'Unable to find a id in "https://www.youtube.com/invalidType"');
      done();
    });
  });
});

describe('main.userToChannelUploadList()', () => {
  it('resolves a user to his uploads list', done => {
    const scope = NOCK({
      user_to_channel: 'someUser',
      target_channel: 'someChannelUniqueIdentifier',
    });
    YTPL.getPlaylistID('https://www.youtube.com/user/someUser').then(channelID => {
      ASSERT.strictEqual('UUsomeChannelUniqueIdentifier', channelID);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });

  it('errors when its not able to', done => {
    const scope = NOCK({
      user_to_channel: 'a',
      target_channel: null,
    });
    YTPL.getPlaylistID('https://www.youtube.com/user/a').catch(err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'unable to resolve the ref: https://www.youtube.com/user/a');
      scope.done();
      done();
    });
  });

  it('errors when user is invalid', done => {
    YTPL.getPlaylistID('https://www.youtube.com/user/&&').catch(err => {
      ASSERT.strictEqual(
        err.message,
        'Nock: Disallowed net connect for "www.youtube.com:443/user/&&"');
      done();
    });
  });
});
