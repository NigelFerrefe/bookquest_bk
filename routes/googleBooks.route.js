const express = require("express");
const router = express.Router();
const Book = require("../models/books.model");
const Author = require("../models/author.model");
const Genre = require("../models/genre.model");
const {
  GoogleBookSchema,
  GoogleBookSearchParamsSchema,
  GoogleBooksPaginatedResponseSchema,
  GoogleBookISBNParamsSchema,
} = require("../schemas/google-books.schema");
const { bookSchema } = require("../schemas/book.schema");

// Helper function to fetch with timeout and retry
async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 segundos

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }
  }

  throw lastError;
}

// GET /api/google-books?q=consulta&page=1&limit=10
router.get("/", async (req, res, next) => {
  try {
    // Validate input parameters with Zod
    const validatedParams = GoogleBookSearchParamsSchema.parse(req.query);
    const { q, page: pageNum, limit: limitNum } = validatedParams;

    const baseUrl = "https://www.googleapis.com/books/v1/volumes";
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

    // Make multiple searches with pagination to get more results
    // This helps overcome geolocation issues with Google Books API
    const maxResults = 40; // Maximum per request
    const numberOfRequests = 10; // Get up to 400 items total (optimized for personal use)

    const searchPromises = Array.from(
      { length: numberOfRequests },
      (_, index) => {
        const params = new URLSearchParams({
          q: q.trim(),
          startIndex: index * maxResults,
          maxResults: maxResults,
          printType: "books",
          orderBy: "relevance",
          ...(apiKey && { key: apiKey }),
        });

        const googleUrl = `${baseUrl}?${params.toString()}`;

        return fetchWithRetry(googleUrl)
          .then((response) => {
            if (!response.ok) {
              console.warn(
                `Search error (batch ${index + 1}): ${response.status}`,
              );
              return { items: [] };
            }
            return response.json();
          })
          .catch((error) => {
            console.error(`Search error (batch ${index + 1}):`, error.message);
            return { items: [] };
          });
      },
    );

    const results = await Promise.all(searchPromises);
    const allItems = results.flatMap((result) => result.items || []);

    // Apply ISBN and language filters
    const filteredBooks = allItems.filter((item) => {
      const volumeInfo = item.volumeInfo;

      // Verify it has industryIdentifiers
      if (!volumeInfo.industryIdentifiers) {
        return false;
      }

      // Find ISBN-13
      const isbn13 = volumeInfo.industryIdentifiers.find(
        (id) => id.type === "ISBN_13",
      );

      // Verify the ISBN is from Spain (978-84 or 979-13)
      if (isbn13) {
        const identifier = isbn13.identifier.replace(/-/g, "");
        const isSpanishISBN =
          identifier.startsWith("97884") || identifier.startsWith("97913");

        if (!isSpanishISBN) {
          return false;
        }
      } else {
        return false;
      }

      // Verify language (Spanish or Catalan)
      const language = volumeInfo.language;
      if (language !== "es" && language !== "ca") {
        return false;
      }

      return true;
    });
    // Calculate pagination
    const totalItems = filteredBooks.length;
    const totalPages = Math.ceil(totalItems / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    // Verify if requested page exists
    if (pageNum > totalPages && totalItems > 0) {
      return res.status(404).json({
        error: "Page not found",
        message: `Page ${pageNum} does not exist. Total pages: ${totalPages}`,
      });
    }

    // Get items from current page
    const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

    // Format response according to Zod schema
    const formattedBooks = paginatedBooks.map((item) => {
      const volumeInfo = item.volumeInfo;
      const saleInfo = item.saleInfo;

      const isbn13 = volumeInfo.industryIdentifiers.find(
        (id) => id.type === "ISBN_13",
      );

      // Extract image URL (prefer thumbnail over smallThumbnail)
      const imageUrl =
        volumeInfo.imageLinks?.thumbnail ||
        volumeInfo.imageLinks?.smallThumbnail ||
        null;

      // Extract price if available
      let price = null;
      if (saleInfo?.listPrice?.amount) {
        price = saleInfo.listPrice.amount;
      } else if (saleInfo?.retailPrice?.amount) {
        price = saleInfo.retailPrice.amount;
      }

      return {
        isbn13: isbn13?.identifier || "",
        title: volumeInfo.title || "",
        authors: volumeInfo.authors || [],
        imageUrl: imageUrl,
        categories: volumeInfo.categories || [],
        description: volumeInfo.description || null,
        price: price,
        language: volumeInfo.language,
      };
    });

    // Validate each book with Zod schema
    const validatedBooks = formattedBooks
      .map((book) => {
        try {
          return GoogleBookSchema.parse(book);
        } catch (error) {
          console.warn(
            `Book with ISBN ${book.isbn13} failed validation:`,
            error.errors,
          );
          return null;
        }
      })
      .filter((book) => book !== null);

    // Group results by language for statistics
    const languageStats = {
      es: validatedBooks.filter((b) => b.language === "es").length,
      ca: validatedBooks.filter((b) => b.language === "ca").length,
    };

    // Build response
    const response = {
      totalItems,
      totalPages,
      currentPage: pageNum,
      itemsPerPage: limitNum,
      itemsInCurrentPage: validatedBooks.length,
      query: q,
      filters: {
        isbn: ["978-84", "979-13"],
        languages: ["es", "ca"],
      },
      stats: languageStats,
      items: validatedBooks,
    };

    // Validate complete response (optional, useful for debugging)
    const validatedResponse =
      GoogleBooksPaginatedResponseSchema.parse(response);

    // Respond with paginated results
    res.json(validatedResponse);
  } catch (error) {
    // If it's a Zod validation error
    if (error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }

    console.error("Error in book search:", error);
    next(error);
  }
});

router.post("/:isbn13/add-to-wishlist", async (req, res, next) => {
  try {
    // Validate ISBN13 parameter
    const validatedParams = GoogleBookISBNParamsSchema.parse(req.params);
    const { isbn13 } = validatedParams;

    // Get authenticated user ID
    const userId = req.payload._id;

    // Validate book data from request body with GoogleBookSchema
    const bookFromRequest = GoogleBookSchema.parse(req.body);

    // Verify ISBN matches between URL and body
    const cleanISBNFromURL = isbn13.replace(/-/g, "");
    const cleanISBNFromBody = bookFromRequest.isbn13.replace(/-/g, "");
    
    if (cleanISBNFromURL !== cleanISBNFromBody) {
      return res.status(400).json({
        error: "ISBN mismatch",
        message: "ISBN in URL does not match ISBN in request body",
      });
    }

    // Verify if book already exists in user's wishlist
    const existingBook = await Book.findOne({
      owner: userId,
      title: bookFromRequest.title,
    });

    if (existingBook) {
      return res.status(409).json({
        error: "Duplicate book",
        message: "This book is already in your wishlist",
      });
    }

    // 1. Create or find author (take only the first one if there are multiple)
    const authorName =
      bookFromRequest.authors && bookFromRequest.authors.length > 0
        ? bookFromRequest.authors[0]
        : "Unknown Author";

    let author = await Author.findOne({
      name: authorName,
      owner: userId,
    });

    if (!author) {
      author = new Author({
        name: authorName,
        owner: userId,
      });
      await author.save();
    }

    // 2. Create or find genres
    const genreNames = bookFromRequest.categories || ["Uncategorized"];
    const genreIds = [];

    for (const genreName of genreNames) {
      let genre = await Genre.findOne({
        name: genreName,
        owner: userId,
      });

      if (!genre) {
        genre = new Genre({
          name: genreName,
          owner: userId,
        });
        await genre.save();
      }

      genreIds.push(genre._id);
    }

    // 3. Prepare book data
    const bookData = {
      title: bookFromRequest.title,
      author: author._id.toString(),
      genre: genreIds.map((id) => id.toString()),
      imageUrl: bookFromRequest.imageUrl || "",
      description: bookFromRequest.description || "",
      price: bookFromRequest.price || undefined,
      isBought: false, // By default goes to wishlist
      isFavorite: false,
      owner: userId.toString(),
    };

    // 4. Validate with Book schema
    const validatedBook = bookSchema.parse(bookData);

    // 5. Create book in database
    const newBook = new Book(validatedBook);
    await newBook.save();

    // 6. Populate data before returning response
    await newBook.populate("author genre");

    res.status(201).json({
      message: "Book added to wishlist successfully",
      book: newBook,
    });
  } catch (error) {
    // Zod validation error
    if (error.name === "ZodError") {
      const firstError = error.errors[0];

      return res.status(400).json({
        error: "Validation error",
        message: firstError.message,
        field: firstError.path.join("."),
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    console.error("Error in POST /:isbn13/add-to-wishlist:", error);
    next(error);
  }
});

module.exports = router;
