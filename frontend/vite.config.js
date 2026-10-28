import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let backendProcess = null;

function autoStartBackendPlugin() {
  return {
    name: 'utm-auto-start-backend',
    configureServer() {
      const req = http.get('http://localhost:5000/api/health', (res) => {
        res.resume();
      });
      req.on('error', () => {
        if (backendProcess) return;
        const backendDir = path.resolve(__dirname, '../backend');
        const serverScript = path.resolve(backendDir, 'src/server.js');
        console.log('🚀 [UTM Desk] Iniciando Backend automáticamente en http://localhost:5000 ...');
        backendProcess = spawn(process.execPath, [serverScript], {
          cwd: backendDir,
          stdio: 'inherit',
        });
        backendProcess.on('exit', () => {
          backendProcess = null;
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), autoStartBackendPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
