const URL = require('url');
const ENTITIES = require('html-entities').AllHtmlEntities;

const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=';

// eslint-disable-next-line max-len
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36';
const DEFAULT_HEADERS = { 'user-agent': DEFAULT_USER_AGENT };
const DEFAULT_OPTIONS = { limit: 100, headers: DEFAULT_HEADERS };

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

exports.URLquery = '&hl=en&disable_polymer=true';

// eslint-disable-next-line max-len
const AUTHOR_REFLINK_REGEXP = /<ul class="pl-header-details"><li>(.*?(?=<\/li>))<\/li><li>(.*?)(?=<\/li>)<\/li><li>(.*?(?=<\/li>))<\/li>(<li>(.*?(?=<\/li>))<\/li>)?/;
// eslint-disable-next-line max-len
const PLAYLIST_NAME_REGEXP = /<h1 class="pl-header-title[^"]*" tabindex="0">\r?\n[\s]*(.*?(?=\r?\n))\r?\n[\s]+(<\/h1>|<div)/;
// Parses the header information of a playlist
exports.getGeneralInfo = (body, plistID) => {
  const importantTxt = between(body, 'branded-page-box clearfix', '<div class="playlist-auxiliary-actions">');
  const authorMatch = importantTxt.match(AUTHOR_REFLINK_REGEXP);
  const description = removeHtml(between(
    importantTxt,
    '<span class="pl-header-description-text" tabindex="0">',
    '</span>').replace(/<button class="yt-uix-button[\s\S]+/, ''));

  const isAlbum = !authorMatch[4];
  if (isAlbum) authorMatch.unshift(null);

  const hasUser = importantTxt.includes('/user/');

  return {
    id: plistID,
    url: PLAYLIST_URL + plistID,
    title: removeHtml(importantTxt.match(PLAYLIST_NAME_REGEXP)[1]),
    visibility: importantTxt.includes('data-tooltip-text="') ? 'link only' : 'everyone',
    description: !description ? null : removeHtml(description),
    total_items: Number(authorMatch[2].replace(/\D/g, '')),
    views: Number(authorMatch[3].replace(/\D/g, '')),
    last_updated: isAlbum ? authorMatch[4] : authorMatch[5],
    author: isAlbum ? null : {
      id: between(importantTxt, 'data-all-playlists-url="/channel/', '/playlists"'),
      name: removeHtml(between(authorMatch[1], '>', '</a>')),
      avatar: between(body, '<img class="channel-header-profile-image" src="', '" title="'),
      user: !hasUser ? null : between(authorMatch[1], 'href="/user/', '"'),
      channel_url: URL.resolve(
        PLAYLIST_URL,
        `/channel/${exports.between(importantTxt, 'data-all-playlists-url="/channel/', '/playlists"')}`,
      ),
      user_url: !hasUser ? null : URL.resolve(PLAYLIST_URL, between(authorMatch[1], 'href="', '"')),
    },
    // Added here so that we don't create ghost object definitions in memory
    nextpage: null,
    items: [],
  };
};

// Splits out the video container
exports.getVideoContainers = body => body
  .substring(body.indexOf('<tr class="'), body.lastIndexOf('</tr>'))
  .split('<tr')
  .splice(1);

exports.buildVideoObject = videoString => {
  const authorBox = between(videoString, '<div class="pl-video-owner">', '</div>');
  const baseUrl = URL.resolve(PLAYLIST_URL, removeHtml(between(videoString, 'href="', '"')));
  const authorMatch = authorBox.match(/<a[^>]*>(.*)(?=<\/a>)/);
  return {
    id: URL.parse(baseUrl, true).query.v,
    url: baseUrl,
    url_simple: `https://www.youtube.com/watch?v=${URL.parse(baseUrl, true).query.v}`,
    title: removeHtml(between(videoString, 'data-title="', '"')),
    thumbnail: URL.resolve(PLAYLIST_URL, between(videoString, 'data-thumb="', '"').split('?')[0]),
    duration: videoString.includes('<div class="timestamp">') ?
      videoString.match(/<span aria-label="[^"]+">(.*?(?=<\/span>))<\/span>/)[1] :
      null,
    author: !authorMatch ? null : {
      name: removeHtml(authorMatch[0]),
      ref: URL.resolve(PLAYLIST_URL, between(authorBox, 'href="', '"')),
    },
  };
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

// Cleans up html text
const removeHtml = exports.removeHtml = string => new ENTITIES().decode(
  string.replace(/\n\r?/g, ' ')
    .replace(/\s*<\s*br\s*\/?\s*>\s*/gi, '\n')
    .replace(/<\s*\/\s*p\s*>\s*<\s*p[^>]*>/gi, '\n')
    .replace(/<.*?>/gi, '')).trim();
