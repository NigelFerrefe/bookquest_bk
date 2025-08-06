const express = require("express");
const router = express.Router();
const Author = require("../models/author.model");

//Create a new author
router.post("/", async (req, res) => {
    try {
      let { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
  
      // Normalizar: primera letra mayúscula, resto minúsculas
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

      // Comprobar si ya existe
      const existingAuthor = await Author.findOne({ name });
      if (existingAuthor) {
        return res.status(409).json({ message: "This author already exists" });
      }
  
      const newAuthor = new Author({ name });
      await newAuthor.save();
  
      res.status(201).json(newAuthor);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating the author" });
    }
  });

//Get all authors
router.get("/", async (req, res) => {
    try {
        const authors = await Author.find();
        res.status(200).json(authors);
    } catch (error) {
        next(error);
    }
});


module.exports = router;