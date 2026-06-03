import type { Book, BookInput, BooksResponse } from './types';

// In development, use the proxy. In production, use the same origin
const BASE = import.meta.env.DEV ? '/api/books' : '/api/books';

export async function createBook(data: BookInput): Promise<Book> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to create book');
  return body;
}

export async function listBooks(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<BooksResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  const res = await fetch(`${BASE}?${query}`);
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}
