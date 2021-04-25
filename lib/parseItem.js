const PATH = require('path');
const FS = require('fs');
const UTIL = require('./utils.js');

const SKIP_TYPES = ['continuationItemRenderer'];

const BASE_VIDEO_URL = 'https://www.youtube.com/watch?v=';
const prepImg = UTIL.prepImg;

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
    title: UTIL.parseText(info.title, ''),
    index: info.index ? UTIL.parseIntegerFromText(info.index) : -1,
    id: info.videoId,
    shortUrl: BASE_VIDEO_URL + info.videoId,
    url: new URL(info.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
    author: {
      url: new URL(author.navigationEndpoint.commandMetadata.webCommandMetadata.url, BASE_VIDEO_URL).toString(),
      channelID: author.navigationEndpoint.browseEndpoint.browseId,
      name: author.text,
    },
    thumbnails: prepImg(info.thumbnail.thumbnails),
    bestThumbnail: prepImg(info.thumbnail.thumbnails)[0],
    isLive,
    duration: !info.lengthText ? null : UTIL.parseText(info.lengthText),
    durationSec: Number(info.lengthSeconds) || null,
    // No idea what this represents - guess a video that youtube hasn't recompiled yet
    isPlayable: info.isPlayable,
  };
};

const catchAndLogFunc = (func, params = []) => {
  if (!Array.isArray(params)) throw new Error('params has to be an (optionally empty) array');
  try {
    return func(...params);
  } catch (e) {
    const dir = PATH.resolve(__dirname, '../dumps/');
    const file = PATH.resolve(dir, `${Math.random().toString(36).substr(3)}-${Date.now()}.txt`);
    const cfg = PATH.resolve(__dirname, '../package.json');
    const bugsRef = require(cfg).bugs.url;

    if (!FS.existsSync(dir)) FS.mkdirSync(dir);
    FS.writeFileSync(file, JSON.stringify(params, null, 2));
    /* eslint-disable no-console */
    console.error(e.stack);
    console.error(`\n/${'*'.repeat(200)}`);
    console.error(`failed at func ${func.name}: ${e.message}`);
    console.error(`pls post the the files in ${dir} to ${bugsRef}`);
    let info = `os: ${process.platform}-${process.arch}, `;
    info += `node.js: ${process.version}, `;
    info += `ytpl: ${require('../package.json').version}`;
    console.error(info);
    console.error(`${'*'.repeat(200)}\\`);
    /* eslint-enable no-console */
    return null;
  }
};
const main = module.exports = (...params) => catchAndLogFunc(parseItem, params);
main._hidden = { catchAndLogFunc };
