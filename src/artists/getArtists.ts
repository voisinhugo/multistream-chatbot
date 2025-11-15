import { google } from "googleapis";
import fs from "fs";
import { logger } from "../logger";

type EditionData = {
  name: string | undefined;
  artists: Artist[];
};

type Artist = {
  name: string;
  instagram: string;
};

const sheets = google.sheets({
  version: "v4",
  auth: fs.readFileSync(`src/artists/googleApiKey.txt`, "utf8").trim(),
});

export const fetchEditionData = async (): Promise<EditionData | undefined> => {
  const spreadsheetId = "1ZyJAjyBQ08ZxQX90pU4DCbO7MP5ZnRmb6cvSYr2Jgvk";
  const range = "Coordonnées!A602:F"; // Column A: date, Column E: artist's name, Column F: artist's Instagram

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows: string[][] | undefined | null = res.data.values;

  if (!rows || rows.length === 0) {
    logger.error(
      "No data found. Check the spreadsheet, range, or authentification to Google."
    );
    return;
  }

  const todayString = getTodayFrenchDateString();
  const todaysRows = rows.filter((row) => row[0]?.includes(todayString));
  if (todaysRows.length === 0) {
    logger.error(
      `No edition found for today. Please check the spreadsheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    );
    return;
  }

  const editionNameRegex = new RegExp(`(\\d+e) \\(${todayString}\\)`);
  const editionName = todaysRows[0][0]?.match(editionNameRegex)?.[1];

  const artists = todaysRows.map((row) => ({
    name: row[4],
    instagram: `https://www.instagram.com/${row[5]}`,
  }));

  return {
    name: editionName,
    artists,
  };
};

export const fetchArtists = async (): Promise<Artist[] | undefined> => {
  const data = await fetchEditionData();
  return data?.artists;
};

export const getLiveName = async (): Promise<string | undefined> => {
  const editionData = await fetchEditionData();

  const prefix = editionData?.name ? `La ${editionData.name} ` : "L'";
  const mainArtist = editionData?.artists[editionData.artists.length - 1];
  const mainArtistString = mainArtist ? `avec ${mainArtist.name} ` : "";

  return `${prefix}édition du FIEALD ${mainArtistString}! 🎭`;
};

const getTodayFrenchDateString = (): string => {
  const today = new Date();
  return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
};
