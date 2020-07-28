/* global describe, it */
const UTIL = require('../lib/util');
const FS = require('fs');
const PATH = require('path');
const ASSERT = require('assert-diff');

describe('util.getGeneralInfo()', () => {
  it('parses the general information of a playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      const plistID = 'someID';
      const info_obj = UTIL.getGeneralInfo(dataIn.toString(), plistID);
      ASSERT.deepEqual(info_obj, {
        id: plistID,
        url: `https://www.youtube.com/playlist?list=${plistID}`,
        title: '⚡️ NCS: Electronic',
        visibility: 'everyone',
        description: null,
        total_items: 1048,
        views: 11868132,
        last_updated: 'Last updated on Apr 17, 2018',
        author: {
          id: 'UC_aEa8K-EOJ3D6gOs7HcyNg',
          name: 'NoCopyrightSounds',
          avatar: 'https://yt3.ggpht.com/-p-S-magPRTs/AAAAAAAAAAI/AAAAAAAAAAA/VkK9BqrRyuU/s100-mo-c-c0xffffffff-rj-k-no/photo.jpg', // eslint-disable-line max-len
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

  it('parses the general information of another playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/multiple_page_playlist/page1.html'), (err, data) => {
      ASSERT.ifError(err);
      const plistID = 'someID';
      const info_obj = UTIL.getGeneralInfo(data.toString(), plistID);
      ASSERT.deepEqual(info_obj, {
        id: plistID,
        url: `https://www.youtube.com/playlist?list=${plistID}`,
        title: '🔥 NCS: House',
        visibility: 'everyone',
        description: 'All House music uploads.',
        total_items: 155,
        views: 128553172,
        last_updated: 'Last updated on Apr 24, 2018',
        author: {
          id: 'UC_aEa8K-EOJ3D6gOs7HcyNg',
          name: 'NoCopyrightSounds',
          avatar: 'https://yt3.ggpht.com/-p-S-magPRTs/AAAAAAAAAAI/AAAAAAAAAAA/VkK9BqrRyuU/s100-mo-c-c0xffffffff-rj-k-no/photo.jpg', // eslint-disable-line max-len
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

describe('util.getVideoContainers()', () => {
  it('parses out all video containers of a playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, data) => {
      ASSERT.ifError(err);
      const containers = UTIL.getVideoContainers(data.toString());
      ASSERT.deepEqual(containers.length, 4);
      done();
    });
  });

  it('parses out all video containers of another playlist', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/multiple_page_playlist/page1.html'), (err, data) => {
      ASSERT.ifError(err);
      const containers = UTIL.getVideoContainers(data.toString());
      ASSERT.strictEqual(containers.length, 100);
      done();
    });
  });

  it('check whether video container is as expected', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/page1.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/video4.html'), (errOut, dataOut) => {
        ASSERT.ifError(errOut);
        const containers = UTIL.getVideoContainers(dataIn.toString());
        ASSERT.strictEqual(containers[3], dataOut.toString());
        done();
      });
    });
  });
});

describe('util.buildVideoObject()', () => {
  it('parses a video from its container', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/video4.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      const vidObj = UTIL.buildVideoObject(dataIn.toString());
      ASSERT.deepEqual(vidObj, {
        id: 'yHU6g3-35IU',
        url: 'https://www.youtube.com/watch?v=yHU6g3-35IU&list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5&index=43&t=0s',
        url_simple: 'https://www.youtube.com/watch?v=yHU6g3-35IU',
        title: 'NIVIRO - The Guardian Of Angels [NCS Release]',
        thumbnail: 'https://i.ytimg.com/vi/yHU6g3-35IU/hqdefault.jpg',
        duration: '3:36',
        author: {
          name: 'NoCopyrightSounds',
          ref: 'https://www.youtube.com/user/NoCopyrightSounds',
        },
      });
      done();
    });
  });

  it('parse a private video', done => {
    FS.readFile(PATH.resolve(__dirname, 'files/single_page_playlist/video2.html'), (err, dataIn) => {
      ASSERT.ifError(err);
      const vidObj = UTIL.buildVideoObject(dataIn.toString());
      ASSERT.deepEqual(vidObj, {
        id: 'YG-9u6_J05w',
        url: 'https://www.youtube.com/watch?v=YG-9u6_J05w&list=PLRBp0Fe2GpgnZOm5rCopMAOYhZCPoUyO5&index=41',
        url_simple: 'https://www.youtube.com/watch?v=YG-9u6_J05w',
        title: '[Private video]',
        thumbnail: 'https://s.ytimg.com/yts/img/no_thumbnail-vfl4t3-4R.jpg',
        duration: null,
        author: null,
      });
      done();
    });
  });
});

describe('util.between()', () => {
  it('`left` positioned at the start', () => {
    const rs = UTIL.between('<b>hello there friend</b>', '<b>', '</b>');
    ASSERT.strictEqual(rs, 'hello there friend');
  });

  it('somewhere in the middle', () => {
    const rs = UTIL.between('something everything nothing', ' ', ' ');
    ASSERT.strictEqual(rs, 'everything');
  });

  it('not found', () => {
    const rs = UTIL.between('oh oh _where_ is it', '<b>', '</b>');
    ASSERT.strictEqual(rs, '');
  });

  it('`right` before `left`', () => {
    const rs = UTIL.between('>>> a <this> and that', '<', '>');
    ASSERT.strictEqual(rs, 'this');
  });

  it('`right` not found', () => {
    const rs = UTIL.between('something [around[ somewhere', '[', ']');
    ASSERT.strictEqual(rs, '');
  });
});

describe('util.removeHtml()', () => {
  it('remove html', () => {
    ASSERT.strictEqual(
      UTIL.removeHtml('<a href="/someref">Artist1 - Nova (Official)</a><div class="pl-video-owner">'),
      'Artist1 - Nova (Official)',
    );
  });

  it('replace unknown characters', () => {
    ASSERT.strictEqual(UTIL.removeHtml('Artist1 &amp; Artist2 - Nova (Official)'), 'Artist1 & Artist2 - Nova (Official)');
  });

  it('keeps newlines', () => {
    ASSERT.strictEqual(UTIL.removeHtml('Artist1 &amp; Artist2 <br> Nova (Official)'), 'Artist1 & Artist2\nNova (Official)');
  });
});
