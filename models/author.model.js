const { Schema, model } = require("mongoose");

const authorSchema = new Schema(
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

const Author = model("Author", authorSchema);

module.exports = Author;
