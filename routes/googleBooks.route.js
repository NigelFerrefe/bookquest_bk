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
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          ...options.headers,
        }
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
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
    console.log("🔍 Search query:", q);
    
    // Make a single search without langRestrict to get better regional results
    const params = new URLSearchParams({
      q: q.trim(),
      maxResults: 40, // Maximum allowed by Google Books API
      printType: "books",
      orderBy: "relevance",
      ...(apiKey && { key: apiKey })
    });

    const googleUrl = `${baseUrl}?${params.toString()}`;
    console.log(`🌐 Calling Google Books:`, googleUrl);
    
    let allItems = [];
    try {
      const response = await fetchWithRetry(googleUrl);
      
      if (!response.ok) {
        console.warn(`Search error: ${response.status} ${response.statusText}`);
      } else {
        const data = await response.json();
        console.log(`📚 Google returned:`, data.totalItems || 0, "total items");
        allItems = data.items || [];
      }
    } catch (error) {
      console.error(`Search error:`, error.message);
    }

    console.log(`📦 Total items fetched:`, allItems.length);

    // Log ISBNs for debugging
    console.log(`📋 Sample ISBNs from results:`, allItems.slice(0, 5).map(item => {
      const isbn13 = item.volumeInfo?.industryIdentifiers?.find(id => id.type === "ISBN_13");
      return {
        title: item.volumeInfo?.title?.substring(0, 30),
        isbn: isbn13?.identifier || 'NO ISBN',
        lang: item.volumeInfo?.language
      };
    }));

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
console.log(`✅ Items after ISBN filter:`, filteredBooks.length);
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

