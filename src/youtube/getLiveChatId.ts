import { logger } from "../logger";
import { createLiveBroadcast } from "./createLiveBroadcast";
import { YoutubeClient } from "./types";

export const getLiveChatId = async (youtubeClient: YoutubeClient) => {
  try {
    const activeBroadcast = await fetchActiveBroadcast(youtubeClient);
    const activeChatId = activeBroadcast?.snippet?.liveChatId;
    if (activeChatId) return activeChatId;

    const upcomingBroadcast = await fetchUpcomingBroadcast(youtubeClient);
    const upcomingChatId = upcomingBroadcast?.snippet?.liveChatId;
    if (upcomingChatId) return upcomingChatId;

    logger.info("No live found. Attempting to create one…");
    const newLiveBroadcast = await createLiveBroadcast(youtubeClient);
    if (!newLiveBroadcast) {
      logger.error("Failed to create a new live broadcast.");
      return;
    }

    return newLiveBroadcast?.snippet?.liveChatId ?? undefined;
  } catch (error) {
    logger.error(`Error while retrieving YouTube chat ID: ${error}`);
  }
};

const fetchActiveBroadcast = async (youtubeClient: YoutubeClient) => {
  const activeBroadcastsResponse = await youtubeClient.liveBroadcasts.list({
    broadcastStatus: "active",
    part: ["id", "snippet"],
  });
  return activeBroadcastsResponse.data.items?.[0];
};

const fetchUpcomingBroadcast = async (youtubeClient: YoutubeClient) => {
  const upcomingBroadcastsResponse = await youtubeClient.liveBroadcasts.list({
    broadcastStatus: "upcoming",
    part: ["id", "snippet"],
  });
  const upcomingBroadcast = upcomingBroadcastsResponse.data.items?.filter(
    (broadcast) => {
      if (!broadcast.snippet?.publishedAt) return false;
      return isToday(new Date(broadcast.snippet.publishedAt));
    }
  )?.[0];
  return upcomingBroadcast;
};

const isToday = (date: Date) => {
  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};
