import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  name: String,
  parkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parks",
    required: true,
  },
  pictures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pictures",
    },
  ],
  rating: {
    type: Number,
    default: 0,
  },
  ratingCount: Number,
  genre: String,
  matches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matches",
    },
  ],
  capacity: {
    type: Number,
    min: 6,
    max: 22,
    required: true,
  },
});

const CourtModel = mongoose.model("Courts", courtSchema);

export default CourtModel;
