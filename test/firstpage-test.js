/* global describe, it */
const FIRSTPAGE = require('../lib/firstpage');
const NOCK = require('./nock');
const FS = require('fs');
const PATH = require('path');
const ASSERT = require('assert-diff');

describe('firstpage()', () => {
  it('parses the general information of a playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/firstpage_parsed.json'), (err, dataOut) => {
      ASSERT.ifError(err);
      let plistID = 'someID';
      let scope = NOCK(plistID, {
        page_type: 'single_page',
      });
      FIRSTPAGE(plistID, { limit: 4 }, (errIn, dataIn) => {
        scope.ifError(errIn);
        ASSERT.ifError(errIn);
        ASSERT.deepEqual(dataIn, JSON.parse(dataOut));
        scope.done();
        done();
      });
    });
  });

  it('use limit param', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/firstpage_parsed.json'), (err, dataOut) => {
      ASSERT.ifError(err);
      let plistID = 'someID';
      let scope = NOCK(plistID, {
        page_type: 'single_page',
      });
      FIRSTPAGE(plistID, { limit: 2 }, (errIn, dataIn) => {
        scope.ifError(errIn);
        ASSERT.ifError(errIn);
        const parsedDataOut = JSON.parse(dataOut);
        parsedDataOut.items.splice(2, 2);
        ASSERT.deepEqual(dataIn, parsedDataOut);
        scope.done();
        done();
      });
    });
  });

  it('parse nextpage link of double playlist', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1],
    });
    FIRSTPAGE(plistID, {}, (err, dataIn) => {
      scope.ifError(err);
      ASSERT.ifError(err);
      ASSERT.strictEqual(dataIn.nextpage, '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1');
      scope.done();
      done();
    });
  });

  it('parses correct `x-youtube-client-version` and `x-youtube-client-name` headers', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1],
    });
    FIRSTPAGE(plistID, {}, (err, dataIn) => {
      scope.ifError(err);
      ASSERT.ifError(err);
      ASSERT.deepEqual(dataIn.headers, {
        'x-youtube-client-name': '1',
        'x-youtube-client-version': '1.20180503',
      });
      scope.done();
      done();
    });
  });

  it('does not parse headers if nextpage is unavailable', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'single_page',
    });
    FIRSTPAGE(plistID, {}, (err, dataIn) => {
      scope.ifError(err);
      ASSERT.ifError(err);
      ASSERT.strictEqual(dataIn.headers, undefined);
      scope.done();
      done();
    });
  });

  it('errors when youtube returns an error', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'error_page',
    });
    FIRSTPAGE(plistID, {}, err => {
      scope.ifError(err);
      ASSERT.strictEqual(err.message, 'The playlist does not exist.');
      scope.done();
      done();
    });
  });
});
