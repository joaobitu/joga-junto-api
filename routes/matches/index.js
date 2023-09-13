import express from "express";
import MatchModel from "../../models/match/index.js";
const router = express.Router();

// getting all matches
router.get("/", async (req, res) => {
  try {
    const match = await MatchModel.find();
    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get match by id
router.get("/:id", getMatch, (req, res) => {
  res.send(res.match);
});

//creating a match
router.post("/", async (req, res) => {
  console.log(req?.body);
  const match = new MatchModel({
    parkId: req?.body?.parkId,
    courtId: req?.body?.courtId,
    players: req?.body?.players,
    date: req?.body?.date,
    note: req?.body?.note,
  });

  try {
    const newMatch = await match.save();
    res.status(201).json(newMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//updating a match
router.patch("/:id", getMatch, async (req, res) => {
  if (req.body.parkId != null) {
    res.match.parkId = req.body.parkId;
  }
  if (req.body.courtId != null) {
    res.match.courtId = req.body.courtId;
  }
  if (req.body.players != null) {
    res.match.players = req.body.players;
  }
  if (req.body.date != null) {
    res.match.date = req.body.date;
  }
  if (req.body.note != null) {
    res.match.note = req.body.note;
  }
  try {
    const updatedMatch = await res.match.save();
    res.json(updatedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//deleting a match
router.delete("/:id", getMatch, async (req, res) => {
  try {
    await res.match.deleteOne();
    res.json({ message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//middleware
async function getMatch(req, res, next) {
  let match;
  try {
    match = await MatchModel.findById(req.params.id);
    if (match == null) {
      return res.status(404).json({ message: "Cannot find match" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.match = match;
  next();
}

export default router;
