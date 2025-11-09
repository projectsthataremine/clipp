const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app } = require("electron");

const { INTERNAL_CLIPBOARD_TYPES } = require("./constants");
const { copyFileToAppStorage } = require("./fileStore");
const appStore = require("./AppStore");

async function generateHash(type, content) {
  const isImage = type === INTERNAL_CLIPBOARD_TYPES.CLIPBOARD_IMAGE;
  const data = isImage ? content.split(",")[1] : content;

  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);

  const hashBuffer = await crypto.subtle.digest("SHA-1", encoded);
  return Buffer.from(hashBuffer).toString("hex");
}

class ClipboardHistoryStore {
  #data = [];
  #max_files = 25;
  #loaded = false;

  // Getter for file path - ensures it's computed after app.setPath is called
  get #filePath() {
    return path.join(app.getPath("userData"), "clipboard-history.json");
  }

  constructor() {
    // Don't load immediately - wait for first access
  }

  #ensureLoaded() {
    if (!this.#loaded) {
      this.#load();
      this.#loaded = true;
    }
  }

  #load() {
    if (fs.existsSync(this.#filePath)) {
      try {
        const raw = fs.readFileSync(this.#filePath, "utf-8");
        const parsed = JSON.parse(raw);
        this.#data = parsed;
      } catch (err) {
        console.error("❌ Error loading clipboard history:", err);
      }
    }
  }

  #save() {
    const favorites = this.#data
      .filter((item) => item.isFavorite)
      .sort((a, b) => b.createdAt - a.createdAt); // newest first

    const nonFavorites = this.#data
      .filter((item) => !item.isFavorite)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, this.#max_files);

    const sorted = [...favorites, ...nonFavorites];

    // 🧹 Cleanup: Remove file storage for items being dropped
    const removedItems = this.#data.filter(
      (item) => !sorted.find((kept) => kept.id === item.id)
    );

    for (const item of removedItems) {
      if (
        item.type === INTERNAL_CLIPBOARD_TYPES.IMAGE ||
        item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_IMAGE ||
        item.type === INTERNAL_CLIPBOARD_TYPES.AUDIO ||
        item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_AUDIO ||
        item.type === INTERNAL_CLIPBOARD_TYPES.FILE ||
        item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_FILE
      ) {
        const dirPath = path.join(
          require("electron").app.getPath("userData"),
          "clipboard-files",
          item.id
        );
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
        } catch (err) {
          console.error("❌ Failed to delete clipboard storage folder:", err);
        }
      }
    }

    try {
      fs.writeFileSync(this.#filePath, JSON.stringify(sorted, null, 2));
    } catch (err) {
      console.error("❌ Error saving clipboard history:", err);
    }

    this.#data.length = 0;
    this.#data.push(...sorted);

    // update frontend with new history
    const win = appStore.getWindow();
    if (win?.webContents) {
      win.webContents.send("update-history", this.getAll());
    }
  }

  addFilesToStorage(files, id) {
    const subfolder = id; // use clipboard item ID
    function addFileToStorage(file) {
      const destination = path.join(subfolder, file.name); // preserve original name
      const copiedPath = copyFileToAppStorage(file.path, destination);
      if (!copiedPath) return false;
      file.path = copiedPath;
      return true;
    }

    return files.map(addFileToStorage);
  }

  // isInit is used to skip logging when loading from file
  async add(item, isInit = false) {
    console.log('[Store] add() called with item:', { id: item.id, type: item.type });
    this.#ensureLoaded();

    if (!item.hash) {
      item.hash = await generateHash(item.type, item.content);
    }

    console.log('[Store] Generated hash:', item.hash);

    // Check if duplicate exists and get its index
    const duplicateIndex = this.#data.findIndex((entry) => entry.hash === item.hash);
    console.log('[Store] Duplicate index:', duplicateIndex);

    let isMovingDuplicate = false;

    if (duplicateIndex !== -1) {
      // If already at the top (index 0), don't re-add (prevents polling spam)
      if (duplicateIndex === 0) {
        console.log('[Store] Item already at top, skipping');
        return null;
      }

      // If duplicate exists but not at top, remove it and continue to add at top
      console.log('[Store] Moving duplicate from index', duplicateIndex, 'to top');
      const existingItem = this.#data.splice(duplicateIndex, 1)[0];
      // Update the timestamp and use existing item's ID to preserve file storage
      item.id = existingItem.id;
      item.createdAt = Date.now();
      isMovingDuplicate = true;
    }

    // Only copy files if this is a new item (not moving an existing duplicate)
    if (
      !isMovingDuplicate &&
      (item.type === INTERNAL_CLIPBOARD_TYPES.IMAGE ||
        item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_IMAGE ||
        item.type === INTERNAL_CLIPBOARD_TYPES.AUDIO ||
        item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_AUDIO ||
        item.type === INTERNAL_CLIPBOARD_TYPES.FILE ||
        item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_FILE)
    ) {
      const results = this.addFilesToStorage(item.metadata.files, item.id);
      console.log('[Store] File copy results:', results);
      const allSucceeded = results.every(r => r === true);
      if (!allSucceeded) {
        console.error('[Store] Some files failed to copy, skipping item');
        return;
      }
    }

    // if (!isInit) console.log("Adding item to clipboard history:\n", item);

    this.#data.unshift(item);

    this.#save();
    return item;
  }

  update(id, updatedFields = {}) {
    this.#ensureLoaded();
    const item = this.#data.find((entry) => entry.id === id);
    if (!item) return null;

    Object.assign(item, updatedFields);
    this.#save();
    return item;
  }

  remove(id) {
    this.#ensureLoaded();
    const index = this.#data.findIndex((entry) => entry.id === id);
    if (index === -1) return false;

    this.#data.splice(index, 1);
    this.#save();
    return true;
  }

  find(id) {
    this.#ensureLoaded();
    return this.#data.find((item) => item.id === id) || null;
  }

  getAll() {
    this.#ensureLoaded();
    return [...this.#data];
  }

  clear() {
    this.#ensureLoaded();
    this.#data.length = 0;
    this.#save();
  }

  size() {
    return this.#data.length;
  }
}

module.exports = new ClipboardHistoryStore();
