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
      FIRSTPAGE(plistID, { limit: 4, headers: {} }).then(dataIn => {
        ASSERT.deepEqual(dataIn, JSON.parse(dataOut));
        scope.done();
        done();
      }).catch(errIn => {
        scope.ifError(errIn);
        ASSERT.ifError(errIn);
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
      FIRSTPAGE(plistID, { limit: 2, headers: {} }).then(dataIn => {
        const parsedDataOut = JSON.parse(dataOut);
        parsedDataOut.items.splice(2, 2);
        ASSERT.deepEqual(dataIn, parsedDataOut);
        scope.done();
        done();
      }).catch(errIn => {
        scope.ifError(errIn);
        ASSERT.ifError(errIn);
      });
    });
  });

  it('parse nextpage link of double playlist', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1],
    });
    FIRSTPAGE(plistID, { limit: Infinity, headers: {} }).then(dataIn => {
      ASSERT.strictEqual(dataIn.nextpage, '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1');
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('parses correct `x-youtube-client-version` and `x-youtube-client-name` headers', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'multiple_page',
      pages: [1],
    });
    let opt = { limit: Infinity, headers: {} };
    FIRSTPAGE(plistID, opt).then(() => {
      ASSERT.deepEqual(opt.headers, {
        'x-youtube-client-name': '1',
        'x-youtube-client-version': '1.20180503',
      });
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('does not parse headers if nextpage is unavailable', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'single_page',
    });
    FIRSTPAGE(plistID, { limit: Infinity, headers: {} }).then(dataIn => {
      ASSERT.strictEqual(dataIn.headers, undefined);
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('errors when youtube returns an error', done => {
    let plistID = 'someID';
    let scope = NOCK(plistID, {
      page_type: 'error_page',
    });
    FIRSTPAGE(plistID, { limit: Infinity, headers: {} }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.strictEqual(errIn.message, 'The playlist does not exist.');
      scope.done();
      done();
    });
  });
});

describe('firstpage.getClientVersion()', () => {
  it('returns the correct client version', () => {
    ASSERT.strictEqual(
      FIRSTPAGE.getClientVersion(
        'yt.setConfig({INNERTUBE_CONTEXT_CLIENT_VERSION: "1.20200716.00.00",GAPI_HINT_PARAMS:',
      ),
      '1.20200716.00.00',
    );
  });

  it('returns an empty string if `CLIENT_VERSION` is not capital', () => {
    ASSERT.strictEqual(
      FIRSTPAGE.getClientVersion(
        'yt.setConfig({INNERTUBE_CONTEXT_client_version: "1.20200716.00.00",GAPI_HINT_PARAMS:',
      ),
      '',
    );
  });

  it('returns an empty string if not found', () => {
    ASSERT.strictEqual(
      FIRSTPAGE.getClientVersion('should not find anything'),
      '',
    );
  });
});

describe('firstpage.getClientName()', () => {
  it('returns the correct client name', () => {
    ASSERT.strictEqual(
      FIRSTPAGE.getClientName(`Y9_11qcW8",INNERTUBE_CONTEXT_CLIENT_NAME: 1,'VISITOR_DATA': "Cg`),
      '1',
    );
  });

  it('returns an empty string if `CLIENT_NAME` is not capital', () => {
    ASSERT.strictEqual(
      FIRSTPAGE.getClientName(`Y9_11qcW8",INNERTUBE_CONTEXT_client_name: 1,'VISITOR_DATA': "Cg`),
      '',
    );
  });

  it('returns an empty string if not found', () => {
    ASSERT.strictEqual(FIRSTPAGE.getClientName('should not find anything'), '');
  });
});
