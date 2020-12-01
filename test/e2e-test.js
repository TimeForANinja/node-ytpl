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

  it('fetch for NoCopyrightSounds Uploads', async() => {
    const search = await YTPL('https://www.youtube.com/user/NoCopyrightSounds', { limit: 225 });
    ASSERT.equal(search.id, 'UU_aEa8K-EOJ3D6gOs7HcyNg');
    // Check if limit worked
    ASSERT.equal(search.items.length, 225);
  });

  it('fetch a Album', async() => {
    const ref = 'https://www.youtube.com/playlist?list=RDCLAK5uy_mfTF5DCHZL0zf04WQdXAd8-1cQuvJZXzs';
    const search = await YTPL(ref, { limit: 105 });
    ASSERT.equal(search.id, 'RDCLAK5uy_mfTF5DCHZL0zf04WQdXAd8-1cQuvJZXzs');
    // Check if indexes worked
    ASSERT.ok(search.items.every(i => i.index === -1));
  });

  it('fetch a non-existing playlist', async() => {
    await ASSERT.rejects(
      YTPL('PL0123456789ABCDEFGHIJKLMNOPQRSTUV'),
      /API-Error: The playlist does not exist\./,
    );
  });
});
