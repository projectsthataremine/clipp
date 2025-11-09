const { BrowserWindow, screen, app } = require("electron");
const path = require("path");
const appStore = require("./AppStore");

function setupWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: 400,
    height,
    x: width - 400,
    y: 0,
    frame: false,
    transparent: true,
    vibrancy: "sidebar",
    visualEffectState: "active",
    hasShadow: false,
    roundedCorners: false,
    titleBarStyle: "customButtonsOnHover",
    alwaysOnTop: true,
    resizable: false,
    acceptFirstMouse: true,
    show: false, // Start hidden - show() will be called when needed
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  });

  win.setSkipTaskbar(true);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setAlwaysOnTop(true, "screen-saver");

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:4000");
  } else {
    console.log(
      "Loading:",
      path.join(__dirname, "../frontend/dist/index.html")
    );

    win.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
  }

  // win.hide();
  // Only open DevTools if not in test mode
  if (process.env.TEST_MODE !== "true") {
    win.webContents.openDevTools();
  }

  win.on("close", (e) => {
    console.log("is quitingg ", app.isQuiting);
    if (!app.isQuiting) {
      e.preventDefault();
      appStore.close();
    }
  });

  // Window blur behavior removed - only Esc key closes the window now

  return win;
}

module.exports = setupWindow;
