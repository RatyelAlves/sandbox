import fs from "fs";
import path from "path";

import { google } from "googleapis";

import { env } from "../../config/env";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

const TOKEN_PATH = path.join(
  __dirname,
  "../../config/google-token.json"
);

export function isGoogleCalendarConfigured() {

  return Boolean(
    env.googleClientId &&
    env.googleClientSecret
  );
}

export function isGoogleCalendarConnected() {

  return fs.existsSync(TOKEN_PATH);
}

export function getGoogleCalendarStatus() {

  return {
    configured:
      isGoogleCalendarConfigured(),

    connected:
      isGoogleCalendarConnected(),

    calendarId:
      env.googleCalendarId,

    calendarEmail:
      env.googleCalendarEmail ||
      null,
  };
}

export function createOAuth2Client() {

  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    env.googleRedirectUri
  );
}

export function getGoogleAuthUrl() {

  const client =
    createOAuth2Client();

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function saveGoogleTokensFromCode(
  code: string
) {

  const client =
    createOAuth2Client();

  const { tokens } =
    await client.getToken(code);

  fs.mkdirSync(
    path.dirname(TOKEN_PATH),
    { recursive: true }
  );

  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify(
      tokens,
      null,
      2
    )
  );

  return tokens;
}

function persistRefreshedTokens(
  tokens: object
) {

  fs.writeFileSync(
    TOKEN_PATH,
    JSON.stringify(
      tokens,
      null,
      2
    )
  );
}

export async function getGoogleCalendarClient() {

  if (!isGoogleCalendarConfigured()) {
    throw new Error(
      "GOOGLE_NOT_CONFIGURED"
    );
  }

  if (!isGoogleCalendarConnected()) {
    throw new Error(
      "GOOGLE_NOT_CONNECTED"
    );
  }

  const client =
    createOAuth2Client();

  const token = JSON.parse(
    fs.readFileSync(
      TOKEN_PATH,
      "utf-8"
    )
  );

  client.setCredentials(token);

  client.on(
    "tokens",

    (newTokens) => {

      const merged = {
        ...token,
        ...newTokens,
      };

      persistRefreshedTokens(
        merged
      );
    }
  );

  return google.calendar({
    version: "v3",
    auth: client,
  });
}
