import type { Book, Pagination } from '../types';

interface Props {
  books: Book[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export default function BookList({ books, pagination, onPageChange }: Props) {
  if (books.length === 0) {
    return <p className="empty">No books found.</p>;
  }

  return (
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
  );
}
