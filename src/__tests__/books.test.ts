import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { initDb, sql } from '../db';

beforeAll(async () => {
  await initDb();
  // Clean up test data
  await sql.query("DELETE FROM books WHERE isbn IN ('1234567890', '9781234567890')");
});

afterAll(async () => {
  // Clean up test data
  await sql.query("DELETE FROM books WHERE isbn IN ('1234567890', '9781234567890')");
  await sql.end();
});

const validBook = { title: 'Test Book', author: 'Test Author', isbn: '1234567890', pages: 200, rating: 4 };

describe('POST /api/books', () => {
  it('should create a book', async () => {
    const res = await request(app).post('/api/books').send(validBook);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(validBook);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('created_at');
  });

  it('should reject duplicate ISBN', async () => {
    const res = await request(app).post('/api/books').send(validBook);
    expect(res.status).toBe(409);
  });

  it('should reject invalid data', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: '', author: 'A', isbn: 'bad', pages: -1, rating: 6 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/books', () => {
  it('should list books with pagination', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should search by title', async () => {
    const res = await request(app).get('/api/books?search=Test');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/books/:id', () => {
  it('should get a book by id', async () => {
    const list = await request(app).get('/api/books');
    const id = list.body.data[0].id;
    const res = await request(app).get(`/api/books/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('should return 404 for missing book', async () => {
    const res = await request(app).get('/api/books/999999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/books/:id', () => {
  it('should update a book', async () => {
    const list = await request(app).get('/api/books');
    const id = list.body.data[0].id;
    const res = await request(app)
      .put(`/api/books/${id}`)
      .send({ ...validBook, title: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });
});

describe('DELETE /api/books/:id', () => {
  it('should delete a book', async () => {
    const list = await request(app).get('/api/books');
    const id = list.body.data[0].id;
    const res = await request(app).delete(`/api/books/${id}`);
    expect(res.status).toBe(204);
  });
});
