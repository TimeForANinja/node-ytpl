/* global describe, it, before, after */
const YTPL = require('../');
const ASSERT = require('assert-diff');
ASSERT.options.strict = true;
const NOCK = require('nock');

describe('e2e', function e2e() {
  this.timeout(0);

  before(() => {
    NOCK.enableNetConnect();
  });

  after(() => {
    NOCK.disableNetConnect();
  });

  it('search for NoCopyrightSounds Uploads', async() => {
    const search = await YTPL('https://www.youtube.com/user/NoCopyrightSounds', { limit: 125 });
    ASSERT.equal(search.id, 'UU_aEa8K-EOJ3D6gOs7HcyNg');
    // Check if limit worked
    ASSERT.equal(search.items.length, 125);
  });
});
