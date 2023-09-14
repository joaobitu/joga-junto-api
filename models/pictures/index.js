import mongoose from "mongoose";

const pictureSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  alt: String,
  type: {
    type: String,
    default: "regular",
    enum: ["regular", "thumbnail", "profile"],
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  module: {
    type: String,
    required: true,
    enum: ["user", "park", "match", "court"],
  },
});

const PictureModel = mongoose.model("Pictures", pictureSchema);

export default PictureModel;
