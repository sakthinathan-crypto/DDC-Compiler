import { createApp } from '../server/app';

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }

  // Ensure req.url has /api prefix for Express routing on Vercel serverless
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return cachedApp(req, res);
}

