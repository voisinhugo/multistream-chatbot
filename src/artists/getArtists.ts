import { google } from "googleapis";
import fs from "fs";

type Artist = {
  name: string;
  instagram: string;
};

const sheets = google.sheets({
  version: "v4",
  auth: fs.readFileSync(`src/artists/googleApiKey.txt`, "utf8").trim(),
});

export const fetchArtists = async (): Promise<Artist[] | undefined> => {
  const spreadsheetId = "1ZyJAjyBQ08ZxQX90pU4DCbO7MP5ZnRmb6cvSYr2Jgvk";
  const range = "Coordonnées!A602:F"; // Column A: date, Column E: artist's name, Column F: artist's Instagram

  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows: string[][] | undefined | null = res.data.values;

  if (!rows || rows.length === 0) {
    console.error(
      "No data found. Check the spreadsheet, range, or authentification to Google."
    );
    return;
  }

  const todayString = getTodayFrenchDateString();
  const todaysRows = rows.filter((row) => row[0]?.includes(todayString));

  const artists = todaysRows.map((row) => ({
    name: row[4],
    instagram: `https://www.instagram.com/${row[5]}`,
  }));

  return artists;
};

const getTodayFrenchDateString = (): string => {
  const today = new Date();
  return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
};
