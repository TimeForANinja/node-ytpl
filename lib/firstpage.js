"use strict";

var https = require('https');
var util = require('./util.js');

var nextpage_regexp_l = /\"(\/browse_ajax\?action_continuation=1&amp;continuation=([\w%]+))\"/;
var error_regexp_g = /<div class="yt-alert-message" tabindex="0">\n[\s]+([^\n]+)[\s]+<\/div>/g;
var error_regexp_l = /<div class="yt-alert-message" tabindex="0">\n[\s]+([^\n]+)[\s]+<\/div>/;

const IGNORABLE_ERRORS = [
	(string) => string.includes('<a href="/new">')
];

exports.get_firstpage = function(playlist_id, options, callback) {
	var request = https.get('https://www.youtube.com/playlist?list=' + playlist_id + '&hl=en&disable_polymer=true', function(resp) {
		if(resp.statusCode != 200) {
			if(resp.statusCode === 303) return callback(new Error('Playlist not avaible'));
			return callback(new Error('Status code: ' + resp.statusCode));
		}
		var resp_string = '';
		resp.on('data', function(data) {
			resp_string += data.toString();
		});
		resp.on('end', function() {
			// check wether theres an error in error box
			var error_match = resp_string.match(error_regexp_g);
			if(error_match) {
				var validErrors = error_match
					.map(function(item) { return item.match(error_regexp_l)[1] })
					.filter(function(item) {
						!IGNORABLE_ERRORS.some(func => func(item))
					});
				if(validErrors.length) return callback(new Error(validErrors));
			}

			// get general playlist informations
			var response = util.get_general_info(resp_string, playlist_id);

			// parse videos
			var playlistitems = util.get_video_container(resp_string).split('<tr').splice(1);
			response.items = playlistitems.map(function(item) {
				return util.build_video_object(item);
			})
			response.items = response.items.filter(function(item, index) {
				return options.limit ? options.limit > index : true
			})

			// check wether there ar emore pages
			var nextpage_link = resp_string.match(nextpage_regexp_l);
			if(nextpage_link && (options.limit ? options.limit > response.items.length : true)) {
				response.nextpage = nextpage_link[1];
			}

			// update limit
			if(options.limit) {
				options.limit = options.limit - response.items.length;
			}
			return callback(null, response);
		});
	});
	request.on('error', callback);
};
