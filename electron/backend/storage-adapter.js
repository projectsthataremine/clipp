// Custom storage adapter for Supabase auth in Electron
// Persists auth sessions to the file system
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ElectronStorageAdapter {
  constructor() {
    // Store auth data in userData directory
    this.storageFile = path.join(app.getPath('userData'), 'supabase-auth.json');
    this.storage = this.loadStorage();
  }

  loadStorage() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[Storage] Failed to load auth storage:', error);
    }
    return {};
  }

  saveStorage() {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.storage, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Storage] Failed to save auth storage:', error);
    }
  }

  getItem(key) {
    return this.storage[key] || null;
  }

  setItem(key, value) {
    this.storage[key] = value;
    this.saveStorage();
  }

  removeItem(key) {
    delete this.storage[key];
    this.saveStorage();
  }
}

module.exports = ElectronStorageAdapter;
