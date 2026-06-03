import { useState } from 'react';
import type { BookInput } from '../types';
import { createBook } from '../api';

interface Props {
  onCreated: () => void;
}

const empty: BookInput = { title: '', author: '', isbn: '', pages: 0, rating: 5 };

function validate(data: BookInput): string | null {
  if (!data.title.trim()) return 'Title is required';
  if (!data.author.trim()) return 'Author is required';
  if (!/^\d{10}(\d{3})?$/.test(data.isbn)) return 'ISBN must be 10 or 13 digits';
  if (!Number.isInteger(data.pages) || data.pages < 1) return 'Pages must be a positive integer';
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
    return 'Rating must be an integer between 1 and 5';
  return null;
}

export default function AddBook({ onCreated }: Props) {
  const [form, setForm] = useState<BookInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof BookInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'pages' || field === 'rating' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await createBook(form);
      setForm(empty);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>Add a Book</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input id="title" value={form.title} onChange={set('title')} placeholder="Book title" />
        </div>
        <div className="form-group">
          <label htmlFor="author">Author</label>
          <input id="author" value={form.author} onChange={set('author')} placeholder="Author name" />
        </div>
        <div className="form-group">
          <label htmlFor="isbn">ISBN</label>
          <input id="isbn" value={form.isbn} onChange={set('isbn')} placeholder="10 or 13 digits" />
        </div>
        <div className="form-group">
          <label htmlFor="pages">Pages</label>
          <input id="pages" type="number" min={1} value={form.pages || ''} onChange={set('pages')} placeholder="Number of pages" />
        </div>
        <div className="form-group">
          <label htmlFor="rating">Rating (1-5)</label>
          <input id="rating" type="number" min={1} max={5} value={form.rating} onChange={set('rating')} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Book'}
        </button>
      </form>
    </div>
  );
}
