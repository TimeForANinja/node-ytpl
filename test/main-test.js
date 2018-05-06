const ytpl   = require('..');
const nock   = require('./nock')
const fs     = require('fs');
const path   = require('path');
const assert = require('assert-diff');

describe('main()', () => {
  it('try with invalid id', (done) => {
    let plistID = 'someID';
    ytpl(plistID, (err, dataIn) => {
      assert.equal(err.message, 'Unable to find a id in '+plistID);
      done();
    });
  });

  it('redirects https error codes', (done) => {
    let plistID = 'UUsomeChannelIdentifierxxx';
    let scope = nock(plistID, {
      error: true
    });
    ytpl(plistID, {limit:Infinity}, (err, dataIn) => {
      scope.ifError(err);
      assert.equal(err.message, 'Status code: 400');
      scope.done();
      done();
    });
  });

  it('returns promise without callback', (done) => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = nock(plistID, {
      error: true
    });
    let resp = ytpl(plistID).catch(err => {
      scope.ifError(err);
      assert.ok(resp instanceof Promise);
      assert.equal(err.message, 'Status code: 400')
      scope.done();
      done();
    });
  });

  it('overwrites invalid options', (done) => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = nock(plistID, {
      page_type: 'multiple_page',
      pages: [1]
    });
    ytpl(plistID, 'some bullshit').then(resp => {
      assert.equal(resp.items.length, 100);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      assert.ifError(err);
    });
  })

  it('handles limits', (done) => {
    let plistID = 'UU_someChannelIdentifier';
    let scope = nock(plistID, {
      page_type: 'multiple_page',
      pages: [1,2]
    });
    ytpl(plistID, {limit: 200}).then(resp => {
      assert.equal(resp.items.length, 200);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      assert.ifError(err);
    });
  });
});
