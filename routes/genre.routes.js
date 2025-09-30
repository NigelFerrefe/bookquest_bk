const express = require("express");
const router = express.Router();
const Genre = require("../models/genre.model");
const Book = require("../models/books.model");
const { z } = require("zod");
const { genreSchema } = require("../schemas/genre.schema");
const { buildPagination } = require("../utils/pagination");

//Create a new genre
router.post("/", async (req, res) => {
  try {
    //*Zod validation
    const { name } = genreSchema.parse(req.body);

    const existingGenre = await Genre.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existingGenre) {
      return res.status(409).json({ message: "This genre already exists" });
    }
    const userId = req.payload._id;

    const newGenre = new Genre({ name, owner: userId });
    await newGenre.save();

    res.status(201).json(newGenre);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Enviando error Zod a cliente", error.issues);
      return res.status(400).json({ errors: error.issues });
    }
    res.status(500).json({ message: "Error creating the genre" });
  }
});

//Get all genres
router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const search = req.query.search?.trim() || "";

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await Genre.countDocuments(query);

    const genres = await Genre.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const pagination = buildPagination({
      totalItems: total,
      currentPage: page,
      perPage,
    });

    res.status(200).json({ data: genres, pagination });
  } catch (error) {
    next(error);
  }
});

//Get all books from genre
router.get("/:id/books", async (req, res, next) => {
  const genreId = req.params.id;
  const userId = req.payload._id;

  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const search = req.query.search?.trim() || "";

    const query = { genre: genreId, owner: userId };
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    const total = await Book.countDocuments(query);

    const books = await Book.find(query)
      .populate("author", "name")
      .populate("genre", "name")
      .skip((page - 1) * perPage)
      .limit(perPage);

    const pagination = buildPagination({
      totalItems: total,
      currentPage: page,
      perPage,
    });

    res.status(200).json({ data: books, pagination });
  } catch (error) {
    next(error);
  }
});

//Update a genre
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = genreSchema.parse(req.body);

    const existingGenre = await Genre.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existingGenre && existingGenre._id.toString() !== id) {
      return res.status(409).json({ message: "This genre already exists" });
    }

    const updatedGenre = await Genre.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );
    if (!updatedGenre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    res.status(200).json(updatedGenre);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    next(error);
  }
});

// Delete a genre
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedGenre = await Genre.findByIdAndDelete(id);

    if (!deletedGenre) {
      return res.status(404).json({ message: "Genre not found" });
    }

    res
      .status(200)
      .json({ message: "Genre deleted successfully", genre: deletedGenre });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
