const { Schema, model } = require("mongoose");

const authorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Author = model("Author", authorSchema);

module.exports = Author;
