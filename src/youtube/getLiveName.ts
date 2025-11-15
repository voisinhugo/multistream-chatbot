import { fetchFiealdEdition } from "../api/fiealdEdition/fetchFiealdEdition";

export const getLiveName = async (): Promise<string | undefined> => {
  const edition = await fetchFiealdEdition();

  const prefix = edition?.name ? `La ${edition.name} ` : "L'";
  const mainArtist = edition?.artists[edition.artists.length - 1];
  const mainArtistString = mainArtist ? `avec ${mainArtist.name} ` : "";

  return `${prefix}édition du FIEALD ${mainArtistString}! 🎭`;
};
