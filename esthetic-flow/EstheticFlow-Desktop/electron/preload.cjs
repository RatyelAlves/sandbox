const {
  contextBridge,
} = require("electron");

contextBridge.exposeInMainWorld(
  "estheticflow",
  {
    isDesktop: true,
    platform: process.platform,
  }
);
