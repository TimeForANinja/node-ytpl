/* global describe, it */
const FS = require('fs');
const PATH = require('path');
const YTPL = require('..');
const nock = require('./nock');
const ASSERT = require('assert-diff');

describe('main()', () => {
  it('try with invalid id', done => {
    let plistID = 'someID';
    YTPL(plistID, err => {
      ASSERT.strictEqual(err.message, `Unable to find a id in ${plistID}`);
      done();
    });
  });

  it('redirects https error codes', done => {
    let plistID = 'UUsomeChannelIdentifierxxx';
    let scope = nock(plistID, {
      error: true,
    });
    YTPL(plistID, { limit: Infinity }, err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'Status code: 400');
      scope.done();
      done();
    });
  });

  it('returns promise without callback', done => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = nock(plistID, {
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
    let scope = nock(plistID, {
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
    let scope = nock(plistID, {
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
    let scope = nock(plistID, {
      page_type: 'multiple_page',
      pages: [1, 2, 3],
    });
    YTPL(plistID, { limit: 0 }).then(resp => {
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
    let scope = nock(plistID, {
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
    let scope = nock(plistID, {
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

describe('validateURL()', () => {
  it('recognises user link', done => {
    ASSERT.strictEqual(YTPL.validateURL('www.youtube.com/user/someUser'), true);
    done();
  });

  it('recognises channel link', done => {
    ASSERT.strictEqual(YTPL.validateURL('youtube.com/channel/UC0123456789ABCDEFGHIJKLMNOPQRS'), true);
    done();
  });

  it('recognises playlist links', done => {
    ASSERT.strictEqual(YTPL.validateURL('http://www.youtube.com/playlist?list=PL0123456789ASDFGHJK'), true);
    done();
  });

  it('recognises playlist id\'s', done => {
    ASSERT.strictEqual(YTPL.validateURL('PL0123456789ASDFGHJK'), true);
    done();
  });

  it('recognises album id\'s', done => {
    ASSERT.strictEqual(YTPL.validateURL('OLAK5uy_0123456789ABCDEFGHIJKLMNOPQRSTUVW'), true);
    done();
  });

  it('recognises channel id\'s', done => {
    ASSERT.strictEqual(YTPL.validateURL('UC0123456789ABCDEFGHIJKLMNOPQRS'), true);
    done();
  });

  it('fails for videos', done => {
    ASSERT.strictEqual(YTPL.validateURL('youtube.com/watch?v=asdf1234'), false);
    done();
  });

  it('fails for random strings', done => {
    ASSERT.strictEqual(YTPL.validateURL('asdfagasdas'), false);
    done();
  });
});
