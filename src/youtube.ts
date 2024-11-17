import { google } from "googleapis";
import { initGoogleAuthClient } from "./auth/initGoogleAuthClient";
import { BOT_TAG } from "./botTags";
import { isMessageFromBot } from "./utils";

let youtubeClient: ReturnType<typeof google.youtube> | undefined;
let youtubeLiveChatId: string | undefined;

const getLiveChatId = async () => {
  if (!youtubeClient) {
    console.error("YouTube n'est pas initialisé");
    return;
  }
  try {
    const liveBroadcastsResponse = await youtubeClient.liveBroadcasts.list({
      broadcastStatus: "active",
      part: ["id"],
    });
    const liveId = liveBroadcastsResponse.data.items?.[0]?.id;
    if (!liveId) {
      console.log("Pas de live actif trouvé.");
      return;
    }

    const videosResponse = await youtubeClient.videos.list({
      id: [liveId],
      part: ["liveStreamingDetails"],
    });
    const liveChatId =
      videosResponse.data.items?.[0]?.liveStreamingDetails?.activeLiveChatId;
    if (!liveChatId) {
      console.log("Pas de chat actif trouvé pour cette vidéo.");
      return;
    }

    return liveChatId;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID du chat:", error);
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

    console.log("Connecté à YouTube");
  } catch (error) {
    console.error("Erreur lors de l'initialisation de YouTube:", error);
  }
};

export const sendToYouTube = async (message: string) => {
  if (!youtubeClient || !youtubeLiveChatId) {
    console.error("YouTube n'est pas initialisé");
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
    console.error("Erreur lors de l'envoi vers YouTube:", error);
  }
};

let nextPageToken: string | null = null;

const getYouTubeMessages = async (): Promise<string[] | undefined> => {
  if (!youtubeClient || !youtubeLiveChatId) {
    console.error("YouTube n'est pas initialisé");
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
    console.error(
      "Erreur lors de la récupération des messages YouTube:",
      error
    );
  }
};

export const listenToYouTube = async (callback: (message: string) => void) => {
  if (!youtubeClient) {
    console.error("YouTube n'est pas initialisé");
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
