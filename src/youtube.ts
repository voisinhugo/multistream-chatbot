import { google } from "googleapis";
import { initGoogleAuthClient } from "./auth/initGoogleAuthClient";
import { BOT_TAG } from "./botTags";
import { isMessageTransfer } from "./utils";
import { sendMessageIfArtistCommand } from "./sendMessageIfArtistCommand";
import { getLiveName } from "./artists/getArtists";

let youtubeClient: ReturnType<typeof google.youtube> | undefined;
let youtubeLiveChatId: string | undefined;

const createLiveBroadcast = async (): Promise<string | undefined> => {
  if (!youtubeClient) {
    console.error("YouTube client is not initialized.");
    return;
  }

  const existingStreams = await youtubeClient.liveStreams.list({
    part: ["id"],
    mine: true,
  });
  const streamId = existingStreams.data.items?.[0]?.id;

  if (!streamId) {
    console.error(
      "No existing live stream found. Please create a stream key on YouTube Studio."
    );
    return;
  }
  const broadcastTitle = await getLiveName();
  console.log(`YouTube live will be called: "${broadcastTitle}"`);

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
    console.error("Failed to create live broadcast (no broadcast ID).");
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
    console.error("YouTube client is not initialized.");
    return;
  }
  try {
    const liveBroadcastsResponse = await youtubeClient.liveBroadcasts.list({
      broadcastStatus: "active",
      part: ["id"],
    });
    let liveId = liveBroadcastsResponse.data.items?.[0]?.id;
    if (!liveId) {
      console.log("No active live found. Attempting to create one…");
      const newLiveId = await createLiveBroadcast();

      if (!newLiveId) {
        console.error("Failed to create a new live broadcast.");
        return;
      }
      liveId = newLiveId;
      console.log(
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

type MessageItem = {
  author: string;
  message: string;
};
const getYouTubeMessages = async (): Promise<MessageItem[] | undefined> => {
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
        if (!message || !author || isMessageTransfer(message)) {
          return null;
        }

        return { author, message };
      })
      .filter((message): message is MessageItem => message !== null);
  } catch (error) {
    console.error("Error while retrieving chat messages from YouTube:", error);
  }
};

export const listenToYouTube = async (
  sendToOtherChats: (message: string) => void
) => {
  if (!youtubeClient) {
    console.error("YouTube client is not initialized.");
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
