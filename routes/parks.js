import express from "express";
import ParkThumbnailModel from "../models/parkThumbnail/parkThumbnail.js";
const router = express.Router();

// getting all
router.get("/", async (req, res) => {
  try {
    const parkThumbnails = await ParkThumbnailModel.find();
    res.json(parkThumbnails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", getParkThumbnail, (req, res) => {
  res.send(res.parkThumbnail);
});

//creating one
router.post("/", async (req, res) => {
  const parkThumbnail = new ParkThumbnailModel({
    genre: req.body.genre,
    parkName: req.body.parkName,
    capacity: req.body.capacity,
    currentPlayers: req.body.currentPlayers,
  });

  try {
    const newParkThumbnail = await parkThumbnail.save();
    res.status(201).json(newParkThumbnail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch("/:id", (req, res) => {
  res.send(req.params.id);
});

router.delete("/:id", getParkThumbnail, (req, res) => {
  try {
    res.parkThumbnail.deleteOne();
    res.json({ message: "Deleted parkThumbnail" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getParkThumbnail(req, res, next) {
  let parkThumbnail;
  try {
    parkThumbnail = await ParkThumbnailModel.findById(req.params.id);
    if (parkThumbnail == null) {
      return res.status(404).json({ message: "Cannot find parkThumbnail" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.parkThumbnail = parkThumbnail;
  next();
}

export default router;
