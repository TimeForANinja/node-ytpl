const util   = require('../lib/util');
const fs     = require('fs');
const path   = require('path');
const nock   = require('./nock');
const assert = require('assert-diff');

describe('util.get_general_info()', () => {
  it('parses the general information of a playlist', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      assert.ifError(err);
      let plistID = 'someID';
      let info_obj = util.get_general_info(dataIn.toString(), plistID);
      assert.deepEqual(info_obj, {
        id: plistID,
        url: 'https://www.youtube.com/playlist?list=' + plistID,
        title: '⚡️ NCS: Electronic',
        visibility: 'everyone',
        description: null,
        total_items: 52,
        views: 11868132,
        last_updated: 'Last updated on Apr 17, 2018',
        author: {
          id: 'UC_aEa8K-EOJ3D6gOs7HcyNg',
          name: 'NoCopyrightSounds',
          avatar: 'https://yt3.ggpht.com/-p-S-magPRTs/AAAAAAAAAAI/AAAAAAAAAAA/VkK9BqrRyuU/s100-mo-c-c0xffffffff-rj-k-no/photo.jpg',
          user: 'NoCopyrightSounds',
          channel_url: 'https://www.youtube.com/channel/UC_aEa8K-EOJ3D6gOs7HcyNg',
          user_url: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
        nextpage: null,
        items: [],
      });
      done();
    });
  });

  it('parses the general information of another playlist', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/multiple_page_playlist/page1.html'), (err, data) => {
      assert.ifError(err);
      let plistID = 'someID';
      let info_obj = util.get_general_info(data.toString(), plistID);
      assert.deepEqual(info_obj, {
        id: plistID,
        url: 'https://www.youtube.com/playlist?list=' + plistID,
        title: '🔥 NCS: House',
        visibility: 'everyone',
        description: 'All House music uploads.',
        total_items: 155,
        views: 128553172,
        last_updated: 'Last updated on Apr 24, 2018',
        author: {
          id: 'UC_aEa8K-EOJ3D6gOs7HcyNg',
          name: 'NoCopyrightSounds',
          avatar: 'https://yt3.ggpht.com/-p-S-magPRTs/AAAAAAAAAAI/AAAAAAAAAAA/VkK9BqrRyuU/s100-mo-c-c0xffffffff-rj-k-no/photo.jpg',
          user: 'NoCopyrightSounds',
          channel_url: 'https://www.youtube.com/channel/UC_aEa8K-EOJ3D6gOs7HcyNg',
          user_url: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
        nextpage: null,
        items: [],
      });
      done();
    });
  });
});

describe('util.get_video_containers()', () => {
  it('parses out all video containers of a playlist', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      assert.ifError(err);
      fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/firstpage_parsed.json'), (err, data) => {
        const dataOut = JSON.parse(data);
        assert.ifError(err);
        const containers = util.get_video_containers(dataIn.toString());
        assert.deepEqual(containers.length, 4);
        done();
      })
    });
  });

  it('parses out all video containers of another playlist', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/multiple_page_playlist/page1.html'), (err, data) => {
      assert.ifError(err);
      let containers = util.get_video_containers(data.toString());
      assert.equal(containers.length, 100);
      done();
    });
  });

  it('check whether video container is as expected', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      assert.ifError(err);
      fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/video4.html'), (err, dataOut) => {
        assert.ifError(err);
        let containers = util.get_video_containers(dataIn.toString());
        assert.equal(containers[3], dataOut.toString());
        done();
      });
    });
  });
});

describe('util.build_video_object()', () => {
  it('parses a video from its container', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/video4.html'), (err, dataIn) => {
      assert.ifError(err);
      let vidObj = util.build_video_object(dataIn.toString());
      assert.deepEqual(vidObj, {
        id: 'yHU6g3-35IU',
        url: 'https://www.youtube.com/watch?v=yHU6g3-35IU&list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5&index=43&t=0s',
        url_simple: 'https://www.youtube.com/watch?v=yHU6g3-35IU',
        title: 'NIVIRO - The Guardian Of Angels [NCS Release]',
        thumbnail: 'https://i.ytimg.com/vi/yHU6g3-35IU/hqdefault.jpg',
        duration: '3:36',
        author: {
          name: 'NoCopyrightSounds',
          ref: 'https://www.youtube.com/user/NoCopyrightSounds'
        }
      });
      done();
    });
  });

  it('parse a private video', (done) => {
    fs.readFile(path.resolve(__dirname, 'files/single_page_playlist/video2.html'), (err, dataIn) => {
      assert.ifError(err);
      let vidObj = util.build_video_object(dataIn.toString());
      assert.deepEqual(vidObj, {
        id: 'YG-9u6_J05w',
        url: 'https://www.youtube.com/watch?v=YG-9u6_J05w&list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5&index=41',
        url_simple: 'https://www.youtube.com/watch?v=YG-9u6_J05w',
        title: '[Private video]',
        thumbnail: 'https://s.ytimg.com/yts/img/no_thumbnail-vfl4t3-4R.jpg',
        duration: null,
        author: {
          name: null,
          ref: null
        }
      });
      done();
    });
  });
});

