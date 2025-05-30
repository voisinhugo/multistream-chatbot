import express from "express";
import { google } from "googleapis";
import open from "open";
import GoogleCredentials from "./client_secret.json";
import { Credentials, OAuth2Client } from "./types";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

export const initGoogleAuthClient = async () => {
  const { client_secret, client_id, redirect_uris } =
    GoogleCredentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const newToken = await getAccessToken(oAuth2Client);
  oAuth2Client.setCredentials(newToken);

  return oAuth2Client;
};

const getAccessToken = async (
  oAuth2Client: OAuth2Client
): Promise<Credentials> => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this URL:", authUrl);
  open(authUrl);

  return new Promise((resolve, reject) => {
    const app = runCodeRedirectionServer(async (code) => {
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        resolve(tokens);
      } catch (error) {
        reject(error);
      }
    });
    app.on("error", reject);
  });
};

const runCodeRedirectionServer = (onRedirection: (code: string) => void) => {
  const app = express();

  app.get("/", async (req, res) => {
    const code = req.query.code;
    if (code && typeof code === "string") {
      onRedirection(code);
      res.send("You can now close this tab.");
    } else {
      res.send("No code received.");
    }
  });

  app.listen(3000);

  return app;
};
