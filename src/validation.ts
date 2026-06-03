import { z } from 'zod';

export const bookSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(500, 'Title must be at most 500 characters'),
  author: z
    .string({ required_error: 'Author is required' })
    .min(1, 'Author cannot be empty')
    .max(300, 'Author must be at most 300 characters'),
  isbn: z
    .string({ required_error: 'ISBN is required' })
    .regex(/^\d{10}(\d{3})?$/, 'ISBN must be 10 or 13 digits (numbers only)'),
  pages: z
    .number({ required_error: 'Number of pages is required' })
    .int('Pages must be an integer')
    .positive('Pages must be a positive number'),
  rating: z
    .number({ required_error: 'Rating is required' })
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
});

export type BookInput = z.infer<typeof bookSchema>;