describe('util.get_playlist_id()', () => {
  it('errors when no string provided', (done) => {
    util.get_playlist_id(undefined, (err, id) => {
      assert.equal(err.message, 'The link has to be a string');
      done();
    });
  });

  it('instantly returns valid links', (done) => {
    let rawID = 'PL1234567890abcdefghijkl';
    util.get_playlist_id(rawID, (err, id) => {
      assert.ifError(err);
      assert.equal(id, rawID);
      done();
    });
  });

  it('parses valid lists from query', (done) => {
    util.get_playlist_id('https://www.youtube.com/watch?v=U9BwWKXjVaI&list=PL1234567890abcdefghijkl', (err, id) => {
      assert.ifError(err);
      assert.equal(id, 'PL1234567890abcdefghijkl');
      done();
    });
  });

  it('errors for invalid lists in query', (done) => {
    util.get_playlist_id('https://www.youtube.com/watch?v=DLzxrzFCyOs&list=', (err, id) => {
      assert.equal(err.message, 'invalid list query in url');
      done();
    });
  });

  it('parses valid channels', (done) => {
    util.get_playlist_id('https://www.youtube.com/channel/UC1234567890abcdefghijkl', (err, id) => {
      assert.ifError(err);
      assert.equal(id, 'UU1234567890abcdefghijkl');
      done();
    });
  });

  it('errors for invalid channels', (done) => {
    util.get_playlist_id('https://www.youtube.com/channel/invalidID', (err, id) => {
      assert.equal(err.message, 'Unable to find a id in https://www.youtube.com/channel/invalidID');
      done();
    });
  });

  it('parses a valid user', (done) => {
    let scope = nock({
      user_to_channel: 'someUser',
      target_channel: 'someChannelUniqueIdentifier'
    });
    util.get_playlist_id('https://www.youtube.com/user/someUser', (err, id) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.equal(id, 'UUsomeChannelUniqueIdentifier');
      scope.done();
      done();
    });
  })

  it('parses a invalid user', (done) => {
    let scope = nock({
      user_to_channel: 'a',
      target_channel: null
    });
    util.get_playlist_id('https://www.youtube.com/user/a', (err, id) => {
      scope.ifError(err);
      assert.equal(err.message, 'unable to resolve the user: a');
      scope.done();
      done();
    });
  })

  it('errors for links nether including channel nor user', (done) => {
    util.get_playlist_id('https://www.youtube.com/invalidType', (err, id) => {
      assert.equal(err.message, 'Unable to find a id in https://www.youtube.com/invalidType');
      done();
    });
  });
});

describe('util.user_to_channel_uploadlist()', () => {
  it('resolves a user to his uploads list', (done) => {
    let scope = nock({
      user_to_channel: 'someUser',
      target_channel: 'someChannelUniqueIdentifier'
    });
    util.user_to_channel_uploadlist('someUser', (err, channelID) => {
      scope.ifError(err);
      assert.ifError(err);
      assert.equal('UUsomeChannelUniqueIdentifier', channelID);
      scope.done();
      done();
    });
  });

  it('errors when its not able to', (done) => {
    let scope = nock({
      user_to_channel: 'a',
      target_channel: null
    });
    util.user_to_channel_uploadlist('a', (err, channelID) => {
      scope.ifError(err);
      assert.equal(err.message, 'unable to resolve the user: a');
      scope.done();
      done();
    });
  });
});

describe('util.between()', () => {
  it('`left` positioned at the start', () => {
    var rs = util.between('<b>hello there friend</b>', '<b>', '</b>');
    assert.equal(rs, 'hello there friend');
  });

  it('somewhere in the middle', () => {
    var rs = util.between('something everything nothing', ' ', ' ');
    assert.equal(rs, 'everything');
  });

  it('not found', () => {
    var rs = util.between('oh oh _where_ is it', '<b>', '</b>');
    assert.equal(rs, '');
  });

  it('`right` before `left`', () => {
    var rs = util.between('>>> a <this> and that', '<', '>');
    assert.equal(rs, 'this');
  });

  it('`right` not found', () => {
    var rs = util.between('something [around[ somewhere', '[', ']');
    assert.equal(rs, '');
  });
});

describe('util.remove_html()', () => {
  it('remove html', () => {
    assert.equal(util.remove_html('<a href="/someref">Artist1 - Nova (Official)</a><div class="pl-video-owner">'), 'Artist1 - Nova (Official)');
  });

  it('replace unknown characters', () => {
    assert.equal(util.remove_html('Artist1 &amp; Artist2 - Nova (Official)'), 'Artist1 & Artist2 - Nova (Official)');
  });

  it('keeps newlines', () => {
    assert.equal(util.remove_html('Artist1 &amp; Artist2 <br> Nova (Official)'), 'Artist1 & Artist2\nNova (Official)');
  });
});
