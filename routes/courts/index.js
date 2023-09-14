import express from "express";
import CourtModel from "../../models/courts/index.js";
import isUserAdmin from "../../middleware/role/index.js";
const router = express.Router();

// getting all courts
router.get("/", async (req, res) => {
  try {
    const court = await CourtModel.find();
    res.json(court);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get court by id
router.get("/:id", getCourt, (req, res) => {
  res.send(res.court);
});

// get court list by parkId
router.get("/park/:parkId", getCourtByParkId, (req, res) => {
  res.send(res.court);
});
/**
 * For now, only admin users will be able to create, edit and delete courts.
 */
//creating a court
router.post("/", isUserAdmin, async (req, res) => {
  const court = new CourtModel({
    parkId: req?.body?.parkId,
    name: req?.body?.name,
    courtType: req?.body?.courtType,
    genre: req?.body?.genre,
    // pictures: this will be another endpoint that I'd call to save the pictures
  });

  try {
    const newCourt = await court.save();
    res.status(201).json(newCourt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//updating a court
router.patch("/:id", [getCourt, isUserAdmin], async (req, res) => {
  if (req.body.parkId != null) {
    res.court.parkId = req.body.parkId;
  }
  if (req.body.name != null) {
    res.court.name = req.body.name;
  }
  if (req.body.courtType != null) {
    res.court.courtType = req.body.courtType;
  }
  if (req.body.genre != null) {
    res.court.genre = req.body.genre;
  }
  try {
    const updatedCourt = await res.court.save();
    res.json(updatedCourt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//deleting a court
router.delete("/:id", [getCourt, isUserAdmin], async (req, res) => {
  try {
    await res.court.remove();
    res.json({ message: "Deleted Court" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getCourt(req, res, next) {
  let court;
  try {
    court = await CourtModel.findById(req.params.id);
    if (court == null) {
      return res.status(404).json({ message: "Cannot find court" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.court = court;
  next();
}

//deleting all courts by parkId
router.delete(
  "/park/:parkId/all",
  [getCourtByParkId, isUserAdmin],
  async (req, res) => {
    try {
      await res.court.remove();
      res.json({ message: "Deleted all Courts" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

async function getCourtByParkId(req, res, next) {
  let court;
  try {
    court = await CourtModel.find({ parkId: req.params.parkId });
    if (court == null) {
      return res.status(404).json({ message: "Cannot find court" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.court = court;
  next();
}

export default router;
