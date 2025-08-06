const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});


const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: objectIdSchema,
  genre: z.array(objectIdSchema).min(1, "At least one genre is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  isBought: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  price: z.number().optional(),
  owner: objectIdSchema,
});

module.exports = { bookSchema };
