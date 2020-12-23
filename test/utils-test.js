/* global describe, it, before, after */
const ASSERT = require('assert-diff');
ASSERT.options.strict = true;
const UTILS = require('../lib/utils.js');
const FS = require('fs');
const PATH = require('path');
const NOCK = require('nock');

describe('utils.parseBody()', () => {
  const data_dir = 'test/pages/';
  const data = FS.readdirSync(data_dir)
    .filter(a => a.startsWith('findJSON'))
    .map(a => PATH.resolve(data_dir, a))
    .map(x => FS.readFileSync(x, 'utf8'));

  it('json is the parsed data', () => {
    for (let i = 0; i < data.length; i++) {
      const resp = UTILS.parseBody(data[i]);
      ASSERT.deepEqual(
        resp.json,
        { data: 'data' },
        `json unequal for variation ${(i + 1).toString().padStart(2, '0')}`,
      );
    }
  });

  it('json is null if unable to parse', () => {
    const resp = UTILS.parseBody('just some not compatible string');
    ASSERT.equal(resp.json, null);
  });

  it('provides a default context object', () => {
    for (let i = 0; i < data.length; i++) {
      const resp = UTILS.parseBody(data[i]);
      ASSERT.deepEqual(resp.context, {
        client: {
          utcOffsetMinutes: 0,
          gl: 'US',
          hl: 'en',
          clientName: 'WEB',
          clientVersion: '<client_version>',
        },
        user: {},
        request: {},
      }, `default context object unequal for variation ${(i + 1).toString().padStart(2, '0')}`);
    }
  });

  it('provides a valid apiKey', () => {
    for (let i = 0; i < data.length; i++) {
      const resp = UTILS.parseBody(data[i]);
      ASSERT.equal(resp.apiKey, '<apikey>', `apiKey unequal for variation ${(i + 1).toString().padStart(2, '0')}`);
    }
  });

  it('overwrites hl & gl in context', () => {
    for (let i = 0; i < data.length; i++) {
      const resp = UTILS.parseBody(data[i], { hl: 'AA', gl: 'BB' });
      ASSERT.deepEqual(resp.context.client, {
        utcOffsetMinutes: 0,
        gl: 'BB',
        hl: 'AA',
        clientName: 'WEB',
        clientVersion: '<client_version>',
      }, `context#client unequal for variation ${(i + 1).toString().padStart(2, '0')}`);
    }
  });
});

describe('utils.parseText()', () => {
  it('parses from simpleText', () => {
    ASSERT.equal(
      UTILS.parseText({ simpleText: 'simpleText' }),
      'simpleText',
    );
  });

  it('parges from runs', () => {
    ASSERT.equal(
      UTILS.parseText({ runs: [{ text: 'a ' }, { text: 'b' }, { text: ' c' }] }),
      'a b c',
    );
  });

  it('prefers simpleText over runs', () => {
    ASSERT.equal(
      UTILS.parseText({ simpleText: 'simpleText', runs: [{ text: 'a' }] }),
      'simpleText',
    );
  });
});

describe('utils.parseIntegerFromText()', () => {
  it('parse from simpleText', () => {
    ASSERT.equal(
      UTILS.parseIntegerFromText({ simpleText: '4' }),
      4,
    );
  });

  it('parse from runs', () => {
    ASSERT.equal(
      UTILS.parseIntegerFromText({ runs: [{ text: '4' }] }),
      4,
    );
  });

  it('parses american-formatted numbers', () => {
    ASSERT.equal(UTILS.parseIntegerFromText({ simpleText: '4,000,123' }), 4000123);
  });

  it('parses european-formatted numbers', () => {
    ASSERT.equal(UTILS.parseIntegerFromText({ simpleText: '4.000.123' }), 4000123);
  });

  it('ignores leading strings', () => {
    ASSERT.equal(UTILS.parseIntegerFromText({ simpleText: 'views: 420' }), 420);
  });

  it('ignores following strings', () => {
    ASSERT.equal(UTILS.parseIntegerFromText({ simpleText: '420 viewers' }), 420);
  });

  it('parses encased strings', () => {
    ASSERT.equal(UTILS.parseIntegerFromText({ simpleText: 'viewed 420 times' }), 420);
  });
});

