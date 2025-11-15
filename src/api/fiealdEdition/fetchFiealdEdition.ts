import { google } from "googleapis";
import { logger } from "../../logger";
import { GOOGLE_API_KEY, SPREADSHEET_ID } from "../../auth/googleSheetsSecrets";
import { FiealdEdition } from "./types";

const sheets = google.sheets({
  version: "v4",
  auth: GOOGLE_API_KEY,
});

export const fetchFiealdEdition = async (): Promise<
  FiealdEdition | undefined
> => {
  const range = "Coordonnées!A602:F"; // Column A: date, Column E: artist's name, Column F: artist's Instagram

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });
  const rows: string[][] | null | undefined = res.data.values;

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
      `No edition found for today. Please check the spreadsheet: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`
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

const getTodayFrenchDateString = (): string => {
  const today = new Date();

  const dateString = today.getDate().toString().padStart(2, "0");
  const monthString = (today.getMonth() + 1).toString().padStart(2, "0");
  return `${dateString}/${monthString}/${today.getFullYear()}`;
};
