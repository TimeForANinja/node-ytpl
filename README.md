# node-ytpl
[![NPM version](https://img.shields.io/npm/v/ytpl.svg?maxAge=3600)](https://www.npmjs.com/package/ytpl)
[![NPM downloads](https://img.shields.io/npm/dt/ytpl.svg?maxAge=3600)](https://www.npmjs.com/package/ytpl)
[![codecov](https://codecov.io/gh/timeforaninja/node-ytpl/branch/master/graph/badge.svg)](https://codecov.io/gh/timeforaninja/node-ytpl)
[![Known Vulnerabilities](https://snyk.io/test/github/timeforaninja/node-ytpl/badge.svg)](https://snyk.io/test/github/timeforaninja/node-ytpl)
[![Discord](https://img.shields.io/discord/484464227067887645.svg)](https://discord.gg/V3vSCs7)

Simple js only package to resolve YouTube Playlists.
Does not require any login or Google-API-Key.

# Support
You can contact us for support on our [chat server](https://discord.gg/V3vSCs7)

# Usage

```js
const ytpl = require('ytpl');

const playlist = await ytpl('UU_aEa8K-EOJ3D6gOs7HcyNg');
```


# API
### ytpl(id, [options])

Attempts to resolve the given playlist id

* `id`
    * id of the yt-playlist
    * or a playlist url
    * or a user url (resolves to uploaded playlist)
    * or a channel url (resolves to uploaded playlist)
* `options`
    * object with options
    * possible settings:
    * gl[String] -> 2-Digit Code of a Country, defaults to `US` - Allows for localisation of the request
    * hl[String] -> 2-Digit Code for a Language, defaults to `en` - Allows for localisation of the request
    * limit[Number] -> limits the pulled items, defaults to 100, set to Infinity to get the whole playlist - numbers <1 result in the default being used
    * pages[Number] -> limits the pulled pages, pages contain 100 items, set to Infinity to get the whole playlist - numbers <1 result in the default limit being used - overwrites limit
    * requestOptions[Object] -> Additional parameters to passed to [miniget](https://github.com/fent/node-miniget), which is used to do the https requests

* returns a Promise
* [Example response](https://github.com/timeforaninja/node-ytpl/blob/master/example/example_output.txt)

### ytpl.continueReq(continuationData)
Continues a previous request by pulling yet another page.  
The previous request had to be done using `pages` limitation.

#### Usage
```js
const ytpl = require('ytpl');

const firstResultBatch = await ytpl('UU_aEa8K-EOJ3D6gOs7HcyNg', { pages: 1 });
const secondResultBatch = ytpl.continueReq(firstResultBatch.continuation);
const thirdResultBatch = ytpl.continueReq(secondResultBatch.continuation);

// You can now use the .items property of all result batches e.g.:
console.log(firstResultBatch.items);
console.log(secondResultBatch.items);
console.log(thirdResultBatch.items);
```

* returns a Promise resolving into `{ continuation, items }`

### ytpl.validateID(string)

Returns true if able to parse out a (formally) valid playlist ID.

### ytpl.getPlaylistID(string)

Returns a playlist ID from a YouTube URL. Can be called with the playlist ID directly, in which case it just resolves.

* returns a promise resolving into a string containing the id


# Related / Works well with

* [node-ytdl-core](https://github.com/fent/node-ytdl-core)
* [node-ytsr](https://github.com/TimeForANinja/node-ytsr)


# Install

    npm install --save ytpl


# License
MIT
