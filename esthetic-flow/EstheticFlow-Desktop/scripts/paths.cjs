const fs = require("fs");
const path = require("path");

function getProjectRoot() {
  return path.resolve(
    __dirname,
    ".."
  );
}

function getBackendDir(
  isPackaged,
  resourcesPath
) {
  if (isPackaged) {
    return path.join(
      resourcesPath,
      "backend"
    );
  }

  return path.join(
    getProjectRoot(),
    "backend"
  );
}

function getFrontendDistDir(
  isPackaged,
  resourcesPath
) {
  if (isPackaged) {
    return path.join(
      resourcesPath,
      "frontend",
      "dist"
    );
  }

  return path.join(
    getProjectRoot(),
    "frontend",
    "dist"
  );
}

function getBackendEnvPath(
  backendDir
) {
  return path.join(
    backendDir,
    ".env"
  );
}

function backendEnvExists(
  backendDir
) {
  return fs.existsSync(
    getBackendEnvPath(backendDir)
  );
}

function getEvolutionDir(
  isPackaged,
  resourcesPath
) {
  if (isPackaged) {
    return path.join(
      resourcesPath,
      "evolution-api"
    );
  }

  return path.join(
    __dirname,
    "../vendor/evolution-api"
  );
}

function getUserDataDir(app) {
  return app.getPath("userData");
}

module.exports = {
  getProjectRoot,
  getBackendDir,
  getFrontendDistDir,
  getBackendEnvPath,
  backendEnvExists,
  getEvolutionDir,
  getUserDataDir,
};
