const nonfirstpage = require('../lib/nonfirstpage');
const nock      = require('./nock')
const fs        = require('fs');
const path      = require('path');
const assert    = require('assert-diff');

describe('nonfirstpage()', () => {
  it('parse nonfirstpage', (done) => {
    let scope = nock({
      page_type: 'multiple_page',
      pages: [3]
    });
    nonfirstpage.get_nonfirstpage('/browse_ajax?action_continuation=1&continuation=whatup&getpage=2', {}, (err, dataIn) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.deepEqual(dataIn[25], {
        "id": "KIMWgaH3sW0",
        "url": "https://www.youtube.com/watch?v=KIMWgaH3sW0&t=0s&list=PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK&index=126",
        "url_simple": "https://www.youtube.com/watch?v=KIMWgaH3sW0",
        "title": "LarsM & Side-B ft. Aloma Steele - Over (Dropouts Remix) [NCS Release]",
        "thumbnail": "https://i.ytimg.com/vi/KIMWgaH3sW0/hqdefault.jpg",
        "duration": "3:30",
        "author": {
          "name": "NoCopyrightSounds",
          "ref": "https://www.youtube.com/user/NoCopyrightSounds"
        }
      });
      scope.done();
      done();
    });
  });

  it('try recursion of nonfirstpage', (done) => {
    let scope = nock({
      page_type: 'multiple_page',
      pages: [2,3]
    });
    nonfirstpage.get_nonfirstpage('/browse_ajax?action_continuation=1&continuation=whatup&getpage=1', {}, (err, dataIn) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.deepEqual(dataIn[125], {
        "id": "KIMWgaH3sW0",
        "url": "https://www.youtube.com/watch?v=KIMWgaH3sW0&t=0s&list=PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK&index=126",
        "url_simple": "https://www.youtube.com/watch?v=KIMWgaH3sW0",
        "title": "LarsM & Side-B ft. Aloma Steele - Over (Dropouts Remix) [NCS Release]",
        "thumbnail": "https://i.ytimg.com/vi/KIMWgaH3sW0/hqdefault.jpg",
        "duration": "3:30",
        "author": {
          "name": "NoCopyrightSounds",
          "ref": "https://www.youtube.com/user/NoCopyrightSounds"
        }
      });
      scope.done();
      done();
    });
  });

  it('test limit', (done) => {
    let scope = nock({
      page_type: 'multiple_page',
      pages: [3]
    });
    nonfirstpage.get_nonfirstpage('/browse_ajax?action_continuation=1&continuation=whatup&getpage=2', {limit:10}, (err, dataIn) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.equal(dataIn.length, 10);
      scope.done();
      done();
    });
  });

  it('test limit with recursion', (done) => {
    let scope = nock({
      page_type: 'multiple_page',
      pages: [2,3]
    });
    nonfirstpage.get_nonfirstpage('/browse_ajax?action_continuation=1&continuation=whatup&getpage=1', {limit:110}, (err, dataIn) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.equal(dataIn.length, 110);
      scope.done();
      done();
    });
  });
});
