const express = require("express");
const router = express.Router();
const Author = require("../models/author.model");
const Book = require("../models/books.model");
const { buildPagination } = require("../utils/pagination");
const { z } = require("zod");
const { authorSchema } = require("../schemas/author.schema");

//Create a new author
router.post("/", async (req, res) => {
  try {
    const { name } = authorSchema.parse(req.body);

    const existingAuthor = await Author.findOne({ name });
    if (existingAuthor) {
      return res.status(409).json({ message: "This author already exists" });
    }

    const newAuthor = new Author({ name });
    await newAuthor.save();

    res.status(201).json(newAuthor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Enviando error Zod a cliente", error.issues);
      return res.status(400).json({ errors: error.issues });
    }
    res.status(500).json({ message: "Error creating the author" });
  }
});

//Get all authors
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const search = req.query.search?.trim() || "";

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await Author.countDocuments(query);

    const authors = await Author.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const pagination = buildPagination({
      totalItems: total,
      currentPage: page,
      perPage,
    });

    res.status(200).json({ data: authors, pagination });
  } catch (error) {
    next(error);
  }
});

//Get all books from author
router.get("/:id/books", async (req, res, next) => {
  const authorId = req.params.id;
  try {
    const books = await Book.find({ author: authorId })
      .populate("author", "name")
      .populate("genre", "name");

    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

//update an author
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = authorSchema.parse(req.body);

    const existingAuthor = await Author.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingAuthor && existingAuthor._id.toString() !== id) {
      return res.status(409).json({ message: "This author already exist" });
    }

    const updatedAuthor = await Author.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updatedAuthor) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.status(200).json(updatedAuthor);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    next(error);
  }
});

// Delete an author
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedAuthor = await Author.findByIdAndDelete(id);

    if (!deletedAuthor) {
      return res.status(404).json({ message: "Author not found" });
    }

    res
      .status(200)
      .json({ message: "Author deleted successfully", genre: deletedAuthor });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
