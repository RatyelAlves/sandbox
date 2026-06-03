const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const desktopDir = path.resolve(
  __dirname,
  ".."
);

const vendorDir = path.join(
  desktopDir,
  "vendor",
  "evolution-api"
);

const marker = path.join(
  vendorDir,
  "dist",
  "main.js"
);

const expressMarker = path.join(
  vendorDir,
  "node_modules",
  "express",
  "package.json"
);

function log(message) {
  console.log(
    `[EstheticFlow] ${message}`
  );
}

function isValidEvolution() {
  return (
    fs.existsSync(marker) &&
    fs.existsSync(expressMarker)
  );
}

function cleanVendorDir() {
  if (
    fs.existsSync(vendorDir)
  ) {
    fs.rmSync(vendorDir, {
      recursive: true,
      force: true,
    });
  }
}

function tryDockerCopy() {
  log(
    "Copiando Evolution API da imagem Docker (sem symlinks)..."
  );

  fs.mkdirSync(vendorDir, {
    recursive: true,
  });

  const mountPath =
    process.platform === "win32"
      ? vendorDir.replace(/\\/g, "/")
      : vendorDir;

  execSync(
    `docker run --rm --entrypoint sh -v "${mountPath}:/out" atendai/evolution-api:v2.2.3 -c "cp -aL /evolution/. /out/"`,
    {
      stdio: "inherit",
      shell: true,
    }
  );
}

function tryGitClone() {
  log(
    "Baixando Evolution API do GitHub..."
  );

  fs.mkdirSync(
    path.join(
      desktopDir,
      "vendor"
    ),
    { recursive: true }
  );

  execSync(
    "git clone --depth 1 --branch 2.2.3 https://github.com/EvolutionAPI/evolution-api.git evolution-api",
    {
      cwd: path.join(
        desktopDir,
        "vendor"
      ),
      stdio: "inherit",
    }
  );

  log(
    "Instalando dependências da Evolution API..."
  );

  execSync("npm install", {
    cwd: vendorDir,
    stdio: "inherit",
  });

  log(
    "Gerando Prisma da Evolution..."
  );

  execSync(
    "npm run db:generate",
    {
      cwd: vendorDir,
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_PROVIDER: "sqlite",
      },
    }
  );

  log(
    "Compilando Evolution API..."
  );

  execSync("npm run build", {
    cwd: vendorDir,
    stdio: "inherit",
  });
}

function main() {
  if (isValidEvolution()) {
    log(
      "Evolution API já preparada."
    );
    return;
  }

  if (
    fs.existsSync(vendorDir)
  ) {
    log(
      "Evolution incompleta detectada, refazendo..."
    );
  }

  cleanVendorDir();

  try {
    tryDockerCopy();
  } catch (dockerError) {
    console.warn(
      "Docker falhou:",
      dockerError.message
    );

    cleanVendorDir();

    try {
      tryGitClone();
    } catch (gitError) {
      console.error(
        "\nErro ao preparar Evolution API:",
        gitError.message
      );
      process.exit(1);
    }
  }

  if (!isValidEvolution()) {
    console.error(
      "\nErro: Evolution API inválida após preparação.\n"
    );
    process.exit(1);
  }

  log(
    "Evolution API pronta para empacotar."
  );
}

main();
