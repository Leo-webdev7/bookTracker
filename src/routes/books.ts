import { Router, Request, Response } from 'express';
import { sql } from '../db';
import { bookSchema } from '../validation';
import { ZodError } from 'zod';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = bookSchema.parse(req.body);

    // Check for duplicate ISBN
    const existing = await sql.query('SELECT id FROM books WHERE isbn = $1', [data.isbn]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A book with this ISBN already exists' });
    }

    // Insert new book
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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const search = (req.query.search as string || '').trim();

  try {
    if (search) {
      // Use full-text search for better performance with large datasets
      const countResult = await sql.query(
        `SELECT COUNT(*) as total
         FROM books
         WHERE to_tsvector('english', title) @@ plainto_tsquery('english', $1)
            OR to_tsvector('english', author) @@ plainto_tsquery('english', $1)`,
        [search]
      );
      const total = parseInt(countResult.rows[0].total);

      const books = await sql.query(
        `SELECT *
         FROM books
         WHERE to_tsvector('english', title) @@ plainto_tsquery('english', $1)
            OR to_tsvector('english', author) @@ plainto_tsquery('english', $1)
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      );

      return res.json({
        data: books.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const countResult = await sql.query('SELECT COUNT(*) as total FROM books');
    const total = parseInt(countResult.rows[0].total);

    const books = await sql.query(
      'SELECT * FROM books ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    return res.json({
      data: books.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

    // Check if book exists
    const existing = await sql.query('SELECT id FROM books WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check for duplicate ISBN (excluding current book)
    const dup = await sql.query('SELECT id FROM books WHERE isbn = $1 AND id != $2', [data.isbn, id]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: 'Another book with this ISBN already exists' });
    }

    // Update book
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

export default router;
