const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

function parseEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const values = {};

  for (const line of fs.readFileSync(
    envPath,
    "utf8"
  ).split(/\r?\n/)) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.startsWith("#")
    ) {
      continue;
    }

    const separator =
      trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed
      .slice(0, separator)
      .trim();

    let value = trimmed
      .slice(separator + 1)
      .trim();

    if (
      (value.startsWith('"') &&
        value.endsWith('"')) ||
      (value.startsWith("'") &&
        value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function writeEnvFile(
  envPath,
  values
) {
  const content =
    Object.entries(values)
      .map(
        ([key, value]) =>
          `${key}=${value}`
      )
      .join("\n") + "\n";

  fs.writeFileSync(
    envPath,
    content,
    "utf8"
  );
}

function ensureDesktopBootstrap({
  userDataDir,
  backendDir,
}) {
  const dataDir = path.join(
    userDataDir,
    "data"
  );

  const evolutionDataDir =
    path.join(
      userDataDir,
      "evolution"
    );

  fs.mkdirSync(dataDir, {
    recursive: true,
  });

  fs.mkdirSync(
    evolutionDataDir,
    {
      recursive: true,
    }
  );

  const envPath = path.join(
    userDataDir,
    ".env"
  );

  const dbPath = path.join(
    dataDir,
    "estheticflow.db"
  );

  const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

  let envValues = parseEnvFile(
    envPath
  );

  if (
    !fs.existsSync(envPath)
  ) {
    envValues = {
      PORT: "3333",
      DATABASE_URL: `"${dbUrl}"`,
      EVOLUTION_API_URL:
        "http://127.0.0.1:8080",
      EVOLUTION_INSTANCE:
        "estheticflow",
      EVOLUTION_API_KEY:
        `ef-${crypto.randomBytes(12).toString("hex")}`,
      ADMIN_EMAIL:
        "admin@estheticflow.local",
      ADMIN_PASSWORD: "admin123",
      JWT_SECRET: crypto
        .randomBytes(32)
        .toString("hex"),
      FRONTEND_URL:
        "http://localhost:5173",
      WEBHOOK_BASE_URL:
        "http://127.0.0.1:3333",
      ESTHETICFLOW_DESKTOP: "1",
    };

    writeEnvFile(
      envPath,
      envValues
    );
  }

  const prismaSchema = path.join(
    backendDir,
    "prisma",
    "schema.desktop.prisma"
  );

  const prismaBin = path.join(
    backendDir,
    "node_modules",
    ".bin",
    process.platform === "win32"
      ? "prisma.cmd"
      : "prisma"
  );

  if (
    !fs.existsSync(dbPath)
  ) {
    console.log(
      "[EstheticFlow] Criando banco local..."
    );

    execSync(
      `"${prismaBin}" db push --schema="${prismaSchema}" --skip-generate --accept-data-loss`,
      {
        cwd: backendDir,
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
        timeout: 120000,
      }
    );
  } else {
    console.log(
      "[EstheticFlow] Banco local OK."
    );
  }

  const evolutionEnvPath =
    path.join(
      userDataDir,
      "evolution.env"
    );

  if (
    !fs.existsSync(
      evolutionEnvPath
    )
  ) {
    const evolutionDbPath =
      path.join(
        evolutionDataDir,
        "evolution.db"
      );

    const evolutionEnv = {
      SERVER_TYPE: "http",
      SERVER_PORT: "8080",
      SERVER_URL:
        "http://127.0.0.1:8080",
      AUTHENTICATION_API_KEY:
        envValues.EVOLUTION_API_KEY ||
        "estheticflow-desktop",
      DATABASE_ENABLED: "true",
      DATABASE_PROVIDER: "sqlite",
      DATABASE_CONNECTION_URI: `file:${evolutionDbPath.replace(/\\/g, "/")}`,
      DATABASE_SAVE_DATA_INSTANCE:
        "true",
      DATABASE_SAVE_DATA_NEW_MESSAGE:
        "true",
      DATABASE_SAVE_MESSAGE_UPDATE:
        "true",
      DATABASE_SAVE_DATA_CONTACTS:
        "true",
      DATABASE_SAVE_DATA_CHATS:
        "true",
      CACHE_REDIS_ENABLED: "false",
      CACHE_LOCAL_ENABLED: "true",
      LOG_LEVEL: "ERROR",
      CONFIG_SESSION_PHONE_VERSION:
        "2.3000.1039700148",
      DEL_INSTANCE: "false",
    };

    writeEnvFile(
      evolutionEnvPath,
      evolutionEnv
    );
  }

  return {
    envPath,
    envValues: parseEnvFile(
      envPath
    ),
    evolutionEnvPath,
    evolutionDataDir,
  };
}

module.exports = {
  parseEnvFile,
  ensureDesktopBootstrap,
};
