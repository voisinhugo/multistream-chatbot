import { logger } from "../logger";
import { getLiveName } from "./getLiveName";
import { youtubeClient } from "./youtubeBot";

export const createLiveBroadcast = async (): Promise<string | undefined> => {
  if (!youtubeClient) {
    logger.error("YouTube client is not initialized.");
    return;
  }

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
    part: ["snippet", "status", "contentDetails"],
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
    logger.error("Failed to create live broadcast (no broadcast ID).");
    return;
  }

  await youtubeClient.liveBroadcasts.bind({
    id: broadcastId,
    part: ["id", "snippet", "status", "contentDetails"],
    streamId: streamId,
  });

  return broadcastId;
};
