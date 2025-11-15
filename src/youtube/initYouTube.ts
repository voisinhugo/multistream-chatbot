import { google } from "googleapis";
import { initGoogleAuthClient } from "../auth/initGoogleAuthClient";
import { logger } from "../logger";
import { getLiveChatId } from "./getLiveChatId";

let youtubeClient: ReturnType<typeof google.youtube> | undefined;
let youtubeLiveChatId: string | undefined;

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
