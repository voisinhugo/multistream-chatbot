import fs from "fs";
import { Credentials } from "./types";

const TOKEN_PATH = "src/auth/token.json";

export const loadToken = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  }
  return null;
};

export const saveToken = (token: Credentials) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
};
