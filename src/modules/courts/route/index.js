import express from "express";
import CourtModel from "../model/index.js";
import isUserAdmin from "../../../common/middleware/role/index.js";
import ParkModel from "../../parks/model/index.js";

const router = express.Router();

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
  // needs to eventually become a transaction here
  const court = new CourtModel({
    parkId: req?.body?.parkId,
    name: req?.body?.name,
    courtType: req?.body?.courtType,
    genre: req?.body?.genre,
    // pictures: this will be another endpoint that I'd call to save the pictures
  });

  try {
    const newCourt = await court.save();

    await ParkModel.findByIdAndUpdate(req?.body?.parkId, {
      $push: { courts: newCourt._id },
    });

    res.status(201).json(newCourt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//updating a court
router.patch("/:id", [getCourt, isUserAdmin], async (req, res) => {
  const fieldsToUpdate = req.body;

  for (let field in fieldsToUpdate) {
    res.court[field] = fieldsToUpdate[field];
  }

  try {
    const updated = await res.court.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//deleting a court
router.delete("/:id", [getCourt, isUserAdmin], async (req, res) => {
  try {
    await res.court.remove();

    await ParkModel.findByIdAndUpdate(res.court.parkId, {
      $pull: { courts: res.court._id },
    });
    res.json({ message: "Deleted Court" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getCourt(req, res, next) {
  let court;
  try {
    court = await CourtModel.findById(req.params.id)
      .populate({
        path: "matches",
        populate: {
          path: "players",
          select: "name",
        },
      })
      .save();
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
