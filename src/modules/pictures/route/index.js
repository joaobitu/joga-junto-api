import express from "express";
import PictureModel from "../model/index.js";
import upload from "../../../config/multer/index.js";
import { gcBucket } from "../../../config/multer/index.js";
import { uuidv4 } from "../../../common/middleware/utility/coordinateSort/index.js";
import ParkModel from "../../parks/model/index.js";
const router = express.Router();

// get picture by id
router.get("/:id", getPicture, (req, res) => {
  res.send(res.picture);
});

// get pictures by parentId
router.get("/parent/:id", async (req, res) => {
  try {
    const pictures = await PictureModel.find({ parentId: req.params.id });
    res.json(pictures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// creating a picture
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { name, type, parentId, module } = req.body;
    const file = req.file;

    const blob = gcBucket.file(file.originalname + uuidv4());
    const blobStream = blob.createWriteStream();

    blobStream.on("finish", async () => {
      const picture = new PictureModel({
        name: name,
        type: type,
        parentId: parentId,
        module: module,
        src: `https://storage.googleapis.com/${gcBucket.name}/${blob.name}`,
      });
      await picture.save();

      res.json(picture);

      //TO-DO need to update also to allow for courts and users
      if (module === "park") {
        const park = await ParkModel.findById(parentId);
        park.pictures.push(picture.src);
        await park.save();
      }
    });
    blobStream.end(file.buffer);
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
