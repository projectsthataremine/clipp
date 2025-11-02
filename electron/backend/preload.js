const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getClipboardHistory: (callback) => {
    ipcRenderer.once("update-history", (_, history) => callback(history));
    ipcRenderer.send("get-clipboard-history");
  },
  copyHistoryItem: (id) => {
    ipcRenderer.send("copy-text", id);
  },
  toggleFavorite: (id) => ipcRenderer.send("toggle-favorite", id),
  hideWindow: () => ipcRenderer.send("hide-window"),
  hideWindowAnimated: () => ipcRenderer.send("hide-window-animated"),
  onUpdateHistory: (callback) => {
    ipcRenderer.on("update-history", (_, history) => callback(history));
  },
  getLicenseValid: () => {
    return ipcRenderer.invoke("get-license-valid");
  },
  submitLicenseKey: async (key) => {
    return ipcRenderer.invoke("submit-license-key", key);
  },
  onLicenseStatusChange: (callback) => {
    ipcRenderer?.on("license-check-complete", callback);
  },
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", callback);
  },
  openExternal: (url) => ipcRenderer.send("open-external", url),
  getUpdateAvailable: () => {
    return ipcRenderer.invoke("get-update-available");
  },
  // Auth methods
  getAuthStatus: () => ipcRenderer.invoke("GET_AUTH_STATUS"),
  startOAuth: (provider) => ipcRenderer.invoke("START_OAUTH", { provider }),
  signOut: () => ipcRenderer.invoke("SIGN_OUT"),
  onAuthStateChanged: (callback) => {
    ipcRenderer.on("AUTH_STATE_CHANGED", callback);
  },
  onAuthRequired: (callback) => {
    ipcRenderer.on("auth-required", (_, data) => callback(data));
  },
  onTrialExpired: (callback) => {
    ipcRenderer.on("trial-expired", (_, data) => callback(data));
  },
  getLicenses: (userId) => ipcRenderer.invoke("GET_LICENSES", { userId }),
  activateLicense: (licenseKey) => ipcRenderer.invoke("ACTIVATE_LICENSE", { licenseKey }),
  revokeLicense: (licenseKey) => ipcRenderer.invoke("REVOKE_LICENSE", { licenseKey }),
  renameMachine: (licenseId, newName) => ipcRenderer.invoke("RENAME_MACHINE", { licenseId, newName }),
  getMachineId: () => ipcRenderer.invoke("GET_MACHINE_ID"),
});
