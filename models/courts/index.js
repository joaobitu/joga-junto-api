import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  name: String,
  pictures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pictures",
    },
  ],
  rating: Number,
  ratingCount: Number,
  genre: String,
  matches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matches",
    },
  ],
});

const CourtModel = mongoose.model("Courts", courtSchema);

export default CourtModel;
