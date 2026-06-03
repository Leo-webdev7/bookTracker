export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  pages: number;
  rating: number;
  created_at: string;
}

export interface BookInput {
  title: string;
  author: string;
  isbn: string;
  pages: number;
  rating: number;
}
