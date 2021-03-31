const YTPL = require('../');
const FS = require('fs');
const UTIL = require('util');

const main = async() => {
  let saveString;

  // Save playlist
  const search = await YTPL('PLRBp0Fe2GpglkzuspoGv-mu7B2ce9_0Fn', { limit: 15 });
  saveString = UTIL.inspect(search, { depth: Infinity });
  FS.writeFileSync('./example_output.txt', saveString);
};
main();


const main2 = async () => {
  const cn = 'https://www.youtube.com/c/NoCopyrightSounds'
  console.log(await YTPL.channelPlaylists(cn))
}
// main2();