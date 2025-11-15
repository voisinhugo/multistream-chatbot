import tmi from "tmi.js";
import {
  twitchChannel,
  twitchToken,
  twitchUsername,
} from "./auth/twitchSecrets";
import { BOT_TAG } from "./botTags";
import { sendMessageIfArtistCommand } from "./sendMessageIfArtistCommand";
import { isMessageTransfer } from "./utils";
import { logger } from "./logger";

let twitchClient: tmi.Client | undefined;

export const initTwitch = async () => {
  twitchClient = new tmi.Client({
    options: { debug: true },
    identity: {
      username: twitchUsername,
      password: twitchToken,
    },
    channels: [twitchChannel],
  });

  try {
    await twitchClient.connect();

    logger.info("Connected to Twitch.");
  } catch (error) {
    logger.error(`Error while connecting to Twitch: ${error}`);
  }
};

export const sendToTwitch = async (message: string) => {
  if (!twitchClient) {
    logger.error("Twitch client is not initialized.");
    return;
  }

  logger.info(`Sending to Twitch chat: ${message}`);
  await twitchClient.say(twitchChannel, message);
};

export const listenToTwitch = async (
  sendToOtherChats: (message: string) => void
) => {
  if (!twitchClient) {
    logger.error("Twitch client is not initialized.");
    return;
  }

  twitchClient.on("message", (_channel, tags, message, self) => {
    if (isMessageTransfer(message)) return;

    const formattedMessage = `${BOT_TAG.twitch} ${tags["display-name"]}: ${message}`;
    sendToOtherChats(formattedMessage);

    sendMessageIfArtistCommand(message, sendToTwitch);
  });
};
