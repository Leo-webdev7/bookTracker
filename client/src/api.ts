import type { Book } from './types';

export interface BooksResponse {
  data: Book[];
  nextCursor: string | null;
}

export async function createBook(data: Omit<Book, 'id' | 'created_at'>): Promise<Book> {
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to create book');
  return body;
}

export async function listBooks(params?: {
  limit?: number;
  search?: string;
  cursor?: string;
}): Promise<BooksResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);
  if (params?.cursor) query.set('cursor', params.cursor);
  const res = await fetch(`/api/books?${query}`);
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}
