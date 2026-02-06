const { z } = require("zod");

// Schema for individual book
const GoogleBookSchema = z.object({
  isbn13: z.string().min(10), 
  title: z.string(),
  authors: z.array(z.string()).default([]),
  imageUrl: z.string().regex(/^https?:\/\/.+/).nullable().default(null),
  categories: z.array(z.string()).default([]),
  description: z.string().nullable().default(null),
  price: z.number().nullable().default(null),
  language: z.enum(["es", "ca"]),
});

const GoogleBookISBNParamsSchema = z.object({
  isbn13: z.string()
    .min(10, "ISBN13 must have at least 10 characters")
    .max(17, "ISBN13 must not exceed 17 characters") // With hyphens it can be longer
    .refine(
      (isbn) => {
        const cleaned = isbn.replace(/-/g, "");
        return /^\d{10,13}$/.test(cleaned);
      },
      "ISBN13 must contain only numbers (hyphens are allowed)"
    )
    .refine(
      (isbn) => {
        const cleaned = isbn.replace(/-/g, "");
        return cleaned.startsWith("97884") || cleaned.startsWith("97913");
      },
      "ISBN13 must be from Spain (978-84 or 979-13)"
    )
});

// Schema for search parameters (query params)
const GoogleBookSearchParamsSchema = z.object({
  q: z.string().min(1, "Parameter 'q' is required"),
  page: z.string().optional().default("1").transform(val => {
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num) || num < 1) {
      throw new Error("Parameter 'page' must be a number greater than 0");
    }
    return num;
  }),
  limit: z.string().optional().default("10").transform(val => {
    const num = Number.parseInt(val, 10);
    if (Number.isNaN(num) || num < 1 || num > 40) {
      throw new Error("Parameter 'limit' must be a number between 1 and 40");
    }
    return num;
  }),
});

// Schema for language statistics
const LanguageStatsSchema = z.object({
  es: z.number().int().min(0),
  ca: z.number().int().min(0),
});

// Schema for complete paginated response
const GoogleBooksPaginatedResponseSchema = z.object({
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  itemsPerPage: z.number().int().min(1).max(40),
  itemsInCurrentPage: z.number().int().min(0),
  query: z.string(),
  filters: z.object({
    isbn: z.array(z.string()),
    languages: z.array(z.string()),
  }),
  stats: LanguageStatsSchema,
  items: z.array(GoogleBookSchema),
});

module.exports = { 
  GoogleBookSchema,
  GoogleBookSearchParamsSchema,
  GoogleBooksPaginatedResponseSchema,
  GoogleBookISBNParamsSchema,
  LanguageStatsSchema
};