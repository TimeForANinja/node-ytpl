"use strict";

var https = require('https');
var firstpage = require('./firstpage.js');
var nonfirstpage = require('./nonfirstpage.js');
var util = require('./util.js')

module.exports = function get_playlist(link_or_id, object_or_callback, callback) {
	// set default values
	if(!object_or_callback) object_or_callback = {limit: 100};
	if(typeof(object_or_callback) == 'function') {
		callback = object_or_callback;
		object_or_callback = {limit: 100};
	}
	// return promise if no callback is defined
	if(!callback) {
		return new Promise(function(resolve, reject) {
			get_playlist(link_or_id, object_or_callback, function(err, info) {
				if(err) return reject(err);
				resolve(info);
			});
		});
	}
	// resolve the id
	util.get_playlist_id(link_or_id, function(err, playlist_id) {
		var plist = {};
		// get the first page
		firstpage.get_firstpage(playlist_id, object_or_callback, function(err, plist_obj) {
			if(err) {
				return callback(err);
			}
			if(!plist_obj.nextpage) {
				return callback(null, plist_obj);
			} else {
				// start recurring function downloading more pages after the first
				nonfirstpage.get_nonfirstpage(plist_obj.nextpage, object_or_callback, function(err2, plist_items) {
					if(err2) {
						return callback(err2);
					}
					// concat the items from firstpage and the other pages
					plist_obj.items = plist_obj.items.concat(plist_items);
					delete plist_obj.nextpage;
					return callback(null, plist_obj);
				});
			}
		});
	});
};
