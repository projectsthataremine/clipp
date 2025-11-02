const { globalShortcut, clipboard } = require("electron");

const clipboardHistoryStore = require("./ClipboardHistoryStore");
const appStore = require("./AppStore");

function registerGlobalShortcuts(win) {
  globalShortcut.register("Shift+Cmd+V", () => {
    if (appStore.IsOpen) {
      return;
    }

    win.webContents.send("update-history", clipboardHistoryStore.getAll());

    appStore.open();
  });
}

module.exports = {
  registerGlobalShortcuts,
};
