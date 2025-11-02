const { Tray, Menu, nativeImage, app } = require("electron");
const path = require("path");

let tray = null;

function createTray(win) {
  const trayIcon = nativeImage.createFromPath(
    path.join(__dirname, "assets/iconTemplate.png")
  );
  trayIcon.setTemplateImage(true);

  tray = new Tray(trayIcon);

  const menu = Menu.buildFromTemplate([
    { label: "Show App", click: () => win.show() },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        // Set a flag to indicate that the app is quitting
        // usen in the close event
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Clipp");
  tray.setContextMenu(menu);
}

module.exports = {
  createTray,
};
