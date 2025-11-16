import { logger } from "../logger";
import { youtubeChatId, youtubeClient } from "./initYouTube";

export const sendToYouTube = async (message: string) => {
  if (!youtubeClient || !youtubeChatId) {
    logger.error("Missing YouTube client or chat ID.");
    return;
  }

  try {
    logger.info(`Sending to YouTube chat: ${message}`);
    await youtubeClient.liveChatMessages.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          type: "textMessageEvent",
          liveChatId: youtubeChatId,
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
