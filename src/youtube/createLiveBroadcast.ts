import { youtube_v3 } from "googleapis";
import { logger } from "../logger";
import { getLiveName } from "./getLiveName";
import { YoutubeClient } from "./types";

export const createLiveBroadcast = async (
  youtubeClient: YoutubeClient
): Promise<youtube_v3.Schema$LiveBroadcast | undefined> => {
  const existingStreams = await youtubeClient.liveStreams.list({
    part: ["id"],
    mine: true,
  });
  const streamId = existingStreams.data.items?.[0]?.id;
  if (!streamId) {
    logger.error(
      "No existing live stream found. Please create a stream key on YouTube Studio."
    );
    return;
  }

  const broadcastTitle = await getLiveName();
  logger.info(`YouTube live will be called: "${broadcastTitle}"`);

  const liveBroadcastInsert = await youtubeClient.liveBroadcasts.insert({
    part: ["id", "snippet", "status", "contentDetails"],
    requestBody: {
      snippet: {
        title: broadcastTitle,
        scheduledStartTime: new Date().toISOString(),
      },
      status: { privacyStatus: "public" },
      contentDetails: { enableAutoStart: true, latencyPreference: "low" },
    },
  });

  const broadcastId = liveBroadcastInsert.data.id;
  if (!broadcastId) {
    logger.error("Failed to create live broadcast.");
    return;
  }

  const liveBroadcastBind = await youtubeClient.liveBroadcasts.bind({
    id: broadcastId,
    part: ["id", "snippet", "status", "contentDetails"],
    streamId: streamId,
  });

  const newLiveBroadcast = liveBroadcastBind.data;
  logger.info(
    `Created new YouTube live broadcast: https://studio.youtube.com/video/${newLiveBroadcast.id}/livestreaming`
  );
  return newLiveBroadcast;
};
