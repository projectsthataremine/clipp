// Load environment variables from .env file
require('dotenv').config();

// Log environment for debugging
console.log('[Main] CLIPP_ENV:', process.env.CLIPP_ENV);

const { app, Notification, systemPreferences } = require("electron");
const path = require("path");
const fs = require("fs");

const { createTray } = require("./tray");
const { startClipboardPolling, stopClipboardPolling } = require("./clipboard");
const { registerGlobalShortcuts } = require("./hotkeys");
const { registerIpcHandlers } = require("./ipc");
const setupWindow = require("./setupWindow");
const appStore = require("./AppStore");
const { machineId } = require("node-machine-id");
const supabase = require("./supabaseClient");
const { ensureStorageDirExists } = require("./fileStore");
const { initAuthHandlers, getTrialStatus } = require("./auth-handler");
const { startVersionChecker, stopVersionChecker } = require("./version-checker");

async function getMachineId() {
  const id = await machineId();
  return id;
}

if (process.env.TEST_MODE === "true") {
  console.log("Running in TEST mode");
  const testUserDataPath = path.join(
    process.platform === "darwin"
      ? path.join(process.env.HOME, "Library", "Application Support")
      : app.getPath("appData"),
    "Clipp-Test"
  );
  app.setPath("userData", testUserDataPath);
} else if (process.env.NODE_ENV === "development") {
  console.log("Running in development mode");

  const customUserDataPath = path.join(
    process.platform === "darwin"
      ? path.join(process.env.HOME, "Library", "Application Support")
      : app.getPath("appData"),
    "Clipp"
  );

  app.setPath("userData", customUserDataPath);
}

const userDataPath = path.join(app.getPath("userData"), "userdata.json");

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  // Perform cleanup before exiting
  stopClipboardPolling();
  stopVersionChecker();
  appStore.cleanup();
  app.quit();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
});

function hasPromptedNotifications() {
  if (!fs.existsSync(userDataPath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(userDataPath, "utf-8"));
    return data.notificationsPrompted === true;
  } catch {
    return false;
  }
}

function markNotificationsPrompted() {
  console.log("Marking notifications as prompted");
  console.log(userDataPath);
  fs.writeFileSync(
    userDataPath,
    JSON.stringify({ notificationsPrompted: true }, null, 2)
  );
}

async function logger() {
  if (process.env.NODE_ENV !== "development") {
    const machine_id = await machineId(true);

    if (!machine_id) {
      console.error("Failed to retrieve machine ID");
      return;
    }

    const { error } = await supabase.rpc("log_usage", {
      machine_id,
    });

    if (error) {
      console.error("Error logging usage:", error);
    }
  }
}

function setupVersionChecker() {
  startVersionChecker((latestVersion) => {
    console.log('[VersionChecker] 🎉 Update available! New version:', latestVersion);
    appStore.setUpdateAvailable(true);
  });
}

async function checkAuthOnStartup() {
  try {
    // Skip auth checks in test mode
    if (process.env.TEST_MODE === "true") {
      console.log('[Main] TEST_MODE enabled - skipping auth checks');
      appStore.setRequiresAuth(false);
      appStore.setAccessStatus({
        hasValidAccess: true,
        trialExpired: false
      });
      return;
    }

    console.log('[Main] Checking auth status on startup...');

    // Check if user has a valid session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Main] Failed to get session:', error);
      appStore.setRequiresAuth(true);
      return;
    }

    if (!session) {
      console.log('[Main] No session found - user needs to sign in');
      appStore.setRequiresAuth(true);
      return;
    }

    console.log('[Main] User is signed in:', session.user.email);
    appStore.setRequiresAuth(false);

    // Check if user has a valid license
    const licenseStatus = await checkLicenseStatus(session.user.id);

    // Set global access status
    appStore.setAccessStatus({
      hasValidAccess: licenseStatus.valid,
      trialExpired: licenseStatus.trialExpired
    });

    if (licenseStatus.valid) {
      console.log('[Main] User has valid access (trial or license)');
    } else {
      console.log('[Main] User does NOT have valid access - trial expired and no valid license');
    }

  } catch (error) {
    console.error('[Main] Auth check error:', error);
    appStore.setRequiresAuth(true);
  }
}

