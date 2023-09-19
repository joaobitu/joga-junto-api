import express from "express";
import PictureModel from "../model/index.js";
import upload from "../../../config/multer/index.js";
const router = express.Router();

// get picture by id
router.get("/:id", getPicture, (req, res) => {
  res.send(res.picture);
});

// creating a picture
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { name, type, parentId, module } = req.body;
    const file = req.file;

    const picture = new PictureModel({
      name: name,
      src: file.path,
      type: type,
      parentId: parentId,
      module: module,
    });

    await picture.save();

    res.json(picture);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// deleting a picture
router.delete("/:id", getPicture, async (req, res) => {
  try {
    await res.picture.deleteOne();
    res.json({ message: "Deleted Picture" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// middleware
async function getPicture(req, res, next) {
  let picture;
  try {
    picture = await PictureModel.findById(req.params.id);
    if (picture == null) {
      return res.status(404).json({ message: "Cannot find picture" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.picture = picture;
  next();
}

export default router;
