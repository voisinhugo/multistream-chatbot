import { initTwitch, listenToTwitch, sendToTwitch } from "./twitch";
import { initYouTube, listenToYouTube, sendToYouTube } from "./youtube";

const main = async () => {
  await initTwitch();
  await initYouTube();

  listenToTwitch(sendToYouTube);
  listenToYouTube(sendToTwitch);
};

main();
