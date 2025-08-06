const { Schema, model } = require("mongoose");

const bookSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required."],
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "Author",
    required: [true, "Author is required."],
  },
  genre: {
    type: Schema.Types.ObjectId,
    ref: "Genre",
    required: [true, "Genre is required."],
  },
  imageUrl: {
    type: String,
  },
  description: {
    type: String,
  },
  isBought: {
    type: Boolean,
    default: false,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, {
  timestamps: true, 
});

const Book = model("Book", bookSchema);

module.exports = Book;
