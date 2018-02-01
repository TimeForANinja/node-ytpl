"use strict";

var Entities = require('html-entities').AllHtmlEntities;
var url = require('url');
var https = require('https');
var appendQuery = require('append-query')

var VIDEO_URL = 'https://www.youtube.com/watch?v='
var PLAYLIST_URL = 'https://www.youtube.com/playlist?list='

// parses the header information of a playlist
var author_reflink_regexp = /<ul class="pl-header-details"><li>(.*?(?=<\/li>))<\/li><li>(.*?)(?=<\/li>)<\/li><li>(.*?(?=<\/li>))<\/li><li>(.*?(?=<\/li>))<\/li>/;
var playlist_name_regexp = /<h1 class="pl-header-title[^"]*" tabindex="0">\n[\s]*(.*?(?=\n))\n[\s]+(<\/h1>|<div)/;
exports.get_general_info = function(body, plist_id) {
	var important_txt = exports.between(body, 'branded-page-box clearfix', '<div class="playlist-auxiliary-actions">');
	var author_match = important_txt.match(author_reflink_regexp);
	var description = exports.remove_html(exports.between(important_txt, '<span class="pl-header-description-text" tabindex="0">', '</span>').replace(/<button class="yt-uix-button[\s\S]+/, ''));
	return {
		id: plist_id,
		url: PLAYLIST_URL + plist_id,
		title: exports.remove_html(important_txt.match(playlist_name_regexp)[1]),
		visibility: important_txt.includes('data-tooltip-text="') ? 'link only' : 'everyone',
		description: description ? description : null,
		total_items: parseInt(author_match[2]),
		views: author_match[3].split(' ')[0].replace('.', ''),
		last_updated: author_match[4],
		author: {
			id: exports.between(author_match[1], 'data-ytid="', '"'),
			name: exports.between(author_match[1], '>', '</a>'),
			avatar: exports.between(body, '<img class="channel-header-profile-image" src="', '" title="'),
			user: important_txt.includes('/user/') ? exports.between(author_match[1], 'href="/user/', '"') : null,
			channel_url: url.resolve(PLAYLIST_URL, '/channel/' + exports.between(author_match[1], 'data-ytid="', '"')),
			user_url: important_txt.includes('/user/') ? url.resolve(PLAYLIST_URL, exports.between(author_match[1], 'href="', '"')) : null,
		},
		items: [],
	};
};

// splits out the video container
exports.get_video_container = function(body) {
	var start = body.indexOf('<tr class="');
	var end = body.lastIndexOf('</tr>');
	return body.substring(start, end);
};

// builds an object representing a video of a playlist
exports.build_video_object = function(videoString) {
	return {
		id: exports.between(videoString, 'href="/watch?v=', '&amp;'),
		url: url.resolve(PLAYLIST_URL, exports.between(videoString, 'href="', '"')),
		url_simple: url.resolve(PLAYLIST_URL, exports.between(videoString, 'href="', '&amp;')),
		title: exports.remove_html(exports.between(videoString, 'data-title="', '"')),
		thumbnail: exports.between(videoString, 'data-thumb="', '"').split('?')[0],
		duration: videoString.includes('<div class="timestamp">') ? videoString.match(/<span aria-label="[^"]+">(.*?(?=<\/span>))<\/span>/)[1] : null,
		author: {
			id: exports.between(videoString, 'data-ytid="', '"'),
			name: videoString.includes('data-name="playlist"') ? exports.remove_html(videoString.match(/<a.*?(?=data-name="playlist")data-name="playlist"[^>]+>(.*?(?=<\/a>))<\/a>/)[1]) : null,
			user: videoString.includes('/user/') ? exports.between(videoString, 'href="/user/', '"') : null,
			channel_url: url.resolve(PLAYLIST_URL, '/channel/' + exports.between(videoString, 'data-ytid="', '"')),
			user_url: videoString.includes('/user/') ? url.resolve(PLAYLIST_URL, '/user/' + exports.between(videoString, 'href="/user/', '"')) : null,
		}
	};
};

// parse the input to a id (or error)
var id_regex = /^[a-zA-Z0-9-_]{24,34}$/;
exports.get_playlist_id = function(link, callback) {
	if(typeof(link) !== 'string') {
		return callback(new Error('The link has to be a string'));
	}
	if(id_regex.test(link)) {
		return callback(null, link);
	}
	var parsed = url.parse(link, true);
	if(parsed.query.list) {
		return callback(null, parsed.query.list);
	}
	var p = parsed.pathname.split('/');
	var maybe_type = p[p.length - 2];
	var maybe_id = p[p.length - 1];
	if(maybe_type === 'channel') {
		if(id_regex.test(maybe_id)) {
			maybe_id = 'UU' + maybe_id.substr(2);
			return callback(null, maybe_id);
		} else {
			return callback(new Error('Unable to find a id in ' + link));
		}
	} else if(maybe_type === 'user') {
		return exports.user_to_channel(maybe_id, callback);
	} else {
		return callback(new Error('Unable to find a id in ' + link));
	}
};

// gets the channelid of a user (needed for uploads playlist)
var channel_regexp = /channel_id=([\w-]+)"/;
exports.user_to_channel = function(user, callback) {
	https.get(appendQuery('https://www.youtube.com/user/' + user, 'disable_polymer=1'), function(resp) {
		var response_string = '';
		var found = false;
		resp.on('data', function(data) {
			response_string += data.toString();
			var channel_match = data.toString().match(channel_regexp);
			if(channel_match) {
				found = true;
				resp.req.abort();
				return callback(null, 'UU' + channel_match[1].substr(2));
			}
		});
		resp.on('end', function() {
			if(found) {
				return;
			}
			var channel_match = response_string.match(channel_regexp);
			if(channel_match) {
				return callback(null, 'UU' + channel_match[1].substr(2));
			} else {
				return callback(new Error('unable to resolve the user ' + user));
			}
		});
	});
};


//taken from https://github.com/fent/node-ytdl-core/
exports.between = function(haystack, left, right) {
	var pos;
	pos = haystack.indexOf(left);
	if(pos === -1) { return ''; }
	haystack = haystack.slice(pos + left.length);
	if(!right) { return haystack; }
	pos = haystack.indexOf(right);
	if(pos === -1) { return ''; }
	haystack = haystack.slice(0, pos);
	return haystack;
};

// cleans up html text
exports.remove_html = function(string) {
	return new Entities().decode(
		string.replace(/\n/g, ' ')
		.replace(/\s*<\s*br\s*\/?\s*>\s*/gi, '\n')
		.replace(/<\s*\/\s*p\s*>\s*<\s*p[^>]*>/gi, '\n')
		.replace(/<.*?>/gi, '')
	).trim();
};
