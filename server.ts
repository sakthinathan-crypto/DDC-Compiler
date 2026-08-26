import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

async function startServer() {
  const app = await createApp();
  const PORT = 3000;

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(expressStaticFallback(distPath));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Designers Domain Club Compiler running on http://0.0.0.0:${PORT}`);
  });
}

function expressStaticFallback(distPath: string) {
  const express = require('express');
  const router = express.Router();
  router.use(express.static(distPath));
  router.get('*', (req: any, res: any) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  return router;
}

startServer();
