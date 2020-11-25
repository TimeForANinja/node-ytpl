const UTIL = require('./util.js');

module.exports = item => {
  const type = Object.keys(item)[0];
  if (type !== 'playlistVideoRenderer') return null;

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
