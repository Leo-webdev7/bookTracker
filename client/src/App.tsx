import { useState, useEffect, useCallback, useRef } from 'react';
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchBooks = useCallback(async (searchTerm: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBooks({ page: pageNum, limit: 20, search: searchTerm || undefined });
      setBooks(res.data);
      setPagination(res.pagination);
    } catch {
      setError('Failed to load books');
    } finally {
      setLoading(false);
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    fetchBooks(search, page);
  }, [fetchBooks, search, page]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchBooks(newSearch, 1);
    }, 300);
  };

  return (
    <div className="container">
      <h1>Book Tracker</h1>
      <AddBook onCreated={() => fetchBooks(search, page)} />

      <div className="card">
        <h2>Books</h2>
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <BookList
            books={books}
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
