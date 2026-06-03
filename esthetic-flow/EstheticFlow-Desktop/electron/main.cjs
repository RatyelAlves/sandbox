const {
  app,
  BrowserWindow,
  dialog,
  session,
  shell,
} = require("electron");

const path = require("path");

const {
  spawn,
} = require("child_process");

const fs = require("fs");

const http = require("http");

const express = require("express");

const {
  getBackendDir,
  getFrontendDistDir,
  getEvolutionDir,
} = require("../scripts/paths.cjs");

const {
  parseEnvFile,
  ensureDesktopBootstrap,
} = require("../scripts/bootstrap-data.cjs");

const isDev =
  !app.isPackaged ||
  process.env.ESTHETICFLOW_DEV ===
    "1";

const API_PORT = 3333;
/** Vite dev usa 5173; o .exe instalado usa outra porta para não conflitar. */
const UI_PORT = isDev ? 5173 : 4173;
const EVOLUTION_PORT = 8080;

/** @type {import('child_process').ChildProcess | null} */
let backendProcess = null;

/** @type {import('child_process').ChildProcess | null} */
let evolutionProcess = null;

/** @type {import('http').Server | null} */
let uiServer = null;

/** @type {BrowserWindow | null} */
let mainWindow = null;

function log(message) {
  console.log(
    `[EstheticFlow] ${message}`
  );
}

function waitForUrl(
  url,
  timeoutMs = 120000
) {
  return new Promise(
    (resolve, reject) => {
      const started = Date.now();

      function check() {
        const request =
          http.get(url, (response) => {
            response.resume();

            if (
              response.statusCode &&
              response.statusCode < 500
            ) {
              resolve();
              return;
            }

            retry();
          });

        request.on(
          "error",
          retry
        );

        function retry() {
          if (
            Date.now() - started >
            timeoutMs
          ) {
            reject(
              new Error(
                `Timeout aguardando ${url}`
              )
            );
            return;
          }

          setTimeout(
            check,
            500
          );
        }
      }

      check();
    }
  );
}

function getBackendRunner(
  backendDir
) {
  const tsxBin = path.join(
    backendDir,
    "node_modules",
    ".bin",
    process.platform === "win32"
      ? "tsx.cmd"
      : "tsx"
  );

  if (
    fs.existsSync(tsxBin)
  ) {
    return {
      command: tsxBin,
      args: ["src/server.ts"],
      shell:
        process.platform ===
        "win32",
    };
  }

  return {
    command: "npx",
    args: ["tsx", "src/server.ts"],
    shell: true,
  };
}

function killProcess(
  childProcess,
  label
) {
  if (
    !childProcess ||
    childProcess.killed
  ) {
    return;
  }

  try {
    if (
      process.platform === "win32"
    ) {
      spawn(
        "taskkill",
        [
          "/pid",
          String(
            childProcess.pid
          ),
          "/T",
          "/F",
        ],
        { shell: true }
      );
    } else {
      childProcess.kill(
        "SIGTERM"
      );
    }
  } catch {
    // ignore
  }

  log(`${label} encerrado`);
}

function startBundledEvolution(
  evolutionDir,
  evolutionEnvPath
) {
  const mainFile = path.join(
    evolutionDir,
    "dist",
    "main.js"
  );

  if (
    !fs.existsSync(mainFile)
  ) {
    throw new Error(
      "WhatsApp (Evolution) não encontrado no instalador."
    );
  }

  log(
    "Iniciando WhatsApp..."
  );

  const evolutionEnv =
    parseEnvFile(
      evolutionEnvPath
    );

  evolutionProcess = spawn(
    process.execPath,
    [mainFile],
    {
      cwd: evolutionDir,
      stdio: "inherit",
      env: {
        ...process.env,
        ...evolutionEnv,
        ELECTRON_RUN_AS_NODE: "1",
      },
    }
  );

  evolutionProcess.on(
    "exit",
    (code) => {
      log(
        `WhatsApp encerrado (código ${code ?? "?"})`
      );
    }
  );
}

function startBackend(
  backendDir,
  runtimeEnv
) {
  log(
    `Iniciando backend em ${backendDir}`
  );

  const runner =
    getBackendRunner(backendDir);

  backendProcess = spawn(
    runner.command,
    runner.args,
    {
      cwd: backendDir,
      shell: runner.shell,
      stdio: "inherit",
      env: {
        ...process.env,
        ...runtimeEnv,
        PORT: String(API_PORT),
        FRONTEND_URL: `http://localhost:${UI_PORT}`,
        ESTHETICFLOW_DESKTOP: "1",
      },
    }
  );

  backendProcess.on("exit", (code) => {
    log(
      `Backend encerrado (código ${code ?? "?"})`
    );
  });
}

