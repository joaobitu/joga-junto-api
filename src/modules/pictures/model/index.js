import mongoose from "mongoose";

const pictureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  src: {
    type: String,
    required: true,
  },
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
    enum: ["user", "park", "court"],
  },
});

const PictureModel = mongoose.model("Pictures", pictureSchema);

export default PictureModel;
