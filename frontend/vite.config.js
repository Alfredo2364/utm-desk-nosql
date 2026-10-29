import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let backendProcess = null;

function startBackendServer() {
  if (backendProcess) return;
  const backendDir = path.resolve(__dirname, '../backend');
  const serverScript = path.resolve(backendDir, 'src/server.js');
  console.log('🚀 [UTM Desk] Iniciando Backend con recarga activa en http://localhost:5000 ...');
  backendProcess = spawn(process.execPath, ['--watch', serverScript], {
    cwd: backendDir,
    stdio: 'inherit',
  });
  backendProcess.on('exit', () => {
    backendProcess = null;
  });
}

function autoStartBackendPlugin() {
  return {
    name: 'utm-auto-start-backend',
    configureServer() {
      if (process.env.VERCEL || process.env.CI) return;
      const req = http.get('http://localhost:5000/api/health', (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(raw);
            if (!json.respaldoNoSQL) {
              console.log('🔄 [UTM Desk] Actualizando proceso Backend en puerto 5000...');
              try {
                execSync(
                  'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"'
                );
              } catch {
                // ignore
              }
              setTimeout(startBackendServer, 400);
            }
          } catch {
            // ignore
          }
        });
      });
      req.on('error', () => {
        startBackendServer();
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