describe('utils.checkArgs()', () => {
  it('errors without parameter', () => {
    ASSERT.throws(() => {
      UTILS.checkArgs();
    }, /playlist ID is mandatory/);
  });

  it('errors when parameter is an empty string', () => {
    ASSERT.throws(() => {
      UTILS.checkArgs('');
    }, /playlist ID is mandatory/);
  });

  it('errors when parameter is not a string', () => {
    ASSERT.throws(() => {
      UTILS.checkArgs(1337);
    }, /playlist ID must be of type string/);
  });

  it('returns default options', () => {
    ASSERT.deepEqual(
      UTILS.checkArgs('playlistID'),
      {
        query: {
          list: 'playlistID',
          hl: 'en',
          gl: 'US',
        },
        requestOptions: {},
        limit: 100,
      },
    );
  });

  it('overwrites gl & hl options', () => {
    const options = { gl: 'AA', hl: 'bb' };
    ASSERT.deepEqual(
      UTILS.checkArgs('playlistID', options).query,
      {
        list: 'playlistID',
        hl: 'bb',
        gl: 'AA',
      },
    );
  });

  it('uses default limit if limit < 0', () => {
    const opts = UTILS.checkArgs('searchString', { limit: -3 });
    ASSERT.equal(opts.limit, 100);
  });

  it('uses default limit if limit is exactly 0', () => {
    const opts = UTILS.checkArgs('searchString', { limit: 0 });
    ASSERT.equal(opts.limit, 100);
  });

  it('keeps custom limits', () => {
    const opts = UTILS.checkArgs('searchString', { limit: 25 });
    ASSERT.equal(opts.limit, 25);
  });

  it('accepts Infinity as limit', () => {
    const opts = UTILS.checkArgs('searchString', { limit: Infinity });
    ASSERT.equal(opts.limit, Infinity);
  });

  it('does not alter request Options', () => {
    const opts = { hl: 'hl', gl: 'gl', limit: 123, requestOptions: { test: 'test' } };
    UTILS.checkArgs('searchString', opts);
    ASSERT.deepEqual(opts.requestOptions, { test: 'test' });
  });

  it('unlinks requestOptions#headers', () => {
    const options = { requestOptions: { headers: { Cookie: ['cookie1'] } }, safeSearch: true };
    UTILS.checkArgs('searchString', options);
    ASSERT.deepEqual(options.requestOptions.headers.Cookie, ['cookie1']);
  });

  it('keeps agent object', () => {
    // Check that not everything is unlinked
    class test {}
    const opts = {
      safeSearch: true,
      hl: 'hl',
      gl: 'gl',
      limit: 123,
      requestOptions: { agent: new test(), test: 'test' },
    };
    UTILS.checkArgs('searchString', opts);
    ASSERT.ok(opts.requestOptions.agent instanceof test);
  });

  it('removes limit if pages are provided', () => {
    const opts = { hl: 'hl', gl: 'gl', limit: 123, pages: 2, requestOptions: { test: 'test' } };
    const r = UTILS.checkArgs('searchString', opts);
    ASSERT.equal(r.limit, Infinity);
    ASSERT.equal(r.pages, 2);
  });
});

describe('utils.prepImg()', () => {
  it('sorts in descending order', () => {
    const images = [{ width: 10 }, { width: 20 }, { width: 30 }];
    const preped = UTILS.prepImg(images);
    ASSERT.deepEqual(preped.map(x => x.width), [30, 20, 10]);
  });

  it('does not crash for empty arrays', () => {
    const images = [];
    const preped = UTILS.prepImg(images);
    ASSERT.deepEqual(preped, []);
  });

  it('defaults urls to null', () => {
    const images = [{}];
    const preped = UTILS.prepImg(images);
    ASSERT.deepEqual(preped[0].url, null);
  });

  it('normalizes links', () => {
    const images = [{ url: '//test.com' }];
    const preped = UTILS.prepImg(images);
    ASSERT.equal(preped[0].url, 'https://test.com/');
  });
});

describe('utils.jsonAfter()', () => {
  it('`left` positioned at the start', () => {
    ASSERT.deepEqual(UTILS._hidden.jsonAfter('{"a": 1, "b": 1}asdf', ''), { a: 1, b: 1 });
  });

  it('somewhere in the middle', () => {
    ASSERT.deepEqual(UTILS._hidden.jsonAfter('test{"a": 1, "b": 1}test', 'test'), { a: 1, b: 1 });
  });

  it('ending with string end', () => {
    ASSERT.deepEqual(UTILS._hidden.jsonAfter('test{"a": 1, "b": 1}', 'test'), { a: 1, b: 1 });
  });

  it('invalid json', () => {
    ASSERT.equal(UTILS._hidden.jsonAfter('test{"a": 1, [] "b": 1}test', 'test'), null);
  });

  it('null if no json', () => {
    ASSERT.equal(UTILS._hidden.jsonAfter('test', 'test'), null);
  });
});

