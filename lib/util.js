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

exports.getGeneralInfo = (body, plistID) => {
  const dataObject = getDataObject(body);

  const description = dataObject.metadata.playlistMetadataRenderer.description;
  const authorChannel = dataObject.sidebar.playlistSidebarRenderer.items[1].playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer.title.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
  let lastUpdated = null;
  try {
    lastUpdated = dataObject.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.stats[2].runs[1].text || dataObject.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.stats[2].runs[1].text;
  } catch {
    lastUpdated = "Today";
  }

  return {
    id: plistID,
    url: PLAYLIST_URL + plistID,
    title: removeHtml(dataObject.metadata.playlistMetadataRenderer.title),
    // visibility: importantTxt.includes('data-tooltip-text="') ? 'link only' : 'everyone',
    description: removeHtml(description),
    total_items: Number(dataObject.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.stats[0].runs[0].text),
    views: Number(dataObject.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.stats[1].simpleText.replace("views", "").trim().replace(/,/ig, "")),
    last_updated: lastUpdated,
    author: {
      id: authorChannel.replace(/\/c\//ig, ""),
      name: removeHtml(dataObject.sidebar.playlistSidebarRenderer.items[1].playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer.title.runs[0].text),
      avatar: dataObject.sidebar.playlistSidebarRenderer.items[1].playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer.thumbnail.thumbnails[2].url,
      user: authorChannel.replace(/\/c\//ig, ""),
      channel_url: `https://www.youtube.com${authorChannel}`,
      user_url: `https://www.youtube.com${authorChannel}`,
    },
    // Added here so that we don't create ghost object definitions in memory
    nextpage: null,
    items: [],
  };
};

// Splits out the video container
exports.getVideoContainers = body => {
  const dataObject = getDataObject(body);
  const videos = dataObject.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
  return [...videos];
}

exports.buildVideoObject = videoObject => {
  return {
    id: videoObject.playlistVideoRenderer.videoId,
    url: `https://www.youtube.com/watch?v=${videoObject.playlistVideoRenderer.videoId}`,
    title: removeHtml(videoObject.playlistVideoRenderer.title.runs[0].text),
    thumbnail: videoObject.playlistVideoRenderer.thumbnail.thumbnails[0].url,
    duration: videoObject.playlistVideoRenderer.lengthText.simpleText,
    author: {
      name: videoObject.playlistVideoRenderer.shortBylineText.runs[0].text,
      ref: `https://www.youtube.com/${videoObject.playlistVideoRenderer.shortBylineText.runs[0].navigationEndpoint.commandMetadata.url}`
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

const getDataObject = body => {
  let scriptBody = between(body, 'window["ytInitialData"] = ', 'window["ytInitialPlayerResponse"] = null;');
  scriptBody = scriptBody.trim().replace(";", "");
  const scriptBodyObject = JSON.parse(scriptBody);
  return scriptBodyObject;
}
