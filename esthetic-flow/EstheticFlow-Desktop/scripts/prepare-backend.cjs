const {
  execSync,
} = require("child_process");

const path = require("path");

const {
  getBackendDir,
  backendEnvExists,
} = require("./paths.cjs");

const backendDir = getBackendDir(false);

console.log(
  "[EstheticFlow] Instalando dependências do backend..."
);

execSync(
  "npm install",
  {
    cwd: backendDir,
    stdio: "inherit",
  }
);

console.log(
  "[EstheticFlow] Gerando Prisma Client (desktop/SQLite)..."
);

execSync(
  "npx prisma generate --schema prisma/schema.desktop.prisma",
  {
    cwd: backendDir,
    stdio: "inherit",
  }
);

console.log(
  "[EstheticFlow] Backend pronto para empacotar."
);
