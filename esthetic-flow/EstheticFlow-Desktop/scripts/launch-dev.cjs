const {
  spawn,
} = require("child_process");

const path = require("path");

const waitOn = require("wait-on");

const {
  getProjectRoot,
  getBackendDir,
  backendEnvExists,
} = require("./paths.cjs");

const root = getProjectRoot();

const backendDir = getBackendDir(
  false
);

const frontendDir = path.join(
  root,
  "frontend"
);

const desktopDir = root;

const children = [];

function log(message) {
  console.log(
    `[EstheticFlow] ${message}`
  );
}

function spawnProcess(
  label,
  command,
  args,
  cwd
) {
  log(
    `Iniciando ${label}...`
  );

  const child = spawn(
    command,
    args,
    {
      cwd,
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        FRONTEND_URL:
          "http://localhost:5173",
      },
    }
  );

  child.on("exit", (code) => {
    log(
      `${label} encerrado (código ${code ?? "?"})`
    );
  });

  children.push(child);

  return child;
}

function killChildren() {
  for (const child of children) {
    if (
      child &&
      !child.killed
    ) {
      try {
        if (
          process.platform ===
          "win32"
        ) {
          spawn(
            "taskkill",
            [
              "/pid",
              String(child.pid),
              "/T",
              "/F",
            ],
            { shell: true }
          );
        } else {
          child.kill("SIGTERM");
        }
      } catch {
        // ignore
      }
    }
  }
}

async function main() {
  if (
    !backendEnvExists(backendDir)
  ) {
    console.error(
      "\nErro: arquivo backend/.env não encontrado."
    );
    console.error(
      "Copie backend/.env.example para backend/.env e configure antes de abrir o app.\n"
    );
    process.exit(1);
  }

  spawnProcess(
    "backend",
    "npx",
    ["tsx", "src/server.ts"],
    backendDir
  );

  spawnProcess(
    "frontend",
    "npm",
    ["run", "dev"],
    frontendDir
  );

  log(
    "Aguardando backend (:3333) e frontend (:5173)..."
  );

  try {
    await waitOn({
      resources: [
        "http-get://127.0.0.1:3333",
        "http-get://localhost:5173",
      ],
      timeout: 120000,
      interval: 500,
    });
  } catch (error) {
    console.error(
      "Serviços não subiram a tempo:",
      error.message
    );
    killChildren();
    process.exit(1);
  }

  log("Abrindo janela Electron...");

  const electron = spawn(
    "npx",
    ["electron", "."],
    {
      cwd: desktopDir,
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        ESTHETICFLOW_DEV: "1",
        FRONTEND_URL:
          "http://localhost:5173",
      },
    }
  );

  children.push(electron);

  electron.on("exit", () => {
    killChildren();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  killChildren();
  process.exit(0);
});

process.on("SIGTERM", () => {
  killChildren();
  process.exit(0);
});

main().catch((error) => {
  console.error(error);
  killChildren();
  process.exit(1);
});
