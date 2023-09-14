import express from "express";
import PictureModel from "../../models/pictures/index.js";
const router = express.Router();

// get picture by id
router.get("/:id", getPicture, (req, res) => {
  res.send(res.picture);
});

// creating a picture
router.post("/", async (req, res) => {
  const picture = new PictureModel({
    url: req?.body?.url,
    alt: req?.body?.alt,
    type: req?.body?.type,
    parentId: req?.body?.parentId,
    module: req?.body?.module,
  });

  try {
    const newPicture = await picture.save();
    res.status(201).json(newPicture);
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
