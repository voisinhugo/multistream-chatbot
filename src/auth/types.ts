import type { OAuth2Client as GoogleOAuth2Client } from "google-auth-library";

export type OAuth2Client = GoogleOAuth2Client;
export type Credentials = Parameters<GoogleOAuth2Client["setCredentials"]>[0];
