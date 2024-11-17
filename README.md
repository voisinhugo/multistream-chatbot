# Multi-stream chatbot for Twitch and YouTube

## Installation

### Prerequisites

- Node.js
- Yarn

### Install dependencies

```bash
yarn install
```

### Configuration

#### Twitch

Create a file `src/auth/tokenStorage.ts` with the following content:

```ts
export const twitchUsername = "#####";
export const twitchToken = "##########"; // get on https://twitchapps.com/tmi/
export const twitchChannel = "#####";
```

#### YouTube

On [Google Cloud Console](https://console.cloud.google.com), create a new project and [enable the YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com). Create an [OAuth2 client](https://console.cloud.google.com/auth/clients) and add the secrets JSON file to `src/auth/client_secret.json`.

## Run

```bash
yarn start
```
