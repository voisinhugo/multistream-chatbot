import { logger } from "../logger";
import { createLiveBroadcast } from "./createLiveBroadcast";
import { youtubeClient } from "./youtubeBot";

export const getLiveChatId = async () => {
  if (!youtubeClient) {
    logger.error("YouTube client is not initialized.");
    return;
  }
  try {
    const liveBroadcastsResponse = await youtubeClient.liveBroadcasts.list({
      broadcastStatus: "active",
      part: ["id"],
    });
    let liveId = liveBroadcastsResponse.data.items?.[0]?.id;
    if (!liveId) {
      logger.info("No active live found. Attempting to create one…");
      const newLiveId = await createLiveBroadcast();

      if (!newLiveId) {
        logger.error("Failed to create a new live broadcast.");
        return;
      }
      liveId = newLiveId;
      logger.info(
        `Created new YouTube live broadcast: https://studio.youtube.com/video/${liveId}/livestreaming`
      );
    }

    const videosResponse = await youtubeClient.videos.list({
      id: [liveId],
      part: ["liveStreamingDetails"],
    });
    const liveChatId =
      videosResponse.data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
    if (!liveChatId) {
      logger.error("No active chat found for this video.");
      return;
    }

    return liveChatId;
  } catch (error) {
    logger.error(`Error while retrieving YouTube chat ID: ${error}`);
  }
};
