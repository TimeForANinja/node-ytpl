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
  const authorChannel =
    dataObject.sidebar.playlistSidebarRenderer.items[1]
      .playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer.title
      .runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl;
  let lastUpdated = null;
  try {
    lastUpdated =
      dataObject.sidebar.playlistSidebarRenderer.items[0]
        .playlistSidebarPrimaryInfoRenderer.stats[2].runs[1].text ||
      dataObject.sidebar.playlistSidebarRenderer.items[0]
        .playlistSidebarPrimaryInfoRenderer.stats[2].runs[1].text;
  } catch (e) {
    lastUpdated = 'Today';
  }

  return {
    id: plistID,
    url: PLAYLIST_URL + plistID,
    title: removeHtml(dataObject.metadata.playlistMetadataRenderer.title),
    // Visibility: importantTxt.includes('data-tooltip-text="') ? 'link only' : 'everyone',
    description: removeHtml(description),
    total_items: Number(
      dataObject.sidebar.playlistSidebarRenderer.items[0]
        .playlistSidebarPrimaryInfoRenderer.stats[0].runs[0].text,
    ),
    views: Number(
      dataObject.sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.stats[1].simpleText
        .replace('views', '')
        .trim()
        .replace(/,/gi, ''),
    ),
    last_updated: lastUpdated,
    author: {
      id: authorChannel.replace(/\/c\//gi, ''),
      name: removeHtml(
        dataObject.sidebar.playlistSidebarRenderer.items[1]
          .playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer
          .title.runs[0].text,
      ),
      avatar:
        dataObject.sidebar.playlistSidebarRenderer.items[1]
          .playlistSidebarSecondaryInfoRenderer.videoOwner.videoOwnerRenderer
          .thumbnail.thumbnails[2].url,
      user: authorChannel.replace(/\/c\//gi, ''),
      // TODO: switch back to URL.resolve for sth like this
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
  const videos =
    dataObject.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer
      .content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0]
      .playlistVideoListRenderer.contents;
  return videos;
};

exports.buildVideoObject = videoObject => {
  if (typeof videoObject.playlistVideoRenderer !== 'undefined') {
    const authorChannel =
      typeof videoObject.playlistVideoRenderer.shortBylineText !== 'undefined' ?
        videoObject.playlistVideoRenderer.shortBylineText.runs[0]
          .navigationEndpoint.commandMetadata.url :
        null;
    return {
      id: videoObject.playlistVideoRenderer.videoId,
      url: `https://www.youtube.com/watch?v=${videoObject.playlistVideoRenderer.videoId}`,
      title: removeHtml(videoObject.playlistVideoRenderer.title.runs[0].text),
      thumbnail: videoObject.playlistVideoRenderer.thumbnail.thumbnails[0].url,
      duration:
        typeof videoObject.playlistVideoRenderer.lengthText !== 'undefined' ?
          videoObject.playlistVideoRenderer.lengthText.simpleText :
          null,
      author: {
        name:
          typeof videoObject.playlistVideoRenderer.shortBylineText !==
          'undefined' ?
            videoObject.playlistVideoRenderer.shortBylineText.runs[0].text :
            null,
        ref: authorChannel ? `https://www.youtube.com/${authorChannel}` : '',
      },
    };
  } else {
    return {};
  }
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
const removeHtml = exports.removeHtml = string => {
  // TODO: remove try/catch for the long run
  try {
    return new ENTITIES()
      .decode(
        string
          .replace(/\n\r?/g, ' ')
          .replace(/\s*<\s*br\s*\/?\s*>\s*/gi, '\n')
          .replace(/<\s*\/\s*p\s*>\s*<\s*p[^>]*>/gi, '\n')
          .replace(/<.*?>/gi, ''),
      )
      .trim();
  } catch (e) {
    return string;
  }
};

const getDataObject = body => {
  // TODO: switch to ytdl-core's utils#cutAfterJSON - same for ytsr
  let scriptBody = between(
    body,
    'window["ytInitialData"] = ',
    'window["ytInitialPlayerResponse"] = null;',
  );
  scriptBody = scriptBody.trim().replace(/;/gi, '');
  let scriptBodyObject = JSON.parse(scriptBody);
  return scriptBodyObject;
};
