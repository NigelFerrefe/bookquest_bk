const express = require("express");
const router = express.Router();
const Book = require("../models/books.model");
const Genre = require("../models/genre.model");
const Author = require("../models/author.model");
const upload = require("../config/cloudinary.config");
const {buildPagination} = require("../utils/pagination")
const { bookSchema } = require("../Schemas/book.schema");
const { z } = require("zod");

//? Book lists

//* Get wishlist books
router.get("/wishlist", async (req, res, next) => {
  try {
    const userId = req.payload._id;

    //* Read page parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;

    const query = {
      owner: userId,
      isBought: false,
    };

    //* Total books, so we know page limit
    const total = await Book.countDocuments(query);

    
    const wishlistBooks = await Book.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("author genre");

    //* Create object paginated
    const pagination = buildPagination({
      totalItems: total,
      currentPage: page,
      perPage,
    });

    
    res.status(200).json({
      data: wishlistBooks,
      pagination,
    });
  } catch (error) {
    next(error);
  }
});


//* Get purchased books
router.get("/purchased", async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;

    const query = {
      owner: userId,
      isBought: true,
    };

    const total = await Book.countDocuments(query);

    const purchasedBooks = await Book.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("author genre");

    const pagination = buildPagination({
      totalItems: total,
      currentPage: page,
      perPage,
    });

    res.status(200).json({
      data: purchasedBooks,
      pagination,
    });
  } catch (error) {
    next(error);
  }
});

//* Get favorite books 
router.get("/favorites", async (req, res, next) => {
  try {
    const userId = req.payload._id;

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;

    const query = {
      owner: userId,
      isFavorite: true,
    };

    const total = await Book.countDocuments(query);

    const favoriteBooks = await Book.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("author genre");

    const pagination = buildPagination({
      totalItems: total,
      currentPage: page,
      perPage,
    });

    res.status(200).json({
      data: favoriteBooks,
      pagination,
    });
  } catch (error) {
    next(error);
  }
});

//? Book CRUD operations

//* Create a new book
router.post("/", upload.single("imageUrl"), async (req, res, next) => {
  try {
    //* Check if author or genre exist
    const { author, genre } = req.body;

    const genreExists = await Genre.findById(genre);
    if (!genreExists) {
      return res.status(400).json({ message: "Genre not found" });
    }

    const authorExists = await Author.findById(author);
    if (!authorExists) {
      return res.status(400).json({ message: "Author not found" });
    }

    //* Object with zod validation
    const dataToValidate = {
      ...req.body,
      genre: Array.isArray(genre) ? genre : [genre], 
      price: req.body.price ? Number(req.body.price) : undefined,
      isBought: req.body.isBought === "true",    
      isFavorite: req.body.isFavorite === "true",
      imageUrl: req.file ? req.file.path : undefined,
      owner: req.payload._id,  
    };

    
    const validatedBook = bookSchema.parse(dataToValidate);

    const newBook = new Book(validatedBook);
    await newBook.save();

    res.status(201).json(newBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    next(error);
  }
});



//* Book details 
router.get("/:id" , async (req, res, next) => {
    try {
        const {id} = req.params;
        const book = await Book.findById(id).populate("author genre")

        if (!book) {
            return res.status(404).json({message: "Book not found"})
        }
        res.json(book)

    } catch (error) {
        next(error)
    }
})



//* Modify a book
router.put("/:id", upload.single("imageUrl"), async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Normalizar y preparar datos para validación
    let {
      title,
      author,
      genre,
      description,
      price,
      isBought,
      isFavorite,
    } = req.body;

    const genreArray = genre
      ? Array.isArray(genre)
        ? genre
        : [genre]
      : book.genre;

    // Validar géneros existen (puedes optimizar esta consulta)
    for (const g of genreArray) {
      const genreExists = await Genre.findById(g);
      if (!genreExists) {
        return res.status(400).json({ message: `Genre not found: ${g}` });
      }
    }

    if (author) {
      const authorExists = await Author.findById(author);
      if (!authorExists) {
        return res.status(400).json({ message: "Author not found" });
      }
    }

    // Normalizar tipos
    price = price !== undefined ? Number(price) : book.price;
    isBought =
      isBought === "true" ? true : isBought === "false" ? false : book.isBought;
    isFavorite =
      isFavorite === "true"
        ? true
        : isFavorite === "false"
        ? false
        : book.isFavorite;
    const imageUrl = req.file ? req.file.path : book.imageUrl;

    const dataToUpdate = {
      title: title ?? book.title,
      author: author ?? (book.author ? book.author.toString() : undefined),
      genre: genreArray.map(g => g.toString()),
      description: description ?? book.description,
      price,
      isBought,
      isFavorite,
      imageUrl,
      owner: book.owner ? book.owner.toString() : undefined,
    };
    

    // Validar con Zod
    bookSchema.parse(dataToUpdate);

    const updatedBook = await Book.findByIdAndUpdate(id, dataToUpdate, {
      new: true,
    });

    res.json(updatedBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    next(error);
  }
});

//* Delete book
router.delete("/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
  
      const deletedBook = await Book.findByIdAndDelete(id);
  
      if (!deletedBook) {
        return res.status(404).json({ message: "Book not found" });
      }
  
      res.json({ message: "Book deleted successfully", book: deletedBook });
    } catch (error) {
      next(error);
    }
  });

module.exports = router;