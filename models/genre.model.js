const { Schema, model } = require("mongoose");

const genreSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
    },
  },
  {
    timestamps: true,
  }
);

const Genre = model("Genre", genreSchema);

module.exports = Genre;
