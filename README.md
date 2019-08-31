<div align="center">
  <p>
    <a href="https://www.npmjs.com/package/ytpl"><img src="https://img.shields.io/npm/v/ytpl.svg?maxAge=3600" alt="NPM version" /></a>
    <a href="https://www.npmjs.com/package/ytpl"><img src="https://img.shields.io/npm/dt/ytpl.svg?maxAge=3600" alt="NPM downloads" /></a>
    <a href="https://david-dm.org/"><img src="https://img.shields.io/david/timeforaninja/node-ytpl.svg?maxAge=3600" alt="Dependencies" /></a>
    <a href="https://greenkeeper.io/"><img src="https://badges.greenkeeper.io/TimeForANinja/node-ytpl.svg" alt="Dependencies" /></a>
  </p>
  <p>
    <a href="https://nodei.co/npm/ytpl/"><img src="https://nodei.co/npm/ytpl.png?downloads=true&stars=true" alt="NPM info" /></a>
  </p>
</div>

# node-ytpl
Simple js only module to resolve YouTube playlist ids
Doesn't need any login or GoogleAPI key

# Usage

```js
var ytpl = require('ytpl');

ytpl('UU_aEa8K-EOJ3D6gOs7HcyNg', function(err, playlist) {
  if(err) throw err;
  dosth(playlist);
});
```


# API
### ytpl(id, [options], [callback])

Attempts to resolve the given playlist id

* `id`
    * id of the yt-playlist
    * or playlist link
    * or user link (resolves uploaded playlist)
    * or channel link (resolves uploaded playlist)
* `options`
    * object with options
    * possible settings:
    * limit[Number] -> limits the pulled items, defaults to 100, set to 0 or Infinity to get the whole playlist
* `callback(err, result)`
    * function
    * getting fired after the request is done
    * contains an error or a result

* returns a Promise when no callback is defined
* [Example response](https://github.com/timeforaninja/node-ytpl/blob/master/example/example_output)

### ytpl.validateURL(string)

Returns true if able to parse out a (formally) valid playlist ID.


# Related / Works well with

* [node-ytdl-core](https://github.com/fent/node-ytdl-core)
* [node-ytsr](https://github.com/TimeForANinja/node-ytsr)


# Install

    npm install --save ytpl



# License
MIT
