const { Schema, model } = require("mongoose");

const genreSchema = new Schema(
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

const Genre = model("Genre", genreSchema);

module.exports = Genre;
