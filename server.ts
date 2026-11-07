import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createApp } from './src/vrc-backend/app.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createApp();
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    __filename.includes('/dist/') ||
    __filename.endsWith('dist/server.js');

  if (isProduction) {
    const distPath = __dirname.endsWith('dist')
      ? __dirname
      : path.join(__dirname, 'dist');

    console.log(`Serving production static assets from: ${distPath}`);
    // Vite hashes asset filenames (index-<hash>.js), so they can be cached
    // immutably for a year. index.html is excluded (index: false) so the SPA
    // fallback below always serves it fresh — a cached index.html would
    // point at hashed files from a previous deploy.
    app.use(express.static(distPath, { maxAge: '1y', immutable: true, index: false }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Mounting Vite dev server middleware');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vietnamese Revival Church server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
