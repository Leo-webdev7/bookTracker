import { useState, useEffect, useCallback } from 'react';
import { listBooks } from './api';
import type { Book, Pagination } from './types';
import AddBook from './components/AddBook';
import BookList from './components/BookList';

const initialPagination: Pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBooks({ page, limit: 20, search: search || undefined });
      setBooks(res.data);
      setPagination(res.pagination);
    } catch {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  return (
    <div className="container">
      <h1>Book Tracker</h1>
      <AddBook onCreated={() => fetchBooks()} />
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <BookList
          books={books}
          pagination={pagination}
          search={search}
          onPageChange={setPage}
          onSearchChange={handleSearchChange}
        />
      )}
    </div>
  );
}
