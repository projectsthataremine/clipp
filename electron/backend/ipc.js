const { clipboard, ipcMain, nativeImage, shell, app } = require("electron");
const path = require("path");
const fs = require("fs");
const clipboardEx = require('electron-clipboard-ex');

const store = require("./ClipboardHistoryStore"); // singleton instance
const { INTERNAL_CLIPBOARD_TYPES } = require("./constants");
const appStore = require("./AppStore");
const supabase = require("./supabaseClient");
const { getPricing } = require("./config");

// Edge function environment flag
// Set to 'dev' to use dev edge functions (test Stripe), 'prod' for production
// Controlled via environment variable: CLIPP_ENV=dev or CLIPP_ENV=prod
const USE_DEV_FUNCTIONS = process.env.CLIPP_ENV === 'dev';
const FUNCTION_SUFFIX = USE_DEV_FUNCTIONS ? '-dev' : '';

console.log(`[IPC] Using ${USE_DEV_FUNCTIONS ? 'DEVELOPMENT' : 'PRODUCTION'} edge functions`);

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
      item.type === INTERNAL_CLIPBOARD_TYPES.VIDEO ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_VIDEO ||
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

        // Use electron-clipboard-ex for better multi-file support
        clipboardEx.writeFilePaths(paths);
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

  ipcMain.handle("get-update-required", () => {
    return appStore.getUpdateRequired();
  });

  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("get-audio-data-url", async (event, filePath) => {
    try {
      // Extract actual file path from file:// URL if needed
      const actualPath = filePath.startsWith('file://')
        ? filePath.replace('file://', '')
        : filePath;

      console.log('[IPC] Reading audio file:', actualPath);

      // Check if file exists
      if (!fs.existsSync(actualPath)) {
        console.error('[IPC] Audio file not found:', actualPath);
        return null;
      }

      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(actualPath);
      const base64 = fileBuffer.toString('base64');

      // Determine MIME type from file extension
      const ext = path.extname(actualPath).toLowerCase();
      const mimeTypes = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.flac': 'audio/flac',
      };

      const mimeType = mimeTypes[ext] || 'audio/mpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log('[IPC] Audio file converted to data URL, length:', dataUrl.length);
      return dataUrl;
    } catch (error) {
      console.error('[IPC] Error reading audio file:', error);
      return null;
    }
  });

  ipcMain.handle("get-video-data-url", async (event, filePath) => {
    try {
      // Extract actual file path from file:// URL if needed
      const actualPath = filePath.startsWith('file://')
        ? filePath.replace('file://', '')
        : filePath;

      console.log('[IPC] Reading video file:', actualPath);

      // Check if file exists
      if (!fs.existsSync(actualPath)) {
        console.error('[IPC] Video file not found:', actualPath);
        return null;
      }

      // Read the file as a buffer
      const fileBuffer = fs.readFileSync(actualPath);
      const base64 = fileBuffer.toString('base64');

      // Determine MIME type from file extension
      const ext = path.extname(actualPath).toLowerCase();
      const mimeTypes = {
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
        '.flv': 'video/x-flv',
        '.wmv': 'video/x-ms-wmv',
        '.m4v': 'video/x-m4v',
      };

      const mimeType = mimeTypes[ext] || 'video/mp4';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log('[IPC] Video file converted to data URL, length:', dataUrl.length);
      return dataUrl;
    } catch (error) {
      console.error('[IPC] Error reading video file:', error);
      return null;
    }
  });

  ipcMain.on("hide-window", () => {
    appStore.close();
  });

  ipcMain.on("hide-window-animated", () => {
    appStore.closeWithAnimation();
  });

  // Stripe checkout session
  ipcMain.handle("create-checkout-session", async (event, billingInterval = 'monthly') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      // Determine base URL based on environment
      const isDev = !app.isPackaged;
      const baseUrl = isDev ? 'http://localhost:3000' : 'https://tryclipp.com';

      // Use simple success/cancel URLs that tell user to close the browser
      const successUrl = `${baseUrl}/checkout-success`;
      const cancelUrl = `${baseUrl}/checkout-cancel`;

      const response = await fetch(`https://jijhacdgtccfftlangjq.supabase.co/functions/v1/create-checkout-session${FUNCTION_SUFFIX}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success_url: successUrl,
          cancel_url: cancelUrl,
          billing_interval: billingInterval,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Open checkout in default browser
        shell.openExternal(data.url);
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('[IPC] create-checkout-session ERROR:', error);
      return { success: false, error: error.message };
    }
  });

  // Stripe customer portal
  ipcMain.handle("open-customer-portal", async (event, stripeCustomerId) => {
    try {
      console.log('[IPC] Opening customer portal for:', stripeCustomerId);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const url = `https://jijhacdgtccfftlangjq.supabase.co/functions/v1/create-customer-portal${FUNCTION_SUFFIX}`;
      console.log('[IPC] Calling:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stripe_customer_id: stripeCustomerId,
          return_url: 'https://tryclipp.com'
        }),
      });

      console.log('[IPC] Response status:', response.status);
      const data = await response.json();
      console.log('[IPC] Response data:', data);

      if (data.url) {
        // Open customer portal in default browser
        console.log('[IPC] Opening portal URL:', data.url);
        shell.openExternal(data.url);
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to open customer portal');
      }
    } catch (error) {
      console.error('[IPC] open-customer-portal ERROR:', error);
      return { success: false, error: error.message };
    }
  });

  // Get pricing config from Supabase
  ipcMain.handle("get-pricing-config", async () => {
    try {
      const pricing = await getPricing();
      return { success: true, pricing };
    } catch (error) {
      console.error('[IPC] get-pricing-config ERROR:', error);
      // Return default pricing on error
      return { success: true, pricing: { monthly_price: 2, annual_price: 18 } };
    }
  });

  // Copy to clipboard
  ipcMain.handle("copy-to-clipboard", async (event, text) => {
    try {
      clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      console.error('[IPC] copy-to-clipboard ERROR:', error);
      return { success: false, error: error.message };
    }
  });

  // Get clipboard file paths (for testing)
  ipcMain.handle("get-clipboard-files", async () => {
    try {
      const files = clipboardEx.readFilePaths();
      return { success: true, files };
    } catch (error) {
      console.error('[IPC] get-clipboard-files ERROR:', error);
      return { success: false, error: error.message, files: [] };
    }
  });

  // Clear clipboard history (for testing)
  ipcMain.handle("clear-history", async () => {
    try {
      store.clear();
      return { success: true };
    } catch (error) {
      console.error('[IPC] clear-history ERROR:', error);
      return { success: false, error: error.message };
    }
  });

  // Get clipboard history (for testing)
  ipcMain.handle("get-history", async () => {
    try {
      const history = store.getAll();
      return { success: true, history };
    } catch (error) {
      console.error('[IPC] get-history ERROR:', error);
      return { success: false, error: error.message, history: [] };
    }
  });
}

module.exports = {
  registerIpcHandlers,
};
