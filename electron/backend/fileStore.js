const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function getStorageDir() {
  return path.join(app.getPath("userData"), "clipboard-files");
}

function copyFileToAppStorage(originalPath, relativePath) {
  const destination = path.join(getStorageDir(), relativePath);

  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true }); // Ensure nested folders exist
    fs.copyFileSync(originalPath, destination);
    // Return proper file URL format for Unix/macOS (file:/// with three slashes)
    return `file://${destination}`;
  } catch (err) {
    console.error("❌ Failed to copy file to app storage:", err);
    return null;
  }
}

function ensureStorageDirExists() {
  fs.mkdirSync(getStorageDir(), { recursive: true });
}

module.exports = {
  copyFileToAppStorage,
  ensureStorageDirExists,
};
