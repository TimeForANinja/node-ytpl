/* global describe, it */
const NONFIRSTPAGE = require('../lib/nonfirstpage');
const NOCK = require('./nock');
const ASSERT = require('assert-diff');

describe('nonfirstpage()', () => {
  it('parse nonfirstpage', done => {
    let scope = NOCK({
      page_type: 'multiple_page',
      pages: [3],
    });
    NONFIRSTPAGE(
      '/browse_ajax?action_continuation=1&continuation=whatup&getpage=2',
      { limit: Infinity },
    ).then(dataIn => {
      ASSERT.deepEqual(dataIn[25], {
        id: 'KIMWgaH3sW0',
        url: 'https://www.youtube.com/watch?v=KIMWgaH3sW0&t=0s&list=PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK&index=126',
        url_simple: 'https://www.youtube.com/watch?v=KIMWgaH3sW0',
        title: 'LarsM & Side-B ft. Aloma Steele - Over (Dropouts Remix) [NCS Release]',
        thumbnail: 'https://i.ytimg.com/vi/KIMWgaH3sW0/hqdefault.jpg',
        duration: '3:30',
        author: {
          name: 'NoCopyrightSounds',
          ref: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
      });
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('try recursion of nonfirstpage', done => {
    let scope = NOCK({
      page_type: 'multiple_page',
      pages: [2, 3],
    });
    NONFIRSTPAGE(
      '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1',
      { limit: Infinity },
    ).then(dataIn => {
      ASSERT.deepEqual(dataIn[125], {
        id: 'KIMWgaH3sW0',
        url: 'https://www.youtube.com/watch?v=KIMWgaH3sW0&t=0s&list=PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK&index=126',
        url_simple: 'https://www.youtube.com/watch?v=KIMWgaH3sW0',
        title: 'LarsM & Side-B ft. Aloma Steele - Over (Dropouts Remix) [NCS Release]',
        thumbnail: 'https://i.ytimg.com/vi/KIMWgaH3sW0/hqdefault.jpg',
        duration: '3:30',
        author: {
          name: 'NoCopyrightSounds',
          ref: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
      });
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('test limit', done => {
    let scope = NOCK({
      page_type: 'multiple_page',
      pages: [3],
    });
    NONFIRSTPAGE(
      '/browse_ajax?action_continuation=1&continuation=whatup&getpage=2',
      { limit: 10 },
    ).then(dataIn => {
      ASSERT.strictEqual(dataIn.length, 10);
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('test limit with recursion', done => {
    let scope = NOCK({
      page_type: 'multiple_page',
      pages: [2, 3],
    });
    NONFIRSTPAGE(
      '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1',
      { limit: 110 },
    ).then(dataIn => {
      ASSERT.strictEqual(dataIn.length, 110);
      scope.done();
      done();
    }).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.ifError(errIn);
    });
  });

  it('errors if `statusCode` is not 200', done => {
    let scope = NOCK({
      page_type: 'multiple_page',
      pages: [2],
      statusCode: 403,
    });
    NONFIRSTPAGE(
      '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1',
      { limit: Infinity },
    ).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.strictEqual(errIn.message, 'Status code: 403');
      scope.done();
      done();
    });
  });

  it('errors if json was invalid', done => {
    let scope = NOCK({
      page_type: 'error_page',
      invalid_json: true,
    });
    NONFIRSTPAGE(
      '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1',
      { limit: Infinity },
    ).catch(errIn => {
      scope.ifError(errIn);
      ASSERT.strictEqual(errIn.message, 'Unexpected token i in JSON at position 0');
      scope.done();
      done();
    });
  });
});
