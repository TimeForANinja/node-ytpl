const firstpage = require('../lib/firstpage');
const nock      = require('./nock')
const fs        = require('fs');
const path      = require('path');
const assert    = require('assert-diff');

describe('firstpage()', () => {
  it('parses the general information of a playlist', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/firstpage_parsed.json'), (err, dataOut) => {
      assert.ifError(err);
      let plistID = 'someID';
      let scope = nock(plistID, {
        page_type: 'single_page'
      });
      firstpage.get_firstpage(plistID, {limit:4}, (err, dataIn) => {
        scope.ifError(err);
        assert.ifError(err);
        assert.deepEqual(dataIn, JSON.parse(dataOut));
        scope.done();
        done();
      });
    });
  });

  it('use limit param', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/firstpage_parsed.json'), (err, dataOut) => {
      assert.ifError(err);
      let plistID = 'someID';
      let scope = nock(plistID, {
        page_type: 'single_page'
      });
      firstpage.get_firstpage(plistID, {limit:2}, (err, dataIn) => {
        scope.ifError(err);
        assert.ifError(err);
        const parsedDataOut = JSON.parse(dataOut);
        parsedDataOut.items.splice(2,2);
        assert.deepEqual(dataIn, parsedDataOut);
        scope.done();
        done();
      });
    });
  });

  it('parse nextpage link of double playlist', (done) => {
    let plistID = 'someID';
    let scope = nock(plistID, {
      page_type: 'multiple_page',
      pages: [1]
    });
    firstpage.get_firstpage(plistID, {}, (err, dataIn) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.equal(dataIn.nextpage, '/browse_ajax?action_continuation=1&continuation=whatup&getpage=1');
      scope.done();
      done();
    });
  });
});
