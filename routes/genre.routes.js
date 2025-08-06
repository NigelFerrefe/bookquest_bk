const express = require("express");
const router = express.Router();
const Genre = require("../models/genre.model");

//Create a new genre
router.post("/", async (req, res) => {
    try {
      let { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
  
      // Normalizar: primera letra mayúscula, resto minúsculas
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  
      // Comprobar si ya existe
      const existingGenre = await Genre.findOne({ name });
      if (existingGenre) {
        return res.status(409).json({ message: "This genre already exists" });
      }
  
      const newGenre = new Genre({ name });
      await newGenre.save();
  
      res.status(201).json(newGenre);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating the genre" });
    }
  });

//Get all genres
router.get("/", async (req, res) => {
    try {
        const genres = await Genre.find();
        res.status(200).json(genres);
    } catch (error) {
        next(error);
    }
});


module.exports = router;