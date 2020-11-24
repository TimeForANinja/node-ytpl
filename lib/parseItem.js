const PATH = require('path');
const FS = require('fs');
const UTIL = require('./util.js');

const SKIP_TYPES = ['CONTINUATION_TRIGGER_ON_ITEM_SHOWN', 'continuationItemRenderer'];

const parseItem = item => {
  const type = Object.keys(item)[0];
  if (SKIP_TYPES.includes(type)) return null;
  else if (type !== 'playlistVideoRenderer') throw new Error(`unexpected type "${type}"`);

  let info = item.playlistVideoRenderer;
  if (!info || !info.shortBylineText || info.upcomingEventData) return null;
  const isLive = info.thumbnailOverlays.some(a =>
    a.thumbnailOverlayTimeStatusRenderer &&
    a.thumbnailOverlayTimeStatusRenderer.style === 'LIVE');
  return {
    title: UTIL.parseText(info.title),
    id: info.videoId,
    url: `https://www.youtube.com/watch?v=${info.videoId}`,
    thumbnail: info.thumbnail.thumbnails.sort((a, b) => b.width - a.width)[0].url,
    isLive,
    duration: !info.lengthText ? null : UTIL.parseText(info.lengthText),
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
    const ePrint = 'failed to parse Playlist-Item: '+e.message;
    console.error(`\n/${'*'.repeat(200)}`);
    console.error(ePrint);
    console.error(`pls post the the files in ${dir} to ${bugsRef}`);
    console.error(`${'*'.repeat(200)}\\`);
    /* eslint-enable no-console */
    return null;
  }
};

module.exports = catchAndLog_parseItem;
