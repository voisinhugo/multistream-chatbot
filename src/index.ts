import { initTwitch, listenToTwitch, sendToTwitch } from "./twitch/twitch";
import { listenToYouTube } from "./youtube/listenToYouTube";
import { initYouTube } from "./youtube/initYouTube";
import { sendToYouTube } from "./youtube/sendToYouTube";

const main = async () => {
  await initTwitch();
  await initYouTube();

  listenToTwitch(sendToYouTube);
  listenToYouTube(sendToTwitch);
};

main();
