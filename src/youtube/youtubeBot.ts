import { google } from "googleapis";

export let youtubeClient: ReturnType<typeof google.youtube> | undefined;
export let youtubeLiveChatId: string | undefined;
