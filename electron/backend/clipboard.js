const { clipboard, app } = require("electron");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const plist = require("plist");
const { execFile } = require("child_process");
const util = require("util");
const log = require("electron-log");

const store = require("./ClipboardHistoryStore"); // singleton instance
const { INTERNAL_CLIPBOARD_TYPES } = require("./constants");

const execFileAsync = util.promisify(execFile);

const isDev = !app.isPackaged;
const arch = process.arch; // 'arm64' or 'x64'

const binaryName =
  arch === "arm64" ? "get_clipboard_image.arm64" : "get_clipboard_image.x64";

const binaryPath = isDev
  ? path.join(__dirname, `../backend/native/${binaryName}`)
  : path.join(process.resourcesPath, `../${binaryName}`);

async function getClipboardImage() {
  try {
    const { stdout, stderr } = await execFileAsync(binaryPath, {
      maxBuffer: 25 * 1024 * 1024,
    });

    if (stderr) {
      throw new Error(`Error executing binary: ${stderr}`);
    }

    const cleaned = stdout.toString("utf8").trim();

    return cleaned;
  } catch (error) {
    log.error("Error reading clipboard image:", error);
    return null;
  }
}

function resolveFileClipboardType() {
  const buffer = clipboard.readBuffer("NSFilenamesPboardType");
  if (!buffer || buffer.length === 0) return null;

  const xml = buffer.toString("utf-8").replace(/\0/g, "");

  let parsed = [];
  try {
    parsed = plist.parse(xml);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
  } catch {
    return null;
  }

  const existingFiles = parsed.filter(fs.existsSync);
  if (existingFiles.length === 0) return null;

  const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"];
  const audioExts = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"];

  const files = existingFiles.map((filePath) => {
    const extension = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);
    return { path: filePath, name, extension };
  });

  const allAre = (extList) =>
    files.every((file) => extList.includes(file.extension));

  let type = INTERNAL_CLIPBOARD_TYPES.FILE;

  if (files.length === 1 && allAre(imageExts)) {
    type = INTERNAL_CLIPBOARD_TYPES.IMAGE;
  } else if (files.length > 1 && allAre(imageExts)) {
    type = INTERNAL_CLIPBOARD_TYPES.MULTI_IMAGE;
  } else if (files.length === 1 && allAre(audioExts)) {
    type = INTERNAL_CLIPBOARD_TYPES.AUDIO;
  } else if (files.length > 1 && allAre(audioExts)) {
    type = INTERNAL_CLIPBOARD_TYPES.MULTI_AUDIO;
  } else if (files.length > 1) {
    type = INTERNAL_CLIPBOARD_TYPES.MULTI_FILE;
  }

  return {
    type,
    files,
  };
}

function getClipboardFormat() {
  const formats = clipboard.availableFormats();

  function isText() {
    return (
      formats.includes("text/plain") || formats.includes("public.plain-text")
    );
  }

  function isClipboardImage() {
    return formats.includes("image/png") || formats.includes("public.tiff");
  }

  function hasFiles() {
    return formats.includes("text/uri-list");
  }

  if (hasFiles()) return "file"; // check first because includes 'text/plain'
  if (isClipboardImage()) return "clipboard-image";
  if (isText()) return "text";

  return null;
}

function clipboardContainsFolder() {
  const buffer = clipboard.readBuffer("NSFilenamesPboardType");
  if (!buffer || buffer.length === 0) return false;

  const xml = buffer.toString("utf-8").replace(/\0/g, "");
  let parsed = [];
  try {
    parsed = plist.parse(xml);
    if (!Array.isArray(parsed) || parsed.length === 0) return false;
  } catch {
    return false;
  }

  return parsed.some((filePath) => {
    try {
      return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  });
}

function getInternalClipboardTypeAndMetadata() {
  const format = getClipboardFormat();
  if (!format) return null;

  if (format === "file") {
    if (clipboardContainsFolder()) return null;
    return resolveFileClipboardType();
  }

  if (format === "text") {
    return {
      type: INTERNAL_CLIPBOARD_TYPES.TEXT,
    };
  }

  if (format === "clipboard-image") {
    return {
      type: INTERNAL_CLIPBOARD_TYPES.CLIPBOARD_IMAGE,
    };
  }

  return null;
}

async function createClipboardHistoryItem(internalClipboardData) {
  if (!internalClipboardData) return null;

  const { type } = internalClipboardData;
  const id = uuidv4();
  const baseData = {
    id,
    type,
    createdAt: Date.now(),
    isFavorite: false,
  };

  log.info("Creating clipboard history item:", baseData);

  switch (type) {
    case INTERNAL_CLIPBOARD_TYPES.TEXT: {
      const text = clipboard.readText().trim();
      return {
        ...baseData,
        content: text,
      };
    }

    case INTERNAL_CLIPBOARD_TYPES.CLIPBOARD_IMAGE: {
      const dataUrl = await getClipboardImage();

      log.info("Clipboard image data URL:", dataUrl);

      return {
        ...baseData,
        content: dataUrl,
      };
    }

    case INTERNAL_CLIPBOARD_TYPES.IMAGE:
    case INTERNAL_CLIPBOARD_TYPES.AUDIO:
    case INTERNAL_CLIPBOARD_TYPES.FILE:
    case INTERNAL_CLIPBOARD_TYPES.MULTI_IMAGE:
    case INTERNAL_CLIPBOARD_TYPES.MULTI_AUDIO:
    case INTERNAL_CLIPBOARD_TYPES.MULTI_FILE: {
      const files = internalClipboardData.files;
      return {
        ...baseData,
        content: files.map((file) => file.path).join(","), // used to check for duplicates on save
        metadata: { files },
      };
    }

    default:
      return null;
  }
}

let pollTimeoutId = null;
let lastClipboardHash = null;

function startClipboardPolling() {
  async function poll() {
    try {
      const metadata = getInternalClipboardTypeAndMetadata();
      log.info(metadata);
      if (!metadata) return;

      // Create a temporary entry to get its hash
      const entry = await createClipboardHistoryItem(metadata);
      if (!entry) return;

      // Generate hash for this clipboard content
      const crypto = require('crypto');
      const hash = crypto.createHash('sha1').update(entry.content || '').digest('hex');

      // Only add if clipboard content has changed
      if (hash !== lastClipboardHash) {
        log.info("Detected clipboard change:", metadata);
        lastClipboardHash = hash;
        await store.add(entry);
      }
    } catch (err) {
      console.error("Clipboard polling error:", err);
    } finally {
      pollTimeoutId = setTimeout(poll, 1000);
    }
  }

  poll();
}

function stopClipboardPolling() {
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
    log.info("Clipboard polling stopped");
  }
}

module.exports = {
  startClipboardPolling,
  stopClipboardPolling,
};
