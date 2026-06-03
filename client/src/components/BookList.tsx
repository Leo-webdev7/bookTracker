import type { Book, Pagination } from '../types';

interface Props {
  books: Book[];
  pagination: Pagination;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
}

export default function BookList({ books, pagination, search, onPageChange, onSearchChange }: Props) {
  return (
    <div className="card">
      <h2>Books</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {books.length === 0 ? (
        <p className="empty">No books found.</p>
      ) : (
        <>
          <div className="book-table-wrapper">
            <table className="book-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Pages</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.isbn}</td>
                    <td>{book.pages}</td>
                    <td>{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} books)
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
