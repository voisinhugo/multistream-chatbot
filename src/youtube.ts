import { google } from "googleapis";
import { initGoogleAuthClient } from "./auth/initGoogleAuthClient";
import { BOT_TAG } from "./botTags";
import { isMessageTransfer } from "./utils";
import { sendMessageIfArtistCommand } from "./sendMessageIfArtistCommand";
import { getLiveName } from "./artists/getArtists";
import { logger } from "./logger";

let youtubeClient: ReturnType<typeof google.youtube> | undefined;
let youtubeLiveChatId: string | undefined;

const createLiveBroadcast = async (): Promise<string | undefined> => {
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

const getLiveChatId = async () => {
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

export const initYouTube = async () => {
  try {
    const OAuth2Client = await initGoogleAuthClient();

    youtubeClient = google.youtube({
      version: "v3",
      auth: OAuth2Client,
    });

    youtubeLiveChatId = await getLiveChatId();

    logger.info("Connected to YouTube.");
  } catch (error) {
    logger.error(`Error while connecting to YouTube: ${error}`);
  }
};

export const sendToYouTube = async (message: string) => {
  if (!youtubeClient || !youtubeLiveChatId) {
    logger.error("YouTube client is not initialized.");
    return;
  }

  try {
    logger.info(`Sending to YouTube chat: ${message}`);
    await youtubeClient.liveChatMessages.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          type: "textMessageEvent",
          liveChatId: youtubeLiveChatId,
          textMessageDetails: {
            messageText: message,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error while sending a chat message to YouTube: ${error}`);
  }
};

let nextPageToken: string | null = null;

type MessageItem = {
  author: string;
  message: string;
};
const getYouTubeMessages = async (): Promise<MessageItem[] | undefined> => {
  if (!youtubeClient || !youtubeLiveChatId) {
    logger.error("YouTube client is not initialized.");
    return;
  }

  try {
    const response = await youtubeClient.liveChatMessages.list(
      {
        liveChatId: youtubeLiveChatId,
        part: ["snippet", "authorDetails"],
        ...(nextPageToken ? { pageToken: nextPageToken } : {}),
      },
      { responseType: "json" }
    );

    nextPageToken = response.data.nextPageToken || null;

    return response.data.items
      ?.map((item) => {
        const message = item.snippet?.displayMessage;
        const author = item.authorDetails?.displayName;
        if (!message || !author || isMessageTransfer(message)) {
          return null;
        }

        return { author, message };
      })
      .filter((message): message is MessageItem => message !== null);
  } catch (error) {
    logger.error(`Error while retrieving chat messages from YouTube: ${error}`);
  }
};

export const listenToYouTube = async (
  sendToOtherChats: (message: string) => void
) => {
  if (!youtubeClient) {
    logger.error("YouTube client is not initialized.");
    return;
  }
  const interval = setInterval(async () => {
    const messages = await getYouTubeMessages();
    if (messages) {
      messages.forEach(({ author, message }) => {
        const formattedMessage = `${BOT_TAG.youtube} ${author}: ${message}`;
        sendToOtherChats(formattedMessage);

        sendMessageIfArtistCommand(message, sendToYouTube);
      });
    }
  }, 5000);
  return interval;
};
