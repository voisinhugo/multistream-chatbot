import { fetchArtists } from "./artists/getArtists";

export const sendMessageIfArtistCommand = async (
  message: string,
  ...callbacks: ((message: string) => void)[]
) => {
  const artistMatch = message.trim().match(/^!artiste(\d+)$/i);
  if (!artistMatch) return;

  const artistIndex = Number(artistMatch[1]) - 1;
  const artists = await fetchArtists();
  const artist = artists?.[artistIndex];
  if (!artist) return;

  const artistMessage = `Retrouvez ${artist.name} sur ${artist.instagram}`;
  console.log(artistMessage);
  callbacks.forEach((callback) => callback(artistMessage));
};
