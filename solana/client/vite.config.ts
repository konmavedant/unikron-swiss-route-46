// vite.config.ts (Updated)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: 'buffer',
    },
  },
  define: {
    // Make environment variables available
    global: 'globalThis',
    // Fix for process.env in browser
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer', '@solana/web3.js', '@solana/wallet-adapter-react']
  }
}));