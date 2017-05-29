"use strict";

var https = require('https');
var util = require('./util.js');

exports.get_nonfirstpage = function(nextpage_link, options, callback) {
	var request = https.get('https://www.youtube.com' + nextpage_link, function(resp) {
		if(resp.statusCode != 200) {
			return callback(new Error('Status code: ' + resp.statusCode));
		}
		var resp_string = '';
		resp.on('data', function(d) {
			resp_string += d.toString();
		});
		resp.on('end', function() {
			var parsed_string;

			try {
				parsed_string = JSON.parse(resp_string);
			} catch(err) {
				return callback(err);
			}

			// split into important parts
			var content = parsed_string.content_html;
			var next_page = parsed_string.load_more_widget_html;
			var next_page_link = util.between(next_page, 'data-uix-load-more-href="', '"');

			// parse playlist items
			var playlistitems = util.get_video_container(content).split('<tr').splice(1);
			var items = playlistitems.map(function(item) {
				return util.build_video_object(item);
			});
			items = items.filter(function(item, index) {
				return options.limit ? options.limit > index : true
			})

			// check wether there are more limits and wether the limit wants us to download them
			if(next_page_link !== '' && (options.limit ? options.limit > items.length : true)) {
				if(next_page_link === nextpage_link) {
					return callback(null, items);
				}
				if(options.limit) {
					options.limit = options.limit - items.length;
				}
				exports.get_nonfirstpage(next_page_link, options, function(err, plist_items) {
					if(err) {
						return callback(err);
					}
					return callback(null, items.concat(plist_items));
				})
			} else {
				return callback(null, items);
			}
		});
	});
	request.on('error', callback);
};
