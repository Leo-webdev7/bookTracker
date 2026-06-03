import { app } from './app';
import { initDb } from './db';

const PORT = parseInt(process.env.PORT || '3001');

async function main() {
  await initDb();
  const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });

  process.on('SIGTERM', () => { server.close(); });
  process.on('SIGINT', () => { server.close(); });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
