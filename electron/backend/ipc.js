const { clipboard, ipcMain, nativeImage, shell, app } = require("electron");
const path = require("path");

const store = require("./ClipboardHistoryStore"); // singleton instance
const { INTERNAL_CLIPBOARD_TYPES } = require("./constants");
const appStore = require("./AppStore");

function registerIpcHandlers(win) {
  ipcMain.on("toggle-favorite", (event, id) => {
    const item = store.find(id);
    if (item) {
      store.update(id, { isFavorite: !item.isFavorite });
      win.webContents.send("update-history", store.getAll());
    }
  });

  ipcMain.on("open-external", (_event, url) => {
    shell.openExternal(url);
  });

  ipcMain.on("get-clipboard-history", (event) => {
    event.sender.send("update-history", store.getAll());
  });

  ipcMain.on("copy-text", (event, id) => {
    const item = store.find(id);
    if (!item) return;

    if (item.type === INTERNAL_CLIPBOARD_TYPES.TEXT) {
      clipboard.writeText(item.content);
    }

    if (item.type === INTERNAL_CLIPBOARD_TYPES.CLIPBOARD_IMAGE) {
      const image = nativeImage.createFromDataURL(item.content);
      clipboard.writeImage(image);
    }

    if (
      item.type === INTERNAL_CLIPBOARD_TYPES.IMAGE ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_IMAGE ||
      item.type === INTERNAL_CLIPBOARD_TYPES.AUDIO ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_AUDIO ||
      item.type === INTERNAL_CLIPBOARD_TYPES.FILE ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_FILE
    ) {
      const files = item.metadata?.files;
      if (Array.isArray(files) && files.length > 0) {
        const baseDir = path.join(
          app.getPath("userData"),
          "clipboard-files",
          item.id
        );
        const paths = files.map((f) => path.join(baseDir, f.name));
        const fileList = paths
          .map((filePath) => `<string>${filePath}</string>`)
          .join("");

        const plistContent = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\">
<array>
  ${fileList}
</array>
</plist>`;

        clipboard.writeBuffer(
          "NSFilenamesPboardType",
          Buffer.from(plistContent)
        );
      }
    }

    // Don't close immediately - let the frontend handle the animation and close
  });

  ipcMain.handle("get-license-valid", () => {
    return appStore.getLicenseValid();
  });

  ipcMain.handle("submit-license-key", async (event, licenseKey) => {
    try {
      return await appStore.addLicenseKey(licenseKey);
    } catch (error) {
      console.error("[IPC] submit-license-key ERROR:", error);
      return { success: false, message: error?.message || "Unknown error" };
    }
  });

  ipcMain.handle("get-update-available", () => {
    return appStore.getUpdateAvailable();
  });

  ipcMain.on("hide-window", () => {
    appStore.close();
  });

  ipcMain.on("hide-window-animated", () => {
    appStore.closeWithAnimation();
  });
}

module.exports = {
  registerIpcHandlers,
};
