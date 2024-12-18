import { google } from "googleapis";
import { initGoogleAuthClient } from "./auth/initGoogleAuthClient";
import { BOT_TAG } from "./botTags";
import { isMessageFromBot } from "./utils";

let youtubeClient: ReturnType<typeof google.youtube> | undefined;
let youtubeLiveChatId: string | undefined;

const getLiveChatId = async () => {
  if (!youtubeClient) {
    console.error("YouTube client is not initialized.");
    return;
  }
  try {
    const liveBroadcastsResponse = await youtubeClient.liveBroadcasts.list({
      broadcastStatus: "active",
      part: ["id"],
    });
    const liveId = liveBroadcastsResponse.data.items?.[0]?.id;
    if (!liveId) {
      console.log("No active live found.");
      return;
    }

    const videosResponse = await youtubeClient.videos.list({
      id: [liveId],
      part: ["liveStreamingDetails"],
    });
    const liveChatId =
      videosResponse.data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
    if (!liveChatId) {
      console.log("No active chat found for this video.");
      return;
    }

    return liveChatId;
  } catch (error) {
    console.error("Error while retrieving YouTube chat ID:", error);
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

    console.log("Connected to YouTube.");
  } catch (error) {
    console.error("Error while connecting to YouTube:", error);
  }
};

export const sendToYouTube = async (message: string) => {
  if (!youtubeClient || !youtubeLiveChatId) {
    console.error("YouTube client is not initialized.");
    return;
  }

  try {
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
    console.error("Error while sending a chat message to YouTube:", error);
  }
};

let nextPageToken: string | null = null;

const getYouTubeMessages = async (): Promise<string[] | undefined> => {
  if (!youtubeClient || !youtubeLiveChatId) {
    console.error("YouTube client is not initialized.");
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
        if (!message || !author || isMessageFromBot(message)) {
          return null;
        }

        const formattedMessage = `${BOT_TAG.youtube} ${author}: ${message}`;
        console.log(formattedMessage);
        return formattedMessage;
      })
      .filter((message): message is string => message !== null);
  } catch (error) {
    console.error("Error while retrieving chat messages from YouTube:", error);
  }
};

export const listenToYouTube = async (callback: (message: string) => void) => {
  if (!youtubeClient) {
    console.error("YouTube client is not initialized.");
    return;
  }
  const interval = setInterval(async () => {
    const messages = await getYouTubeMessages();
    if (messages) {
      messages.forEach((message) => {
        callback(message);
      });
    }
  }, 5000);
  return interval;
};
