const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const desktopDir = path.resolve(
  __dirname,
  ".."
);

const unpackedDir = path.join(
  desktopDir,
  "release",
  "win-unpacked"
);

const zipPath = path.join(
  desktopDir,
  "release",
  "EstheticFlow-1.0.0-portable.zip"
);

if (
  !fs.existsSync(
    path.join(
      unpackedDir,
      "EstheticFlow.exe"
    )
  )
) {
  console.error(
    "\nErro: rode npm run pack antes (pasta win-unpacked não encontrada).\n"
  );
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(
  "[EstheticFlow] Criando ZIP (melhor para notebooks fracos)..."
);

execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${zipPath}' -CompressionLevel Fastest"`,
  { stdio: "inherit" }
);

const sizeMb = (
  fs.statSync(zipPath).size /
  1024 /
  1024
).toFixed(1);

console.log(
  `\nPronto: ${zipPath} (${sizeMb} MB)`
);
console.log(
  "Na outra máquina: extraia a pasta e execute EstheticFlow.exe\n"
);
