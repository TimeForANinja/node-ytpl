const DEFAULT_OPTIONS = { limit: 100 };
const DEFAULT_CONTEXT = {
  client: {
    utcOffsetMinutes: 0,
    gl: 'US',
    hl: 'en',
    clientName: 'WEB',
    clientVersion: '<important information>',
  },
  user: {},
  request: {},
};

// Guarantee that all arguments are valid
exports.checkArgs = (linkOrId, options) => {
  // Validation
  if (!linkOrId) {
    throw new Error('linkOrId is mandatory');
  }

  // Normalisation
  let obj = Object.assign({}, DEFAULT_OPTIONS, options);
  if (isNaN(obj.limit) || obj.limit <= 0) obj.limit = DEFAULT_OPTIONS.limit;
  return obj;
};

// Taken from https://github.com/fent/node-ytdl-core/
const between = exports.between = (haystack, left, right) => {
  let pos;
  pos = haystack.indexOf(left);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(pos + left.length);
  if (!right) { return haystack; }
  pos = haystack.indexOf(right);
  if (pos === -1) { return ''; }
  haystack = haystack.slice(0, pos);
  return haystack;
};

exports.parseBody = body => {
  const str = between(body, 'window["ytInitialData"] = ', ';\n');
  const apiKey = between(body, 'INNERTUBE_API_KEY":"', '"') || between(body, 'innertubeApiKey":"', '"');
  const clientVersion = between(body, 'INNERTUBE_CONTEXT_CLIENT_VERSION":"', '"') ||
    between(body, 'innertube_context_client_version":"', '"');
  const context = JSON.parse(JSON.stringify(DEFAULT_CONTEXT));
  context.client.clientVersion = clientVersion;
  return { json: JSON.parse(str || null), apiKey, context };
};

// Request Utility
exports.doPost = (url, reqOpts, payload) => new Promise(resolve => {
  // Enforce POST-Request
  reqOpts.method = 'POST';
  const req = require('https').request(url, reqOpts);
  req.on('response', resp => {
    const body = [];
    resp.on('data', chunk => body.push(chunk));
    resp.on('end', () => {
      resolve(JSON.parse(Buffer.concat(body).toString()));
    });
  });
  req.write(JSON.stringify(payload));
  req.end();
});

// Parsing utility
const parseText = exports.parseText = txt => txt.simpleText || txt.runs.map(a => a.text).join('');

exports.parseNumFromText = txt => Number(parseText(txt).replace(/\D+/g, ''));
