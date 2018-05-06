"use strict";

var https = require('https');
var firstpage = require('./firstpage.js');
var nonfirstpage = require('./nonfirstpage.js');
var util = require('./util.js')

module.exports = function get_playlist(link_or_id, options_or_callback, callback) {
  // set default values
  if(typeof(options_or_callback) === 'function') {
    callback = options_or_callback;
    options_or_callback = {limit: 100};
  }
  else if(typeof(options_or_callback) !== 'object') options_or_callback = {limit: 100};
  else if(!options_or_callback.limit) options_or_callback.limit = 100;
  // link_or_id is always required
  if(!link_or_id || typeof link_or_id !== 'string') throw new Error('No valid link or id was provided');
  // return promise if no callback is defined
  if(!callback) {
    return new Promise(function(resolve, reject) {
      get_playlist(link_or_id, options_or_callback, function(err, info) {
        if(err) return reject(err);
        resolve(info);
      });
    });
  }
  // resolve the id
  util.get_playlist_id(link_or_id, function(err, playlist_id) {
    if(err) return callback(err);
    var plist = {};
    // get the first page
    firstpage.get_firstpage(playlist_id, options_or_callback, function(err, plist_obj) {
      if(err) return callback(err);
      if(!plist_obj.nextpage || (!isNaN(options_or_callback.limit) && options_or_callback.limit < 1)) {
        delete plist_obj.nextpage;
        return callback(null, plist_obj);
      }

      // start recurring function downloading more pages after the first
      nonfirstpage.get_nonfirstpage(plist_obj.nextpage, options_or_callback, function(err2, plist_items) {
        if(err2) return callback(err2);
        // concat the items from firstpage and the other pages
        delete plist_obj.nextpage;
        plist_obj.items.push(...plist_items);
        return callback(null, plist_obj);
      });
    });
  });
};
