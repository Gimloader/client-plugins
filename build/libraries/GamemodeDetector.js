/**
 * @name GamemodeDetector
 * @description Detects which official 2d gamemode the player is in
 * @author TheLazySquid
 * @version 0.2.2
 * @downloadUrl https://raw.githubusercontent.com/Gimloader/client-plugins/refs/heads/main/build/libraries/GamemodeDetector.js
 * @webpage https://gimloader.github.io/libraries/gamemodedetector/
 * @changelog Added webpage link
 * @isLibrary true
 */

// libraries/GamemodeDetector/src/index.ts
var gamemodeMusic = {
  "Don't Look Down": "/assets/map/modes/dontLookDown/music.mp3",
  "Fishtopia": "/assets/map/music/fishtopia/music.mp3",
  "Capture The Flag": "/assets/map/music/ctf/music.mp3",
  "Knockback": "/assets/map/modes/knockback/music.mp3",
  "Color Clash": "/assets/map/modes/paint/music.mp3",
  "Diamond Rush": "/assets/map/modes/lucky/music.mp3",
  "Dig It Up": "/assets/map/modes/mining/music.mp3",
  "One Way Out": "/assets/map/modes/oneWayOut/music.mp3",
  "Snowbrawl": "/assets/map/modes/snowbrawl/music.mp3",
  "Blastball": "/assets/map/modes/blastball/sound/music.mp3",
  "Snowy Survival": "/assets/map/modes/snowInfection/music.mp3",
  "Apocalypse": "/assets/map/modes/zombie/music.mp3",
  "Tag": "/assets/map/music/tag/music.mp3",
  "Farmchain": "/assets/map/modes/farm/music.mp3"
};
function currentGamemode() {
  const optionsJson = api.stores?.world?.mapOptionsJSON;
  if (!optionsJson) return null;
  const music = JSON.parse(optionsJson).musicUrl;
  for (const gamemode in gamemodeMusic) {
    if (music === gamemodeMusic[gamemode]) return gamemode;
  }
  return null;
}
export {
  currentGamemode
};
