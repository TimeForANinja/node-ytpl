const UTIL = require('./util.js');
const MINIGET = require('miniget');

const getNonfirstPage = module.exports = async(nextpageLink, options) => {
  const body = await MINIGET(
    `https://www.youtube.com${nextpageLink}${UTIL.URLquery}`,
    options,
  ).text();

  let parsedString = JSON.parse(body);

  // Split out the important parts
  const content = parsedString.content_html;
  const nextpageRaw = parsedString.load_more_widget_html;
  const nextpage = UTIL.removeHtml(UTIL.between(nextpageRaw, 'data-uix-load-more-href="', '"')) || null;

  // Parse playlist items
  const items = UTIL.getVideoContainers(content)
    .map(item => UTIL.buildVideoObject(item))
    .filter((_item, index) => options.limit > index);

  // Update limit
  options.limit -= items.length;

  if (nextpage && options.limit >= 1) {
    // Recursively fetch more items
    const moreItems = await getNonfirstPage(nextpage, options);
    items.push(...moreItems);
  }

  return items;
};
