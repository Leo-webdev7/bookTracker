import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Use Neon serverless driver for Vercel, pg for local development
const isVercel = !!process.env.VERCEL;

let pool: Pool;

if (isVercel) {
  // For Vercel deployment, use Neon serverless driver
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(DATABASE_URL);
  
  // Create a wrapper that mimics pg Pool interface
  pool = {
    query: async (text: string, params?: unknown[]) => {
      const result = await sql(text, params);
      return { rows: result };
    },
    connect: async () => ({
      query: async (text: string, params?: unknown[]) => {
        const result = await sql(text, params);
        return { rows: result };
      },
      release: () => {},
    }),
    end: async () => {},
  } as unknown as Pool;
} else {
  // For local development, use standard pg driver
  pool = new Pool({
    connectionString: DATABASE_URL,
  });
}

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create tables with proper indexes for 10M records optimization
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(500) NOT NULL,
        author      VARCHAR(300) NOT NULL,
        isbn        VARCHAR(13) NOT NULL UNIQUE,
        pages       INTEGER NOT NULL CHECK(pages > 0),
        rating      INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for performance with 10M records
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_title ON books(title)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_author ON books(author)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC)');

    // Create GIN indexes for full-text search (bonus feature)
    await client.query("CREATE INDEX IF NOT EXISTS idx_books_title_gin ON books USING GIN(to_tsvector('english', title))");
    await client.query("CREATE INDEX IF NOT EXISTS idx_books_author_gin ON books USING GIN(to_tsvector('english', author))");
  } finally {
    client.release();
  }
}

export { pool as sql };
