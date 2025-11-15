import { fetchArtists } from "./artists/getArtists";
import { logger } from "./logger";

export const sendMessageIfArtistCommand = async (
  message: string,
  sendMessage: (message: string) => void
) => {
  const artistMatch = message.trim().match(/^!artiste(\d+)$/i);
  if (!artistMatch) return;

  const artistIndex = Number(artistMatch[1]) - 1;
  const artists = await fetchArtists();
  const artist = artists?.[artistIndex];
  if (!artist) return;

  const artistMessage = `Retrouvez ${artist.name} sur ${artist.instagram}`;
  logger.info(artistMessage);
  sendMessage(artistMessage);
};
