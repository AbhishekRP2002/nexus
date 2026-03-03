import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5180,
    proxy: {
      "/api/search": {
        target: "http://localhost:3005",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8085",
        changeOrigin: true,
      },
    },
  },
})
