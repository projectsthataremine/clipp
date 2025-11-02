// backend/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
const ElectronStorageAdapter = require("./storage-adapter");

require("dotenv").config({ path: __dirname + "/.env" });

// Create a persistent storage adapter for auth sessions
const storage = new ElectronStorageAdapter();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

module.exports = supabase;
