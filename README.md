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
### ytpl(id, [options,] callback)

Attempts to resolve the given playlist id

* `id`
    * id of the yt-playlist
    * or playlist link
    * or user link (resolves uploaded playlist)
    * or channel link (resolves uploaded playlist)
* `options`
    * object with options
    * possible settings:
    * limit[integer] -> limits the pulled items
* `callback(err, result)`
    * function
    * getting fired after the request is done 
    * contains an error or a result

* [Example response](https://github.com/timeforaninja/node-ytpl/blob/master/example/example_output)


# Install

    npm install ytpl



# License
MIT
