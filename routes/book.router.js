const express = require("express");
const router = express.Router();
const Book = require("../models/books.model");
const Genre = require("../models/genre.model");
const Author = require("../models/author.model");

//Create a new book
router.post("/", async (req, res, next) => {
    try {
      const { title, author, genre, description, price, imageUrl, isBought, isFavorite } = req.body;
  
      const genreExists = await Genre.findById(genre);
      if (!genreExists) {
        return res.status(400).json({ message: "Genre not found" });
      }

      const authorExists = await Author.findById(author);
      if (!authorExists) {
        return res.status(400).json({ message: "Author not found" });
      }
  
      const newBook = await Book.create({ title, author, genre, description, price, imageUrl, owner: req.payload._id, isBought, isFavorite });
      res.status(201).json(newBook);
    } catch (error) {
      next(error);
    }
  });

  
//Get wishlist books
router.get("/wishlist", async (req, res, next) => {
      try {
          const userId = req.payload._id;
          
          const wishlistBooks = await Book.find({
              owner: userId,
              isBought: false,
            }).populate("author genre");
            
            res.status(200).json(wishlistBooks);
        } catch (error) {
            next(error);
        }
    });

//Get purchased books
    router.get("/purchased", async (req, res, next) => {
        try {
            const userId = req.payload._id;
            
            const purchasedBooks = await Book.find({
                owner: userId,
                isBought: true,
            }).populate("author genre");
            
            res.status(200).json(purchasedBooks);
        } catch (error) {
            next(error);
        }
    })
    
//Get favorite books
router.get("/favorites", async (req, res, next) => {
    try {
        const userId = req.payload._id;
        
        const favoriteBooks = await Book.find({
            owner: userId,
            isFavorite: true,
        }).populate("author genre");
        
        res.status(200).json(favoriteBooks);
    } catch (error) {
        next(error);
    }
})
    module.exports = router;