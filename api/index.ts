import { app } from '../src/app';
import { initDb } from '../src/db';

let isInitialized = false;

export default async function handler(req: any, res: any) {
  // Initialize database only once (cold start)
  if (!isInitialized) {
    await initDb();
    isInitialized = true;
  }

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Forward to Express app
  app(req, res);
}
