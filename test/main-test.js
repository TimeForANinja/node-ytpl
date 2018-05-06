/* global describe, it */
const YTPL = require('..');
const nock = require('./nock');
const ASSERT = require('assert-diff');

describe('main()', () => {
  it('try with invalid id', done => {
    let plistID = 'someID';
    YTPL(plistID, err => {
      ASSERT.equal(err.message, `Unable to find a id in ${plistID}`);
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
      ASSERT.equal(err.message, 'Status code: 400');
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
      ASSERT.equal(err.message, 'Status code: 400');
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
      ASSERT.equal(resp.items.length, 100);
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
      ASSERT.equal(resp.items.length, 200);
      scope.done();
      done();
    }).catch(err => {
      scope.ifError(err);
      ASSERT.ifError(err);
    });
  });
});
