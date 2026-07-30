const fb = require('react-player/lib/players/Facebook').default;

const fb_video = "https://www.facebook.com/facebook/videos/10153231379946729/";
const fb_watch = "https://www.facebook.com/watch/?v=10153231379946729";
const fb_reel = "https://www.facebook.com/reel/1358728122300960";
const fb_video_php = "https://www.facebook.com/video.php?v=1358728122300960";

console.log("fb_video canPlay:", fb.canPlay(fb_video));
console.log("fb_watch canPlay:", fb.canPlay(fb_watch));
console.log("fb_reel canPlay:", fb.canPlay(fb_reel));
console.log("fb_video_php canPlay:", fb.canPlay(fb_video_php));