function startUiServer() {
  const distDir =
    getFrontendDistDir(
      app.isPackaged,
      process.resourcesPath
    );

  if (
    !fs.existsSync(
      path.join(
        distDir,
        "index.html"
      )
    )
  ) {
    throw new Error(
      `Frontend build não encontrado em ${distDir}. Rode npm run build:frontend`
    );
  }

  const uiApp = express();

  uiApp.use(
    express.static(distDir)
  );

  uiApp.get(
    "*",
    (_request, response) => {
      response.sendFile(
        path.join(
          distDir,
          "index.html"
        )
      );
    }
  );

  return new Promise(
    (resolve, reject) => {
      uiServer = uiApp.listen(
        UI_PORT,
        "127.0.0.1",
        () => {
          log(
            `UI estática em http://localhost:${UI_PORT}`
          );
          resolve();
        }
      );

      uiServer.on(
        "error",
        reject
      );
    }
  );
}

async function createLoadingWindow() {
  const loadingWindow =
    new BrowserWindow({
      width: 420,
      height: 320,
      frame: true,
      resizable: false,
      center: true,
      title: "EstheticFlow",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

  await loadingWindow.loadFile(
    path.join(
      __dirname,
      "loading.html"
    )
  );

  return loadingWindow;
}

async function createWindow() {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    `http://localhost:${UI_PORT}`;

  mainWindow =
    new BrowserWindow({
      width: 1360,
      height: 860,
      minWidth: 960,
      minHeight: 640,
      title: "EstheticFlow",
      webPreferences: {
        preload: path.join(
          __dirname,
          "preload.cjs"
        ),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

  await mainWindow.loadURL(
    frontendUrl
  );

  mainWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      shell.openExternal(url);
      return {
        action: "deny",
      };
    }
  );

  if (isDev) {
    mainWindow.webContents.openDevTools(
      {
        mode: "detach",
      }
    );
  }
}

function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler(
    (
      _webContents,
      permission,
      callback
    ) => {
      const allowed = [
        "media",
        "mediaKeySystem",
        "notifications",
      ];

      callback(
        allowed.includes(
          permission
        )
      );
    }
  );
}

async function bootstrapProduction() {
  const loadingWindow =
    await createLoadingWindow();

  const userDataDir =
    app.getPath("userData");

  const backendDir =
    getBackendDir(
      true,
      process.resourcesPath
    );

  const evolutionDir =
    getEvolutionDir(
      true,
      process.resourcesPath
    );

  try {
    log(
      "Configurando primeira execução..."
    );

    const bootstrap =
      ensureDesktopBootstrap({
        userDataDir,
        backendDir,
      });

    startBundledEvolution(
      evolutionDir,
      bootstrap.evolutionEnvPath
    );

    await waitForUrl(
      `http://127.0.0.1:${EVOLUTION_PORT}`,
      180000
    );

    startBackend(
      backendDir,
      bootstrap.envValues
    );

    await waitForUrl(
      `http://127.0.0.1:${API_PORT}`,
      90000
    );

    await startUiServer();

    if (
      loadingWindow &&
      !loadingWindow.isDestroyed()
    ) {
      loadingWindow.close();
    }

    await createWindow();
  } catch (error) {
    if (
      loadingWindow &&
      !loadingWindow.isDestroyed()
    ) {
      loadingWindow.close();
    }

    throw error;
  }
}

async function bootstrap() {
  setupPermissions();

  if (isDev) {
    if (
      process.env.ESTHETICFLOW_DEV !==
      "1"
    ) {
      await dialog.showMessageBox(
        {
          type: "info",
          title: "EstheticFlow Desktop",
          message:
            "Use npm run dev na pasta desktop para iniciar backend, frontend e Electron juntos.",
        }
      );
    }

    await waitForUrl(
      `http://127.0.0.1:${API_PORT}`
    );

    await createWindow();
    return;
  }

  try {
    await bootstrapProduction();
  } catch (error) {
    await dialog.showErrorBox(
      "EstheticFlow",
      error instanceof Error
        ? error.message
        : String(error)
    );

    app.quit();
  }
}

app.whenReady().then(bootstrap);

app.on(
  "activate",
  async () => {
    if (
      BrowserWindow.getAllWindows()
        .length === 0
    ) {
      await createWindow();
    }
  }
);

app.on(
  "window-all-closed",
  () => {
    if (
      process.platform !==
      "darwin"
    ) {
      app.quit();
    }
  }
);

app.on(
  "before-quit",
  () => {
    stopUiServer();
    killProcess(
      backendProcess,
      "Backend"
    );
    killProcess(
      evolutionProcess,
      "WhatsApp"
    );
  }
);

function stopUiServer() {
  if (uiServer) {
    uiServer.close();
    uiServer = null;
  }
}
