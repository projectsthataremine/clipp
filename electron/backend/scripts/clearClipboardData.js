const fs = require("fs");
const path = require("path");
const os = require("os");

// Path to clipboard-history.json in your repo
const localHistoryPath = path.join(__dirname, "..", "clipboard-history.json");

// Path to clipboard-files folder in Application Support
const appSupportPath = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "Clipp",
  "clipboard-files"
);

// Clear clipboard-history.json (local)
if (fs.existsSync(localHistoryPath)) {
  fs.writeFileSync(localHistoryPath, "[]", "utf-8");
  console.log("✅ Cleared clipboard-history.json");
} else {
  console.log("ℹ️ clipboard-history.json not found in local backend folder");
}

// Delete clipboard-files directory (in app support)
if (fs.existsSync(appSupportPath)) {
  fs.rmSync(appSupportPath, { recursive: true, force: true });
  console.log("✅ Deleted clipboard-files directory from Application Support");
} else {
  console.log("ℹ️ clipboard-files directory not found in Application Support");
}