async function checkLicenseStatus(userId) {
  try {
    const { machineIdSync } = require('node-machine-id');
    const currentMachineId = machineIdSync();
    const now = new Date();

    // Step 1: Check if user is in 7-day trial period (based on account creation date)
    const trialStatus = await getTrialStatus(userId);

    if (trialStatus.inTrial) {
      console.log(`[Main] User is in trial period (${trialStatus.daysLeft} days remaining)`);
      return { valid: true, trialExpired: false, inTrial: true, daysLeft: trialStatus.daysLeft };
    }

    console.log('[Main] Trial period has ended');

    // Step 2: Trial has expired, check if user has a valid license for this machine
    console.log('[Main] Checking licenses for machine ID:', currentMachineId);

    const { data: licenses, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (licenseError) {
      console.error('[Main] Failed to fetch licenses:', licenseError);
      return { valid: false, trialExpired: true };
    }

    if (!licenses || licenses.length === 0) {
      console.log('[Main] No licenses found - trial expired, need to purchase');
      return { valid: false, trialExpired: true };
    }

    // Check each license to see if this machine is assigned
    for (const license of licenses) {
      console.log('[Main] Checking license:', {
        id: license.id,
        status: license.status,
        machine_id: license.machine_id,
        metadata: license.metadata
      });

      // Skip if license is not active
      if (license.status !== 'active') {
        console.log('[Main] License is not active, skipping');
        continue;
      }

      // Check if license has expired_at date (canceled subscription)
      if (license.expires_at) {
        const expiresAt = new Date(license.expires_at);
        if (now >= expiresAt) {
          console.log('[Main] License has expired:', expiresAt);
          continue;
        }
      }

      // Check if machine_id matches (primary field)
      if (license.machine_id === currentMachineId) {
        console.log('[Main] Found valid license for this machine (machine_id match)');
        return { valid: true, trialExpired: false };
      }

      // Also check metadata.machine_id as fallback
      if (license.metadata && license.metadata.machine_id === currentMachineId) {
        console.log('[Main] Found valid license for this machine (metadata match)');
        return { valid: true, trialExpired: false };
      }
    }

    // No valid license found for this machine
    console.log('[Main] No valid license found for this machine - trial expired, need to purchase or activate');
    return { valid: false, trialExpired: true };

  } catch (error) {
    console.error('[Main] License check error:', error);
    return { valid: false, trialExpired: false };
  }
}

function checkAccessibilityPermissions() {
  console.log('[Main] Checking Accessibility permissions...');

  // Only check on macOS
  if (process.platform !== 'darwin') {
    console.log('[Main] Not on macOS, skipping Accessibility check');
    return true;
  }

  // Check if we have Accessibility permissions (false = don't prompt yet)
  const hasPermission = systemPreferences.isTrustedAccessibilityClient(false);

  if (hasPermission) {
    console.log('[Main] ✅ Accessibility permissions already granted');
    return true;
  }

  console.log('[Main] ⚠️ Accessibility permissions NOT granted');
  console.log('[Main] 🔐 Requesting Accessibility permissions...');
  console.log('[Main] This is required for clipboard file detection on macOS Sequoia');

  // Request permission (true = prompt user and open System Preferences)
  systemPreferences.isTrustedAccessibilityClient(true);

  // Check again after prompting
  const hasPermissionNow = systemPreferences.isTrustedAccessibilityClient(false);

  if (hasPermissionNow) {
    console.log('[Main] ✅ Accessibility permissions granted!');
    return true;
  } else {
    console.log('[Main] ❌ Accessibility permissions still not granted');
    console.log('[Main] User needs to grant permissions in System Settings → Privacy & Security → Accessibility');
    console.log('[Main] App may not be able to detect clipboard file copies until permissions are granted');
    return false;
  }
}

app.whenReady().then(async () => {
  app.dock?.hide();
  console.log("App version (app.getVersion()):", app.getVersion());

  ensureStorageDirExists();

  // Check Accessibility permissions (required for clipboard file detection on macOS Sequoia)
  checkAccessibilityPermissions();

  logger();

  const win = setupWindow();
  appStore.setWindow(win);
  startClipboardPolling();
  registerGlobalShortcuts(win);
  registerIpcHandlers(win);
  initAuthHandlers(win);
  createTray(win);

  // Check auth status on app start
  await checkAuthOnStartup();

  if (!hasPromptedNotifications()) {
    new Notification({
      title: "Clipp",
      body: "Clipp is ready to notify you when updates are available.",
    }).show();
    markNotificationsPrompted();
  }

  setupVersionChecker();
});

// Handle cleanup before app quits
app.on("before-quit", (event) => {
  console.log("App before-quit triggered - performing cleanup");

  // Stop clipboard polling
  stopClipboardPolling();

  // Stop version checker
  stopVersionChecker();

  // Clear AppStore license validation interval
  appStore.cleanup();

  // Unregister global shortcuts
  require("electron").globalShortcut.unregisterAll();
});

app.on("will-quit", () => {
  console.log("App will-quit triggered");
  require("electron").globalShortcut.unregisterAll();
});

// Handle all windows closed (important for proper shutdown)
app.on("window-all-closed", () => {
  console.log("All windows closed");
  app.quit();
});

// Export for use in other modules
module.exports = {
  checkAuthOnStartup,
  checkLicenseStatus
};
