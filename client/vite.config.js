import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Two pages share one build:
//   /         the public landing page + chatbot   (index.html)
//   /staff/   the staff sign-in and dashboard     (staff/index.html)
//
// Dev:   `npm run client:dev` (from the repo root) serves both on :5173 and proxies /api to Express on :3000.
// Build: output goes to ../public, which Express serves. Files in client/public (the legacy
//        dashboard: admin.html + its css/js) are copied over unchanged, so emptyOutDir is safe.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 127.0.0.1 (not "localhost") avoids Node resolving to IPv6 while Express listens on IPv4
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        staff: fileURLToPath(new URL('./staff/index.html', import.meta.url)),
      },
    },
  },
});
