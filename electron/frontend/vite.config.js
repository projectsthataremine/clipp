import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 4000, // ✅ Change to port 3000 (or another unused port)
    strictPort: true, // ✅ Prevents Vite from picking another port
  },
});
