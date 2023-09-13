import mongoose from "mongoose";

const pictureSchema = new mongoose.Schema({
  url: String,
  alt: String,
  type: {
    type: "thumbnail" | "regular",
    default: "regular",
  },
});

const PictureModel = mongoose.model("Pictures", pictureSchema);

export default PictureModel;
