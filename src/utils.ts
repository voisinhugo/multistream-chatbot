import { BOT_TAGS } from "./botTags";

export const isMessageFromBot = (message: string) =>
  BOT_TAGS.some((tag) => message.startsWith(tag));
