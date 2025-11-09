const { contextBridge, ipcRenderer } = require("electron");

// Log environment for debugging
console.log('[Preload] CLIPP_ENV:', process.env.CLIPP_ENV);

contextBridge.exposeInMainWorld("electronAPI", {
  getEnvironment: () => process.env.CLIPP_ENV,
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
  getUpdateRequired: () => {
    return ipcRenderer.invoke("get-update-required");
  },
  onUpdateRequired: (callback) => {
    ipcRenderer.on("update-required", (_, data) => callback(data));
  },
  getAppVersion: () => {
    return ipcRenderer.invoke("get-app-version");
  },
  getAudioDataUrl: (filePath) => {
    return ipcRenderer.invoke("get-audio-data-url", filePath);
  },
  getVideoDataUrl: (filePath) => {
    return ipcRenderer.invoke("get-video-data-url", filePath);
  },
  // Auth methods
  getAuthStatus: () => ipcRenderer.invoke("GET_AUTH_STATUS"),
  startOAuth: (provider) => ipcRenderer.invoke("START_OAUTH", { provider }),
  signUpWithEmail: (email, password) => ipcRenderer.invoke("SIGN_UP_WITH_EMAIL", { email, password }),
  signInWithEmail: (email, password) => ipcRenderer.invoke("SIGN_IN_WITH_EMAIL", { email, password }),
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
  getAccessStatus: () => ipcRenderer.invoke("GET_ACCESS_STATUS"),
  onAccessStatusChanged: (callback) => {
    ipcRenderer.on("access-status-changed", (_, data) => callback(data));
  },
  getLicenses: (userId) => ipcRenderer.invoke("GET_LICENSES", { userId }),
  getTrialStatus: (userId) => ipcRenderer.invoke("GET_TRIAL_STATUS", { userId }),
  activateLicense: (licenseKey) => ipcRenderer.invoke("ACTIVATE_LICENSE", { licenseKey }),
  revokeLicense: (licenseKey) => ipcRenderer.invoke("REVOKE_LICENSE", { licenseKey }),
  renameMachine: (licenseId, newName) => ipcRenderer.invoke("RENAME_MACHINE", { licenseId, newName }),
  getMachineId: () => ipcRenderer.invoke("GET_MACHINE_ID"),
  // Stripe methods
  createCheckoutSession: (billingInterval) => ipcRenderer.invoke("create-checkout-session", billingInterval),
  openCustomerPortal: (stripeCustomerId) => ipcRenderer.invoke("open-customer-portal", stripeCustomerId),
  copyToClipboard: (text) => ipcRenderer.invoke("copy-to-clipboard", text),
  // Config methods
  getPricingConfig: () => ipcRenderer.invoke("get-pricing-config"),
  // Test helpers
  getClipboardFiles: () => ipcRenderer.invoke("get-clipboard-files"),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  getHistory: () => ipcRenderer.invoke("get-history"),
});
