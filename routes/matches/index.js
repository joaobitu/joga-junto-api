import express from "express";
import MatchModel from "../../models/match/index.js";
import mongoose from "mongoose";
import CourtModel from "../../models/courts/index.js";
const router = express.Router();

// get match list by court id
router.get("/court/:id", getMatchListByCourtId, async (req, res) => {
  res.send(res.match);
});

//get match by id
router.get("/:id", getMatch, (req, res) => {
  res.send(res.match);
});

//add player to match
router.patch("/:id/join", getMatch, async (req, res) => {
  const playerId = req?.user?.id;

  if (!res.match.players.includes(playerId)) {
    res.match.players.push(playerId);
  }

  try {
    const updated = await res.match.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//remove player from match
router.patch("/:id/leave", getMatch, async (req, res) => {
  const playerId = req?.user?.id;

  if (res.match.players.includes(playerId)) {
    res.match.players.pull(playerId);
  }

  try {
    const updated = await res.match.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//creating a match
router.post("/", async (req, res) => {
  //TO-DO: this needs to become a transaction
  const match = new MatchModel({
    courtId: req?.body?.courtId,
    date: req?.body?.date,
    duration: req?.body?.duration,
    note: req?.body?.note,
    owner: req?.user?.id,
  });

  try {
    const savedMatch = await match.save();

    // Update the CourtModel to push the match id
    await CourtModel.findByIdAndUpdate(req?.body?.courtId, {
      $push: { matches: savedMatch._id },
    }).exec();

    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//updating a match
router.patch("/:id", getMatch, async (req, res) => {
  const fieldsToUpdate = req.body;

  for (let field in fieldsToUpdate) {
    res.match[field] = fieldsToUpdate[field];
  }

  try {
    const updated = await res.match.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//deleting a match
router.delete("/:id", getMatch, async (req, res) => {
  try {
    await res.match.deleteOne();

    await CourtModel.findByIdAndUpdate(res.match.courtId, {
      $pull: { matches: res.match._id },
    });
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

async function getMatchListByCourtId(req, res, next) {
  let match;
  try {
    match = await MatchModel.find({ courtId: req.params.id });
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
