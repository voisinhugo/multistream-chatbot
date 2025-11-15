import { BOT_TAG } from "../bots/botTags";
import { isMessageTransfer } from "../bots/isMessageTransfer";
import { sendMessageIfArtistCommand } from "../commands/artistCommand";
import { logger } from "../logger";
import { sendToYouTube } from "./sendToYouTube";
import { youtubeClient, youtubeLiveChatId } from "./youtubeBot";

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
