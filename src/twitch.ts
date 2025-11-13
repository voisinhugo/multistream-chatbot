import tmi from "tmi.js";
import {
  twitchChannel,
  twitchToken,
  twitchUsername,
} from "./auth/twitchSecrets";
import { BOT_TAG } from "./botTags";
import { sendMessageIfArtistCommand } from "./sendMessageIfArtistCommand";
import { isMessageTransfer } from "./utils";

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

    console.log("Connected to Twitch.");
  } catch (error) {
    console.error("Error while connecting to Twitch:", error);
  }
};

export const sendToTwitch = async (message: string) => {
  if (!twitchClient) {
    console.error("Twitch client is not initialized.");
    return;
  }

  await twitchClient.say(twitchChannel, message);
};

export const listenToTwitch = async (
  sendToOtherChats: (message: string) => void
) => {
  if (!twitchClient) {
    console.error("Twitch client is not initialized.");
    return;
  }

  twitchClient.on("message", (_channel, tags, message, self) => {
    if (isMessageTransfer(message)) return;

    const formattedMessage = `${BOT_TAG.twitch} ${tags["display-name"]}: ${message}`;
    console.log(formattedMessage);
    sendToOtherChats(formattedMessage);

    sendMessageIfArtistCommand(message, sendToTwitch);
  });
};
