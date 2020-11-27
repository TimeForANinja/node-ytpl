const PATH = require('path');
const FS = require('fs');
const URL = require('url');
const UTIL = require('./utils.js');

const SKIP_TYPES = ['continuationItemRenderer'];

const BASE_VIDEO_URL = 'https://www.youtube.com/watch?v=';

const parseItem = item => {
  const type = Object.keys(item)[0];
  if (SKIP_TYPES.includes(type)) return null;
  else if (type !== 'playlistVideoRenderer') throw new Error(`unexpected type "${type}"`);

  let info = item[type];
  if (!info || !info.shortBylineText || info.upcomingEventData) return null;
  const isLive = info.thumbnailOverlays.some(a =>
    a.thumbnailOverlayTimeStatusRenderer &&
    a.thumbnailOverlayTimeStatusRenderer.style === 'LIVE');
  const author = info.shortBylineText.runs[0];

  return {
    title: UTIL.parseText(info.title),
    index: UTIL.parseIntegerFromText(info.index),
    id: info.videoId,
    shortUrl: BASE_VIDEO_URL + info.videoId,
    author: {
      ref: URL.resolve(BASE_VIDEO_URL, author.navigationEndpoint.commandMetadata.webCommandMetadata.url),
      channelID: author.navigationEndpoint.browseEndpoint.browseId,
      name: author.text,
    },
    url: URL.resolve(BASE_VIDEO_URL, info.navigationEndpoint.commandMetadata.webCommandMetadata.url),
    thumbnails: info.thumbnail.thumbnails.sort((a, b) => b.width - a.width),
    bestThumbnail: info.thumbnail.thumbnails.sort((a, b) => b.width - a.width)[0],
    thumbnail: info.thumbnail.thumbnails.sort((a, b) => b.width - a.width)[0].url,
    isLive,
    duration: !info.lengthText ? null : UTIL.parseText(info.lengthText),
    // No idea what this represents - guess a video that youtube hasn't recompiled yet
    isPlayable: info.isPlayable,
  };
};

const catchAndLog_parseItem = item => {
  try {
    return parseItem(item);
  } catch (e) {
    const dir = PATH.resolve(__dirname, '../dumps/');
    const file = PATH.resolve(dir, `${Math.random().toString(36).substr(3)}-${Date.now()}.txt`);
    const cfg = PATH.resolve(__dirname, '../package.json');
    const bugsRef = require(cfg).bugs.url;

    if (!FS.existsSync(dir)) FS.mkdirSync(dir);
    FS.writeFileSync(file, JSON.stringify(item, null, 2));
    /* eslint-disable no-console */
    const ePrint = `failed to parse Playlist-Item: ${e.message}`;
    console.error(`\n/${'*'.repeat(200)}`);
    console.error(ePrint);
    console.error(`pls post the the files in ${dir} to ${bugsRef}`);
    console.error(`${'*'.repeat(200)}\\`);
    /* eslint-enable no-console */
    return null;
  }
};
module.exports = catchAndLog_parseItem;
