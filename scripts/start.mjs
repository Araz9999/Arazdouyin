#!/usr/bin/env node
/**
 * Production entrypoint: one Node HTTP server on 8787 that serves both the API and
 * the built frontend (web/dist) with an SPA fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { HOST, LOG, PORT } from '../server/src/config.js';
import { closeDatabase, get, openDatabase } from '../server/src/db.js';
import { ensureMediaDir } from '../server/src/media.js';
import { startServer } from '../server/src/server.js';

import { execSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const DIST = process.env.DY_WEB_DIST ? path.resolve(process.env.DY_WEB_DIST) : path.join(REPO, 'web', 'dist');

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    if (LOG) console.log('[start] frontend build missing, building web assets...');
    execSync('npm run build', { cwd: REPO, stdio: 'inherit' });
  }

  openDatabase();
  let users = 0;
  try {
    users = get(`SELECT COUNT(*) AS n FROM users`, [])?.n || 0;
  } catch {
    users = 0;
  }
  if (!users) {
    if (LOG) console.log('[start] database has no users yet - auto-seeding demo dataset...');
    try {
      execSync(`node "${path.join(REPO, 'scripts', 'seed.mjs')}"`, { cwd: REPO, stdio: 'inherit' });
    } catch (err) {
      console.warn('[start] auto-seed completed with warning:', err?.message);
    }
  }
  await ensureMediaDir();

  const port = Number(process.env.DY_PORT || process.env.PORT || PORT || 3000);
  const host = process.env.DY_HOST || process.env.HOST || HOST || '0.0.0.0';
  const { server } = await startServer({ staticDir: DIST, port, host });
  if (LOG) {
    console.log(`[start] serving api + web on http://${host}:${port}`);
    console.log(`[start]   /api/*  -> json api      /media/* -> range-streamed video`);
    console.log(`[start]   /*      -> ${path.relative(REPO, DIST)} (SPA fallback to index.html)`);
  }

  let closing = false;
  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    if (LOG) console.log(`[start] ${signal} received, closing server`);
    server.close(() => {
      closeDatabase();
      process.exit(0);
    });
    // Do not let a keep-alive connection block the shutdown.
    setTimeout(() => {
      closeDatabase();
      process.exit(0);
    }, 2000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    console.error('[start] unhandled rejection:', reason);
  });
}

main().catch((error) => {
  console.error('[start] failed:', error && (error.stack || error.message || error));
  process.exit(1);
});
