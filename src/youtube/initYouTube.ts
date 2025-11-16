import { google } from "googleapis";
import { initGoogleAuthClient } from "../auth/initGoogleAuthClient";
import { logger } from "../logger";
import { getLiveChatId } from "./getLiveChatId";
import { YoutubeChatId, YoutubeClient } from "./types";

export let youtubeClient: YoutubeClient | undefined;
export let youtubeChatId: YoutubeChatId | undefined;

export const initYouTube = async () => {
  try {
    const OAuth2Client = await initGoogleAuthClient();

    youtubeClient = google.youtube({
      version: "v3",
      auth: OAuth2Client,
    });
    if (!youtubeClient) {
      logger.error("Failed to initialize YouTube client.");
      return;
    }

    youtubeChatId = await getLiveChatId(youtubeClient);
    if (!youtubeChatId) {
      logger.error("Failed to retrieve YouTube live chat ID.");
      return;
    }

    logger.info("Connected to YouTube.");
  } catch (error) {
    logger.error(`Error while connecting to YouTube: ${error}`);
  }
};
