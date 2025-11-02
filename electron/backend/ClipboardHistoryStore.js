const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
  #filePath = path.join(__dirname, "clipboard-history.json");
  #max_files = 25;

  constructor() {
    this.#load();
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
    if (!item.hash) {
      item.hash = await generateHash(item.type, item.content);
    }

    const isDuplicate = this.#data.some((entry) => entry.hash === item.hash);
    if (isDuplicate) return null;

    if (
      item.type === INTERNAL_CLIPBOARD_TYPES.IMAGE ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_IMAGE ||
      item.type === INTERNAL_CLIPBOARD_TYPES.AUDIO ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_AUDIO ||
      item.type === INTERNAL_CLIPBOARD_TYPES.FILE ||
      item.type === INTERNAL_CLIPBOARD_TYPES.MULTI_FILE
    ) {
      if (!this.addFilesToStorage(item.metadata.files, item.id)) return;
    }

    // if (!isInit) console.log("Adding item to clipboard history:\n", item);

    this.#data.unshift(item);

    this.#save();
    return item;
  }

  update(id, updatedFields = {}) {
    const item = this.#data.find((entry) => entry.id === id);
    if (!item) return null;

    Object.assign(item, updatedFields);
    this.#save();
    return item;
  }

  remove(id) {
    const index = this.#data.findIndex((entry) => entry.id === id);
    if (index === -1) return false;

    this.#data.splice(index, 1);
    this.#save();
    return true;
  }

  find(id) {
    return this.#data.find((item) => item.id === id) || null;
  }

  getAll() {
    return [...this.#data];
  }

  clear() {
    this.#data.length = 0;
    this.#save();
  }

  size() {
    return this.#data.length;
  }
}

module.exports = new ClipboardHistoryStore();
