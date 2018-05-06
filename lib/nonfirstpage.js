"use strict";

var https = require('https');
var util = require('./util.js');

exports.get_nonfirstpage = function(nextpage_link, options, callback) {
  var request = https.get('https://www.youtube.com' + nextpage_link + '&hl=en&disable_polymer=true', function(resp) {
    if(resp.statusCode != 200) {
      return callback(new Error('Status code: ' + resp.statusCode));
    }
    var response = [];
    resp.on('data', function(chunk) {
      response.push(chunk);
    });
    resp.on('end', function() {
      var parsed_string;
      try {
        parsed_string = JSON.parse(Buffer.concat(response).toString());
      } catch(err) {
        return callback(err);
      }

      // split into important parts
      var content = parsed_string.content_html;
      var next_page = parsed_string.load_more_widget_html;
      var nextpage = util.remove_html(util.between(next_page, 'data-uix-load-more-href="', '"')) || null;

      // parse playlist items
      var playlistItems = util.get_video_containers(content);
      var items = playlistItems.map(function(item) {
        return util.build_video_object(item);
      });
      items = items.filter(function(item, index) {
        return options.limit ? options.limit > index : true
      })

      // update options.limit
      if(options.limit) {
        options.limit = options.limit - items.length;
      }

      // check wether there are more items and wether the limit wants us to download them
      if(!nextpage || (!isNaN(options.limit) && options.limit < 1)) {
        return callback(null, items);
      }

      exports.get_nonfirstpage(nextpage, options, function(err, plist_items) {
        if(err) return callback(err);
        return callback(null, items.concat(plist_items));
      });
    });
  });
  request.on('error', callback);
};
