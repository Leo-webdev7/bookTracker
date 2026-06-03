# Book Tracker

A full-stack application to track books read by users, built with React, TypeScript, Express, and PostgreSQL.

**Live Demo**: https://book-tracker-gray-zeta.vercel.app

## Features

- **Add Books** - Add new books with title, author, ISBN, pages, and rating (1-5 stars)
- **List Books** - View all books with cursor-based pagination
- **Search** - Real-time search by title and author with partial matching (first character works)
- **Validation** - Client-side and server-side validation with Zod
- **Optimized** - Database indexes designed for 10M+ records performance

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Express, TypeScript |
| Database | PostgreSQL 15 |
| Hosting | Vercel (frontend + API) |
| Database Host | Neon (serverless PostgreSQL) |
| Testing | Vitest, Supertest |

## Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 15 or higher (for local development)
- **pgAdmin** (optional, for database management)

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/booktracker.git
cd booktracker
```

### 2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 3. Set up PostgreSQL

**Option A: Using Docker/Podman (recommended)**

```bash
# Start PostgreSQL container
podman run -d --name booktracker-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booktracker \
  -v ~/booktracker_pgdata:/var/lib/postgresql/data \
  -p 5433:5432 \
  docker.io/library/postgres:15
```

**Option B: Using existing PostgreSQL installation**

Create a database named `booktracker` using pgAdmin or psql:

```sql
CREATE DATABASE booktracker;
```

### 4. Configure environment variables

Copy the example environment file and update it:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# For Docker/Podman (port 5433)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/booktracker

# For local PostgreSQL (port 5432)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/booktracker
```

### 5. Start the application

```bash
# Run both frontend and backend
npm run dev
```

Or run them separately:

```bash
# Backend only (port 3001)
npm run dev:server

# Frontend only (port 5173)
npm run dev:client
```

### 6. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Connecting pgAdmin

To manage the database using pgAdmin:

1. Open pgAdmin
2. Right-click **Servers** → **Register** → **General Server**
3. **General tab**:
   - Name: `BookTracker Local`
4. **Connection tab**:
   - Host name/address: `localhost`
   - Port: `5433` (Docker) or `5432` (local)
   - Username: `postgres`
   - Password: `postgres`
   - Maintenance database: `postgres`
5. Click **Save**

## API Endpoints

| Method | Endpoint | Description | Request Body / Query |
|--------|----------|-------------|----------------------|
| `POST` | `/api/books` | Create a new book | `{ title, author, isbn, pages, rating }` |
| `GET` | `/api/books` | List books | Query: `limit`, `search`, `cursor` |
| `GET` | `/api/books/:id` | Get a specific book | - |
| `PUT` | `/api/books/:id` | Update a book | `{ title, author, isbn, pages, rating }` |
| `DELETE` | `/api/books/:id` | Delete a book | - |

### Example Requests

**Create a book:**

```bash
curl -X POST http://localhost:3001/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","isbn":"9780743273565","pages":180,"rating":5}'
```

**List books with search:**

```bash
# Search by first character
curl "http://localhost:3001/api/books?search=g&limit=10"

# Paginate with cursor (from previous response's nextCursor)
curl "http://localhost:3001/api/books?limit=10&cursor=eyJjcmVhdGVkX2F0IjoiM..."
```

**Response format:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "pages": 180,
      "rating": 5,
      "created_at": "2026-06-03T17:37:01.005Z"
    }
  ],
  "nextCursor": "eyJjcmVhdGVkX2F0IjoiM..."
}
```

## Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE books (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  author      VARCHAR(300) NOT NULL,
  isbn        VARCHAR(13) NOT NULL UNIQUE,
  pages       INTEGER NOT NULL CHECK(pages > 0),
  rating      INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for exact lookups and sorting
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_created_at ON books(created_at DESC);

-- Composite index for cursor-based pagination
CREATE INDEX idx_books_created_id ON books(created_at DESC, id DESC);

-- Trigram indexes for fast partial matching (ILIKE '%term%')
CREATE INDEX idx_books_title_trgm ON books USING GIN(title gin_trgm_ops);
CREATE INDEX idx_books_author_trgm ON books USING GIN(author gin_trgm_ops);
```

## Testing

Run the automated test suite (requires local PostgreSQL):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/booktracker" npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Test Coverage

| Test Suite | Tests |
|------------|-------|
| POST /api/books | Create book, reject duplicate ISBN, reject invalid data |
| GET /api/books | List with pagination, search by title |
| GET /api/books/:id | Get by ID, return 404 for missing book |
| PUT /api/books/:id | Update book |
| DELETE /api/books/:id | Delete book |

**Total: 9 tests**

## Deployment to Vercel

### Prerequisites

- Vercel account
- Neon DB account (https://neon.tech)

### Steps

1. **Create a Neon database** and get the connection string

2. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel:**

   ```bash
   vercel login
   ```

4. **Link your project:**

   ```bash
   vercel link
   ```

5. **Add environment variable in Vercel dashboard:**

   - Go to your project → Settings → Environment Variables
   - Add: `DATABASE_URL` with your Neon connection string

6. **Deploy:**

   ```bash
   vercel --prod
   ```

## Project Structure

```
booktracker/
├── api/
│   └── index.ts              # Vercel serverless function
├── client/
│   ├── public/
│   │   └── favicon.svg       # Book icon favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddBook.tsx   # Add book form
│   │   │   └── BookList.tsx  # Book table display
│   │   ├── api.ts            # API client functions
│   │   ├── App.tsx           # Main app component
│   │   ├── App.css           # Styles
│   │   ├── main.tsx          # Entry point
│   │   └── types.ts          # TypeScript types
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── src/
│   ├── routes/
│   │   └── books.ts          # API routes with cursor pagination
│   ├── __tests__/
│   │   └── books.test.ts     # Automated tests
│   ├── app.ts                # Express app setup
│   ├── db.ts                 # Database connection + schema
│   ├── server.ts             # Server entry point
│   └── validation.ts         # Zod validation schemas
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
├── vercel.json               # Vercel deployment config
└── vitest.config.ts
```

## Performance Considerations

The database is optimized for datasets up to 10 million records:

| Optimization | Purpose |
|--------------|---------|
| **pg_trgm extension** | Enables trigram-based indexes for partial string matching |
| **GIN trigram indexes** | `ILIKE '%term%'` uses index instead of full table scan |
| **Cursor-based pagination** | Constant-time pagination regardless of position (no OFFSET) |
| **Composite index** | Supports both sorting and cursor navigation efficiently |
| **Connection pooling** | pg Pool reuses database connections |

### Why cursor-based pagination?

Traditional `OFFSET` pagination reads and discards all previous rows. At page 100,000 with 10M records, this means reading 10M rows just to return 20. Cursor-based pagination uses `WHERE (created_at, id) < (cursor)` to jump directly to the next page, maintaining constant query time.

## License

MIT
