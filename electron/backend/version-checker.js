const https = require('https');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const REPO_OWNER = 'projectsthataremine';
const REPO_NAME = 'clipp';
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

let checkInterval = null;

function getCurrentVersion() {
  // In development, app.getVersion() returns Electron's version
  // So we read directly from package.json instead
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('[VersionChecker] Failed to read package.json:', error);
    return app.getVersion(); // Fallback to app version
  }
}

function compareVersions(current, latest) {
  // Remove 'v' prefix if present
  const currentClean = current.replace(/^v/, '');
  const latestClean = latest.replace(/^v/, '');

  const currentParts = currentClean.split('.').map(Number);
  const latestParts = latestClean.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return 1;  // Update available
    if (latestPart < currentPart) return -1; // Current is newer
  }

  return 0; // Same version
}

async function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      method: 'GET',
      headers: {
        'User-Agent': 'Clipp-Version-Checker',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            resolve(release.tag_name);
          } catch (error) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkForUpdate() {
  try {
    const currentVersion = getCurrentVersion();
    console.log('[VersionChecker] Current version:', currentVersion);
    console.log('[VersionChecker] Checking for updates...');

    const latestVersion = await fetchLatestVersion();
    console.log('[VersionChecker] Latest version on GitHub:', latestVersion);

    const comparison = compareVersions(currentVersion, latestVersion);

    if (comparison > 0) {
      console.log('[VersionChecker] ✅ Update available:', latestVersion);
      return { available: true, version: latestVersion };
    } else if (comparison === 0) {
      console.log('[VersionChecker] ✅ Already on latest version');
      return { available: false };
    } else {
      console.log('[VersionChecker] ℹ️ Current version is newer than GitHub release');
      return { available: false };
    }
  } catch (error) {
    console.error('[VersionChecker] ❌ Error checking for updates:', error.message);
    return { available: false, error: error.message };
  }
}

function startVersionChecker(onUpdateAvailable) {
  console.log('[VersionChecker] Starting version checker (checks every 10 minutes)');

  // Check immediately on start
  checkForUpdate().then(result => {
    if (result.available && onUpdateAvailable) {
      onUpdateAvailable(result.version);
    }
  });

  // Then check every 10 minutes
  checkInterval = setInterval(async () => {
    const result = await checkForUpdate();
    if (result.available && onUpdateAvailable) {
      onUpdateAvailable(result.version);
    }
  }, CHECK_INTERVAL);
}

function stopVersionChecker() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[VersionChecker] Stopped version checker');
  }
}

module.exports = {
  startVersionChecker,
  stopVersionChecker,
  checkForUpdate,
};
