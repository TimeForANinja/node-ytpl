/* global describe, it, before, after */
const YTPL = require('../');
const ASSERT = require('assert').strict;
const NOCK = require('nock');

describe('e2e', function e2e() {
  this.timeout(0);

  before(() => {
    NOCK.enableNetConnect();
  });

  after(() => {
    NOCK.disableNetConnect();
  });

  it('gets Uploads from NoCopyrightSounds playlist', async() => {
    const playlist = await YTPL('UU_aEa8K-EOJ3D6gOs7HcyNg');
    ASSERT.strictEqual(playlist.title, 'Uploads from NoCopyrightSounds');
    ASSERT.ok(playlist.items.length > 0);
  });
});
