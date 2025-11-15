import { fetchFiealdEdition } from "../api/fiealdEdition/fetchFiealdEdition";
import { Artist } from "../api/fiealdEdition/types";
import { logger } from "../logger";

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

const fetchArtists = async (): Promise<Artist[] | undefined> => {
  const data = await fetchFiealdEdition();
  return data?.artists;
};