router.get("/:isbn13", async (req, res, next) => {
  try {
    // Validate ISBN13 parameter
    const validatedParams = GoogleBookISBNParamsSchema.parse(req.params);
    const { isbn13 } = validatedParams;

    // Clean ISBN for search (without hyphens)
    const cleanISBN = isbn13.replace(/-/g, "");

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const params = new URLSearchParams({
      q: `isbn:${cleanISBN}`,
      ...(apiKey && { key: apiKey })
    });

    // Search Google Books by ISBN
    const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;

    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      return res.status(502).json({
        error: "External server error",
        message: "Could not get data from Google Books API",
      });
    }

    const data = await response.json();

    // Verify if book was found
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({
        error: "Book not found",
        message: `No book found with ISBN ${isbn13}`,
      });
    }

    const volumeInfo = data.items[0].volumeInfo;
    const saleInfo = data.items[0].saleInfo;

    // Verify it has ISBN-13
    if (!volumeInfo.industryIdentifiers) {
      return res.status(404).json({
        error: "Incomplete data",
        message: "The book found does not have a registered ISBN",
      });
    }

    const isbnObj = volumeInfo.industryIdentifiers.find(
      (id) => id.type === "ISBN_13",
    );

    if (!isbnObj) {
      return res.status(404).json({
        error: "ISBN not found",
        message: "The book does not have ISBN-13 registered",
      });
    }

    // Verify ISBN matches (without hyphens)
    const foundISBN = isbnObj.identifier.replace(/-/g, "");
    if (foundISBN !== cleanISBN) {
      return res.status(404).json({
        error: "ISBN does not match",
        message: `The book found has a different ISBN: ${isbnObj.identifier}`,
      });
    }

    // Verify it's from Spain (978-84 or 979-13)
    const isSpanishISBN =
      foundISBN.startsWith("97884") || foundISBN.startsWith("97913");
    if (!isSpanishISBN) {
      return res.status(404).json({
        error: "Invalid ISBN",
        message: "The ISBN does not correspond to a Spanish edition",
      });
    }

    // Verify language (must be Spanish or Catalan)
    const language = volumeInfo.language;
    if (language !== "es" && language !== "ca") {
      return res.status(404).json({
        error: "Invalid language",
        message: `The book is in language '${language}', only Spanish or Catalan books are allowed`,
      });
    }

    // Extract price
    let price = null;
    if (saleInfo?.listPrice?.amount) {
      price = saleInfo.listPrice.amount;
    } else if (saleInfo?.retailPrice?.amount) {
      price = saleInfo.retailPrice.amount;
    }

    // Build object according to schema
    const bookData = {
      isbn13: isbnObj.identifier,
      title: volumeInfo.title || "",
      authors: volumeInfo.authors || [],
      imageUrl:
        volumeInfo.imageLinks?.thumbnail ||
        volumeInfo.imageLinks?.smallThumbnail ||
        null,
      categories: volumeInfo.categories || [],
      description: volumeInfo.description || null,
      price: price,
      language: language,
    };

    // Validate with Zod
    const book = GoogleBookSchema.parse(bookData);

    res.json(book);
  } catch (error) {
    // Zod validation error
    if (error.name === "ZodError") {
      const firstError = error.errors[0];
      
      return res.status(400).json({
        error: "Validation error",
        message: firstError.message,
        field: firstError.path.join("."),
        details: error.errors,
      });
    }

    console.error("Error in GET /:isbn13:", error);
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

    // Clean ISBN for search
    const cleanISBN = isbn13.replace(/-/g, "");

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const params = new URLSearchParams({
      q: `isbn:${cleanISBN}`,
      ...(apiKey && { key: apiKey })
    });

    // Search book in Google Books
    const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      return res.status(502).json({ 
        error: "External server error",
        message: "Could not get data from Google Books API" 
      });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ 
        error: "Book not found",
        message: `No book found with ISBN ${isbn13}` 
      });
    }

    const volumeInfo = data.items[0].volumeInfo;
    const saleInfo = data.items[0].saleInfo;

    // Validate it has necessary data
    if (!volumeInfo.industryIdentifiers) {
      return res.status(404).json({ 
        error: "Incomplete data",
        message: "The book does not have a registered ISBN" 
      });
    }

    const isbnObj = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
    if (!isbnObj) {
      return res.status(404).json({ 
        error: "ISBN not found",
        message: "The book does not have ISBN-13 registered" 
      });
    }

    // Verify it's a Spanish ISBN
    const foundISBN = isbnObj.identifier.replace(/-/g, "");
    const isSpanishISBN = foundISBN.startsWith("97884") || foundISBN.startsWith("97913");
    if (!isSpanishISBN) {
      return res.status(404).json({ 
        error: "Invalid ISBN",
        message: "The ISBN does not correspond to a Spanish edition" 
      });
    }

    // Verify language
    const language = volumeInfo.language;
    if (language !== "es" && language !== "ca") {
      return res.status(404).json({ 
        error: "Invalid language",
        message: `The book is in language '${language}', only Spanish or Catalan books are allowed` 
      });
    }

    // Verify if book already exists in user's wishlist
    const existingBook = await Book.findOne({
      owner: userId,
      title: volumeInfo.title
    });

    if (existingBook) {
      return res.status(409).json({
        error: "Duplicate book",
        message: "This book is already in your wishlist",
      });
    }

    // 1. Create or find author (take only the first one if there are multiple)
    const authorName = volumeInfo.authors && volumeInfo.authors.length > 0 
      ? volumeInfo.authors[0] 
      : "Unknown Author";

    let author = await Author.findOne({ 
      name: authorName,
      owner: userId 
    });
    
    if (!author) {
      author = new Author({ 
        name: authorName,
        owner: userId
      });
      await author.save();
    }

    // 2. Create or find genres
    const genreNames = volumeInfo.categories || ["Uncategorized"];
    const genreIds = [];

    for (const genreName of genreNames) {
      let genre = await Genre.findOne({ 
        name: genreName,
        owner: userId 
      });
      
      if (!genre) {
        genre = new Genre({ 
          name: genreName,
          owner: userId
        });
        await genre.save();
      }
      
      genreIds.push(genre._id);
    }

    // 3. Extract price
    let price = null;
    if (saleInfo?.listPrice?.amount) {
      price = saleInfo.listPrice.amount;
    } else if (saleInfo?.retailPrice?.amount) {
      price = saleInfo.retailPrice.amount;
    }

    // 4. Prepare book data
    const bookData = {
      title: volumeInfo.title || "",
      author: author._id.toString(),
      genre: genreIds.map(id => id.toString()),
      imageUrl: volumeInfo.imageLinks?.thumbnail || 
                volumeInfo.imageLinks?.smallThumbnail || 
                "",
      description: volumeInfo.description || "",
      price: price || undefined,
      isBought: false, // By default goes to wishlist
      isFavorite: false,
      owner: userId.toString()
    };

    // 5. Validate with Book schema
    const validatedBook = bookSchema.parse(bookData);

    // 6. Create book in database
    const newBook = new Book(validatedBook);
    await newBook.save();

    // 7. Populate data before returning response
    await newBook.populate("author genre");

    res.status(201).json({
      message: "Book added to wishlist successfully",
      book: newBook
    });

  } catch (error) {
    // Zod validation error
    if (error.name === "ZodError") {
      const firstError = error.errors[0];
      
      return res.status(400).json({ 
        error: "Validation error",
        message: firstError.message,
        field: firstError.path.join("."),
        details: error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message
        }))
      });
    }
    
    console.error("Error in POST /:isbn13/add-to-wishlist:", error);
    next(error);
  }
});

module.exports = router;