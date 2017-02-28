"use strict";

var https = require('https');
var util = require('./util.js');

exports.get_nonfirstpage = function(nextpage_link, options, callback) {
	https.get('https://www.youtube.com' + nextpage_link, function(resp) {
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

			var content = parsed_string.content_html;
			var next_page = parsed_string.load_more_widget_html;
			var next_page_link = util.between(next_page, 'data-uix-load-more-href="', '"');

			var playlistitems = util.get_video_container(content).split('<tr').splice(1);
			var items = playlistitems.map(function(item) {
				return util.build_video_object(item);
			});
			items = items.filter((item, index) => {
				return options.limit ? options.limit > index : true
			})

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
};
