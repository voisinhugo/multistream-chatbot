import { logger } from "../logger";
import { youtubeClient, youtubeLiveChatId } from "./youtubeBot";

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
