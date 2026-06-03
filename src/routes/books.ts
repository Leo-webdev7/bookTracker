import { Router, Request, Response } from 'express';
import { sql } from '../db';
import { bookSchema } from '../validation';
import { ZodError } from 'zod';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = bookSchema.parse(req.body);

    const existing = await sql.query('SELECT id FROM books WHERE isbn = $1', [data.isbn]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A book with this ISBN already exists' });
    }

    const result = await sql.query(
      'INSERT INTO books (title, author, isbn, pages, rating) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.title, data.author, data.isbn, data.pages, data.rating]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    console.error('POST /api/books error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const search = (req.query.search as string || '').trim();
  const cursor = req.query.cursor as string | undefined;

  try {
    if (search) {
      const like = `%${search}%`;

      if (cursor) {
        const books = await sql.query(
          `SELECT * FROM books
           WHERE (title ILIKE $1 OR author ILIKE $1)
             AND (created_at, id) < ($2::timestamptz, $3::int)
           ORDER BY created_at DESC, id DESC
           LIMIT $4`,
          [like, ...decodeCursor(cursor), limit]
        );

        return res.json({
          data: books.rows,
          nextCursor: books.rows.length === limit
            ? encodeCursor(books.rows[books.rows.length - 1])
            : null,
        });
      }

      const books = await sql.query(
        `SELECT * FROM books
         WHERE title ILIKE $1 OR author ILIKE $1
         ORDER BY created_at DESC, id DESC
         LIMIT $2`,
        [like, limit]
      );

      return res.json({
        data: books.rows,
        nextCursor: books.rows.length === limit
          ? encodeCursor(books.rows[books.rows.length - 1])
          : null,
      });
    }

    // Non-search: simple cursor pagination
    if (cursor) {
      const books = await sql.query(
        `SELECT * FROM books
         WHERE (created_at, id) < ($1::timestamptz, $2::int)
         ORDER BY created_at DESC, id DESC
         LIMIT $3`,
        [...decodeCursor(cursor), limit]
      );

      return res.json({
        data: books.rows,
        nextCursor: books.rows.length === limit
          ? encodeCursor(books.rows[books.rows.length - 1])
          : null,
      });
    }

    const books = await sql.query(
      'SELECT * FROM books ORDER BY created_at DESC, id DESC LIMIT $1',
      [limit]
    );

    return res.json({
      data: books.rows,
      nextCursor: books.rows.length === limit
        ? encodeCursor(books.rows[books.rows.length - 1])
        : null,
    });
  } catch (err) {
    console.error('GET /api/books error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  try {
    const result = await sql.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /api/books/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = bookSchema.parse(req.body);
    const id = parseInt(String(req.params.id));

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }

    const existing = await sql.query('SELECT id FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const dup = await sql.query('SELECT id FROM books WHERE isbn = $1 AND id != $2', [data.isbn, id]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'Another book with this ISBN already exists' });
    }

    const result = await sql.query(
      `UPDATE books
       SET title = $1, author = $2, isbn = $3, pages = $4, rating = $5
       WHERE id = $6
       RETURNING *`,
      [data.title, data.author, data.isbn, data.pages, data.rating, id]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    console.error('PUT /api/books/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  try {
    const existing = await sql.query('SELECT id FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    await sql.query('DELETE FROM books WHERE id = $1', [id]);
    return res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/books/:id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Cursor helpers: encode/decode { created_at, id } as base64
function encodeCursor(row: { created_at: string; id: number }): string {
  return Buffer.from(JSON.stringify({ created_at: row.created_at, id: row.id })).toString('base64');
}

function decodeCursor(cursor: string): [string, number] {
  const { created_at, id } = JSON.parse(Buffer.from(cursor, 'base64').toString());
  return [created_at, id];
}

export default router;