// Property of https://github.com/fent/node-ytdl-core/blob/master/test/utils-test.js
describe('utils.between()', () => {
  it('`left` positioned at the start', () => {
    const rs = UTILS._hidden.between('<b>hello there friend</b>', '<b>', '</b>');
    ASSERT.deepEqual(rs, 'hello there friend');
  });

  it('somewhere in the middle', () => {
    const rs = UTILS._hidden.between('something everything nothing', ' ', ' ');
    ASSERT.deepEqual(rs, 'everything');
  });

  it('not found', () => {
    const rs = UTILS._hidden.between('oh oh _where_ is it', '<b>', '</b>');
    ASSERT.deepEqual(rs, '');
  });

  it('`right` before `left`', () => {
    const rs = UTILS._hidden.between('>>> a <this> and that', '<', '>');
    ASSERT.deepEqual(rs, 'this');
  });

  it('`right` not found', () => {
    const rs = UTILS._hidden.between('something [around[ somewhere', '[', ']');
    ASSERT.deepEqual(rs, '');
  });
});

// Property of https://github.com/fent/node-ytdl-core/blob/master/test/utils-test.js
describe('utils.cutAfterJSON()', () => {
  it('Works with simple JSON', () => {
    ASSERT.deepEqual(UTILS._hidden.cutAfterJSON('{"a": 1, "b": 1}'), '{"a": 1, "b": 1}');
  });
  it('Cut extra characters after JSON', () => {
    ASSERT.deepEqual(UTILS._hidden.cutAfterJSON('{"a": 1, "b": 1}abcd'), '{"a": 1, "b": 1}');
  });
  it('Tolerant to string constants', () => {
    ASSERT.deepEqual(UTILS._hidden.cutAfterJSON('{"a": "}1", "b": 1}abcd'), '{"a": "}1", "b": 1}');
  });
  it('Tolerant to string with escaped quoting', () => {
    ASSERT.deepEqual(UTILS._hidden.cutAfterJSON('{"a": "\\"}1", "b": 1}abcd'), '{"a": "\\"}1", "b": 1}');
  });
  it('works with nested', () => {
    ASSERT.deepEqual(
      UTILS._hidden.cutAfterJSON('{"a": "\\"1", "b": 1, "c": {"test": 1}}abcd'),
      '{"a": "\\"1", "b": 1, "c": {"test": 1}}',
    );
  });
  it('Works with utf', () => {
    ASSERT.deepEqual(
      UTILS._hidden.cutAfterJSON('{"a": "\\"фыва", "b": 1, "c": {"test": 1}}abcd'),
      '{"a": "\\"фыва", "b": 1, "c": {"test": 1}}',
    );
  });
  it('Works with \\\\ in string', () => {
    ASSERT.deepEqual(
      UTILS._hidden.cutAfterJSON('{"a": "\\\\фыва", "b": 1, "c": {"test": 1}}abcd'),
      '{"a": "\\\\фыва", "b": 1, "c": {"test": 1}}',
    );
  });
  it('Works with [ as start', () => {
    ASSERT.deepEqual(
      UTILS._hidden.cutAfterJSON('[{"a": 1}, {"b": 2}]abcd'),
      '[{"a": 1}, {"b": 2}]',
    );
  });
  it('Returns an error when not beginning with [ or {', () => {
    ASSERT.throws(() => {
      UTILS._hidden.cutAfterJSON('abcd]}');
    }, /Can't cut unsupported JSON \(need to begin with \[ or { \) but got: ./);
  });
  it('Returns an error when missing closing bracket', () => {
    ASSERT.throws(() => {
      UTILS._hidden.cutAfterJSON('{"a": 1,{ "b": 1}');
    }, /Can't cut unsupported JSON \(no matching closing bracket found\)/);
  });
});

describe('utils.doPost()', () => {
  before(() => {
    NOCK.disableNetConnect();
  });

  after(() => {
    NOCK.enableNetConnect();
  });

  it('uses default parameters', async() => {
    const receive = { success: true };
    const scope = NOCK('https://test.com')
      .post('/api')
      .reply(200, receive);
    const resp = await UTILS.doPost('https://test.com/api');
    ASSERT.deepEqual(resp, receive);
    scope.done();
  });

  it('uses method post & passes payloads', async() => {
    const send = { test: true };
    const receive = { success: true };
    const scope = NOCK('https://test.com')
      .post('/api', JSON.stringify(send))
      .reply(200, receive);
    const resp = await UTILS.doPost('https://test.com/api', send);
    ASSERT.deepEqual(resp, receive);
    scope.done();
  });
});
