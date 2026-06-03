import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isVercel = !!process.env.VERCEL;

let pool: Pool;

if (isVercel) {
  const { neon } = require('@neondatabase/serverless');
  const sql = neon(DATABASE_URL);
  
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
  pool = new Pool({
    connectionString: DATABASE_URL,
  });
}

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    // Enable pg_trgm extension for trigram-based ILIKE indexing
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

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

    // B-tree indexes for exact lookups and sorting
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC)');

    // Composite index for cursor-based pagination
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_created_id ON books(created_at DESC, id DESC)');

    // Trigram indexes for fast partial matching with ILIKE '%term%'
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_title_trgm ON books USING GIN(title gin_trgm_ops)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_books_author_trgm ON books USING GIN(author gin_trgm_ops)');
  } finally {
    client.release();
  }
}

export { pool as sql };
