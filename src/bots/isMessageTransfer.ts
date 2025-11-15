import { BOT_TAGS } from "./botTags";

export const isMessageTransfer = (message: string) =>
  BOT_TAGS.some((tag) => message.startsWith(tag));
