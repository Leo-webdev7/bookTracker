import express from 'express';
import cors from 'cors';
import booksRouter from './routes/books';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/books', booksRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export { app };
