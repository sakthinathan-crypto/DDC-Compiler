import { createApp } from './app';

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }

  // Handle Vercel rewrite parameter or originalUrl
  let url = req.url || '/';
  if (req.query && req.query.match) {
    const matchPath = Array.isArray(req.query.match) ? req.query.match.join('/') : req.query.match;
    url = `/api/${matchPath}`;
  }

  if (url && !url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }
  req.url = url;

  return cachedApp(req, res);
}
