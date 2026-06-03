import { useState, useEffect, useCallback, useRef } from 'react';
import { listBooks } from './api';
import type { Book } from './types';
import AddBook from './components/AddBook';
import BookList from './components/BookList';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchBooks = useCallback(async (searchTerm: string, cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listBooks({ limit: 20, search: searchTerm || undefined, cursor });
      if (cursor) {
        setBooks((prev) => [...prev, ...res.data]);
      } else {
        setBooks(res.data);
      }
      setNextCursor(res.nextCursor);
    } catch {
      setError('Failed to load books');
    } finally {
      setLoading(false);
      searchInputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    fetchBooks(search);
  }, [fetchBooks, search]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setHistory([]);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchBooks(newSearch);
    }, 300);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      setHistory((prev) => [...prev, nextCursor]);
      fetchBooks(search, nextCursor);
    }
  };

  const handleGoBack = () => {
    if (history.length > 0) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      const cursor = newHistory[newHistory.length - 1];
      setBooks([]);
      fetchBooks(search, cursor);
    } else {
      setBooks([]);
      fetchBooks(search);
    }
  };

  return (
    <div className="container">
      <h1>Book Tracker</h1>
      <AddBook onCreated={() => fetchBooks(search)} />

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
          <BookList books={books} />
        )}

        <div className="pagination">
          {history.length > 0 && (
            <button onClick={handleGoBack}>Previous</button>
          )}
          {nextCursor && (
            <button onClick={handleLoadMore} disabled={loading}>Load More</button>
          )}
          {!nextCursor && books.length > 0 && (
            <span className="pagination-info">All books loaded ({books.length})</span>
          )}
        </div>
      </div>
    </div>
  );
}
