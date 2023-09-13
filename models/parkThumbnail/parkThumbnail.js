import mongoose from "mongoose";

const parkThumbnailSchema = new mongoose.Schema({
  genre: {
    type: String,
    required: true,
  },
  parkName: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  currentPlayers: {
    type: Number,
    required: true,
  },
});

const ParkThumbnailModel = mongoose.model("ParkThumbnail", parkThumbnailSchema);

export default ParkThumbnailModel;
