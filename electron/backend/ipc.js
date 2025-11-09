const { clipboard, ipcMain, nativeImage, shell, app } = require("electron");
const path = require("path");

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

  ipcMain.handle("get-update-required", () => {
    return appStore.getUpdateRequired();
  });

  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
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
}

module.exports = {
  registerIpcHandlers,
};
