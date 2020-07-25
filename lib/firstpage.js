const UTIL = require('./util.js');
const MINIGET = require('miniget');

const NEXTPAGE_REGEXP_L = /"(\/browse_ajax\?action_continuation=1&amp;continuation=([^"]+))"/;
const ERROR_REGEXP_G = /<div class="yt-alert-message" tabindex="0">\r?\n[\s]+([^\r?\n]+)[\s]+<\/div>/g;
const ERROR_REGEXP_L = /<div class="yt-alert-message" tabindex="0">\r?\n[\s]+([^\r?\n]+)[\s]+<\/div>/;

const IGNORABLE_ERRORS = [string => string.includes('<a href="/new">')];

const main = module.exports = async(plistID, options) => {
  const body = await MINIGET(
    `https://www.youtube.com/playlist?list=${plistID}${UTIL.URLquery}`,
    options,
  ).text();
  // Check whether there are any errors present
  const errorMatch = body.match(ERROR_REGEXP_G);
  if (errorMatch) {
    const validErrors = errorMatch
      .map(item => item.match(ERROR_REGEXP_L)[1])
      .filter(item => !IGNORABLE_ERRORS.some(func => func(item)));
    if (validErrors.length) throw new Error(validErrors);
  }


  // Get general playlist informations
  const response = UTIL.getGeneralInfo(body, plistID);

  // Parse video
  response.items = UTIL.getVideoContainers(body)
    .map(item => UTIL.buildVideoObject(item))
    .filter((_, index) => options.limit > index);

  // Check whether there are more pages
  const nextpageLink = body.match(NEXTPAGE_REGEXP_L);
  if (nextpageLink) {
    response.nextpage = UTIL.removeHtml(nextpageLink[1]);
    options.headers['x-youtube-client-name'] = getClientName(body);
    options.headers['x-youtube-client-version'] = getClientVersion(body);
  }

  // Update limit
  options.limit -= response.items.length;

  return response;
};

/**
 * Single-Use Utility
 * -------------------------------------------
 */

// Extracts the value of the header 'x-youtube-client-name' from the body
const CLIENT_NAME_REGEX = /CLIENT_NAME: (\d+?),/;
const getClientName = main.getClientName = string => {
  const match = string.match(CLIENT_NAME_REGEX);
  return match ? match[1] : '';
};

// Extracts the value of the header 'x-youtube-client-version' from the body
const CLIENT_VERSION_REGEX = /CLIENT_VERSION: "([\d.]+?)"/;
const getClientVersion = main.getClientVersion = string => {
  const match = string.match(CLIENT_VERSION_REGEX);
  return match ? match[1] : '';
};
