import express from "express";
import MatchModel from "../model/index.js";

import CourtModel from "../../courts/model/index.js";
const router = express.Router();

//get match by id
router.get("/:id", getMatch, (req, res) => {
  res.send(res.match);
});

// get match list by court id
router.get("/court/:id", getMatchListByCourtId, async (req, res) => {
  res.send(res.match);
});

//updating match details
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

//join a match
router.patch("/:id/join", getMatch, async (req, res) => {
  const playerId = req?.user?.id;

  if (
    !res.match.players.starters.includes(playerId) &&
    !res.match.players.subs.includes(playerId)
  ) {
    if (res.match.players.starters.length < res.match.playersNeeded.starters) {
      res.match.players.starters.push(playerId);
    } else if (res.match.players.subs.length < res.match.playersNeeded.subs) {
      res.match.players.subs.push(playerId);
    } else {
      return res.status(400).json({ message: "Match is full" });
    }
  }

  try {
    const updated = await res.match.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//leave from match
router.patch("/:id/leave", getMatch, async (req, res) => {
  const playerId = req?.user?.id;

  if (res.match.players.starters.includes(playerId)) {
    res.match.players.starters.pull(playerId);
  } else if (res.match.players.subs.includes(playerId)) {
    res.match.players.subs.pull(playerId);
  } else {
    return res.status(400).json({ message: "Player not in match" });
  }

  try {
    const updated = await res.match.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//kick player from match
router.patch("/:id/kick/:playerId", getMatch, async (req, res) => {
  const isOwner = req?.user?.id === res.match.owner;

  if (!isOwner) {
    // if you are not the owner you can't kick players
    return res.status(401).json({
      message:
        "Unauthorized, only admin is allowed to remove players from match",
    });
  }

  if (res.match.players.starters.includes(req.body.playerId)) {
    res.match.players.starters.pull(req.body.playerId);
  } else if (res.match.players.subs.includes(req.body.playerId)) {
    res.match.players.subs.pull(req.body.playerId);
  } else {
    return res.status(400).json({ message: "Player not in match" });
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
  const court = await CourtModel.findById(req?.body?.courtId);

  if (req.body.playersNeeded.starters > court.capacity) {
    return res.status(400).json({
      message: `You can't have more starters than the court capacity`,
    });
  }

  const match = new MatchModel({
    courtId: req?.body?.courtId,
    startTime: req?.body?.date,
    endTime: req?.body?.date,
    duration: req?.body?.duration,
    playersNeeded: req?.body?.playersNeeded,
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

//deleting a match
router.delete("/:id", getMatch, async (req, res) => {
  if (req.user.id !== req.match.owner) {
    return res
      .status(401)
      .json({ message: "Unauthorized, You may only delete your match" });
  }

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
    match = await MatchModel.findById(req.params.id)
      .populate("courtId")
      .populate({
        path: "owner",
        select: "_id name",
      })
      .populate({
        path: "players",
        populate: {
          path: "starters",
          select: "_id name",
        },
      })
      .populate({
        path: "players",
        populate: {
          path: "subs",
          select: "_id name",
        },
      });
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
