import express from "express";
import MatchModel from "../model/index.js";
import UserModel from "../../users/model/index.js";
import ParkModel from "../../parks/model/index.js";

const router = express.Router();

//get match by id
router.get("/:id", getMatch, (req, res) => {
  res.send(res.match);
});

//get unavailable match times by date and court
router.get("/unavailable-timeslots", unavailableTimeslots, async (req, res) => {
  res.send(res.unavailableTimeslots);
});

// get match list
router.get("/", async (req, res) => {
  const aggregateResults = await MatchModel.find(
    {
      status: "upcoming",
      isMatchFromSP: false,
      // show non-full matches
      $expr: {
        $lt: ["$players.starters", "$playersNeeded.starters"],
        $lt: ["$players.subs", "$playersNeeded.subs"],
      },
    },
    null,
    {
      skip: Number(req.query.t) * (Number(req.query.p) - 1) || 0,
      limit: Number(req.query.t) || 10,
      // sort by matches with the most players and then by the closest to the current time
      sort: "-players.starters.length -players.subs.length startTime",
    }
  );

  const totalMatches = await MatchModel.countDocuments();

  const result = {
    data: aggregateResults,
    pagination: {
      records: totalMatches,
      page: Number(req.query.p) || 1,
      totalPages: Math.ceil(totalMatches / (Number(req.query.t) || 10)),
    },
  };

  res.send(result);
});

//join a match
router.patch("/:id/join", getMatch, async (req, res) => {
  const playerId = req?.user?.id;
  const creditsOffered = req?.body?.creditsOffered;

  const updateUserModel = () => {
    req.user.currentMatch = res.match._id;
    req.user.credits.inUse += creditsOffered || 0;
    req.user.credits.available -= creditsOffered || 0;
  };

  if (req.user.currentMatch) {
    return res.status(400).json({
      message: `You are already in a match, please leave your current match before joining another one`,
    });
  }

  if (
    res.match.players.starters.some((player) => player.id === playerId) ||
    res.match.players.subs.some((player) => player.id === playerId)
  ) {
    if (res.match.players.starters.length < res.match.playersNeeded.starters) {
      res.match.players.starters.push({
        id: playerId,
        creditsOffered: creditsOffered || 0,
      });
      updateUserModel();
    } else if (res.match.players.subs.length < res.match.playersNeeded.subs) {
      res.match.players.subs.push({
        id: playerId,
        creditsOffered: creditsOffered || 0,
      });
      updateUserModel();
    } else {
      return res.status(400).json({ message: "Match is full" });
    }
  }

  try {
    const updated = await res.match.save();
    await req.user.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//leave from match
router.patch("/:id/leave", getMatch, async (req, res) => {
  const playerId = req?.user?.id;

  const isPlayerAStarter = res.match.players.starters.some(
    (player) => player.id === playerId
  );
  const isPlayerASub = res.match.players.subs.some(
    (player) => player.id === playerId
  );

  if (res.user.currentMatch !== res.match._id) {
    return res.status(400).json({
      message: `You are not in this match`,
    });
  }

  const updateUserModel = () => {
    req.user.currentMatch = null;
    req.user.credits.available += req.user.credits.inUse;
    req.user.credits.inUse = 0;
  };

  if (isPlayerAStarter) {
    const player = res.match.players.starters.find(
      (player) => player.id === playerId
    );
    res.match.players.starters.pull(player);
  } else if (isPlayerASub) {
    const player = res.match.players.subs.find(
      (player) => player.id === playerId
    );
    res.match.players.subs.pull(player);
  }

  updateUserModel();

  try {
    const updated = await res.match.save();
    await req.user.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//kick player from match
router.patch("/:id/kick/:playerId", getMatch, async (req, res) => {
  const isOwner = req?.user?.id === res.match.owner;
  const playerToKickId = req.params.playerId;
  const playerToKick = await UserModel.findById(playerToKickId);

  if (!isOwner) {
    // if you are not the owner you can't kick players
    return res.status(401).json({
      message:
        "Unauthorized, only admin is allowed to remove players from match",
    });
  }

  if (playerToKick.currentMatch !== res.match._id) {
    return res.status(400).json({
      message: `This player is not in this match`,
    });
  }
  const updateUserModel = () => {
    playerToKick.currentMatch = null;
    playerToKick.credits.available += playerToKick.credits.inUse;
    playerToKick.credits.inUse = 0;
  };
  if (
    res.match.players.starters.some((player) => player.id === playerToKickId)
  ) {
    const player = res.match.players.starters.find(
      (player) => player.id === playerToKickId
    );
    res.match.players.starters.pull(player);
  } else if (
    res.match.players.subs.some((player) => player.id === playerToKickId)
  ) {
    const player = res.match.players.subs.find(
      (player) => player.id === playerToKickId
    );
    res.match.players.subs.pull(player);
  }

  updateUserModel();

  try {
    const updated = await res.match.save();

    await playerToKick.save();

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//change the credits offered by a player
router.patch("/:id/credits/:playerId", getMatch, async (req, res) => {
  const playerId = req.params.playerId;
  const creditsOffered = req.body.creditsOffered;

  const isPlayerAStarter = res.match.players.starters.some(
    (player) => player.id === playerId
  );
  const isPlayerASub = res.match.players.subs.some(
    (player) => player.id === playerId
  );

  const user = UserModel.findById(playerId);

  if (user.credits.available + user.credits.inUse < creditsOffered) {
    return res.status(400).json({
      message: "You don't have enough credits to offer that amount",
    });
  }

  const updateUserModel = () => {
    if (req.user.inUse < creditsOffered) {
      user.credits.available -= creditsOffered - user.inUse;
      user.credits.inUse = creditsOffered;
    } else {
      user.credits.available += user.inUse - creditsOffered;
      user.credits.inUse = creditsOffered;
    }
  };

  if (!isPlayerAStarter && !isPlayerASub) {
    return res.status(400).json({
      message: `This player is not in this match`,
    });
  }

  if (isPlayerAStarter) {
    const player = res.match.players.starters.find(
      (player) => player.id === playerId
    );
    player.creditsOffered = creditsOffered;
  } else if (isPlayerASub) {
    const player = res.match.players.subs.find(
      (player) => player.id === playerId
    );
    player.creditsOffered = creditsOffered;
  }

  updateUserModel();

  try {
    const updated = await res.match.save();
    await user.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//creating a match
router.post("/", unavailableTimeslots, async (req, res) => {
  //TO-DO: this needs to become a transaction
  const park = await ParkModel.findById(req?.body?.park);

  const court = park?.courts.find((court) => court._id == req?.body?.courtId);

  if (req?.body?.playersNeeded?.starters > court?.capacity) {
    return res.status(400).json({
      message: `You can't have more starters than the court capacity`,
    });
  }

  const match = new MatchModel({
    courtId: req?.body?.courtId,
    park: req?.body?.park,
    startTime: req?.body?.startTime,
    endTime: req?.body?.endTime,
    duration: req?.body?.duration,
    playersNeeded: req?.body?.playersNeeded,
    note: req?.body?.note,
    owner: req?.user?.id || req?.body?.owner,
  });

  if (res.unavailableTimeslots) {
    const isUnavailable = res.unavailableTimeslots.some(
      (unavailableTimeslot) => {
        return (
          match.startTime >= unavailableTimeslot.startTime &&
          match.startTime < unavailableTimeslot.endTime
        );
      }
    );

    if (isUnavailable) {
      return res.status(400).json({
        message: `This timeslot is already booked`,
      });
    }
  }

  try {
    const savedMatch = await match.save();

    // Update the ParkModel to push the match id
    await ParkModel.findByIdAndUpdate(
      req?.body?.park,
      {
        $push: { "courts.$[court].matches": savedMatch._id },
      },
      {
        arrayFilters: [{ "court._id": req?.body?.courtId }],
      }
    ).exec();

    res.status(201).json(savedMatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//creating a match from service provider
router.post("/sp", unavailableTimeslots, async (req, res) => {
  if (req?.user?.role !== "serviceprovider") {
    return res.status(401).json({
      message: `Unauthorized, only service providers can create matches from this endpoint`,
    });
  }

  const match = new MatchModel({
    courtId: req?.body?.courtId,
    park: req?.body?.park,
    startTime: req?.body?.startTime,
    endTime: req?.body?.endTime,
    playersNeeded: {
      starters: 6,
      subs: 6,
    },
    owner: req?.user?.id || req?.body?.owner,
  });

  if (res.unavailableTimeslots) {
    const isUnavailable = res.unavailableTimeslots.some(
      (unavailableTimeslot) => {
        return (
          match.startTime >= unavailableTimeslot.startTime &&
          match.startTime < unavailableTimeslot.endTime
        );
      }
    );

    if (isUnavailable) {
      return res.status(400).json({
        message: `This timeslot is already booked`,
      });
    }
  }

  try {
    const savedMatch = await match.save();

    // Update the ParkModel to push the match id

    await ParkModel.findByIdAndUpdate(
      req?.body?.park,
      {
        $push: { "courts.$[court].matches": savedMatch._id },
      },
      {
        arrayFilters: [{ "court._id": req?.body?.courtId }],
      }
    ).exec();

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

//deleting a match from service provider
router.delete("/sp/:id", getMatch, async (req, res) => {
  if (req.user.role !== "serviceprovider") {
    return res.status(401).json({
      message: `Unauthorized, only service providers can delete matches from this endpoint`,
    });
  }

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

async function unavailableTimeslots(req, res, next) {
  const { date, courtId } = req.query;
  // checks the list of matches for the court on the date

  const matches = await MatchModel.find({
    courtId,
    startTime: { $gte: new Date(date) },
  });

  const unavailableTimeslots = matches.map((match) => {
    return {
      startTime: match.startTime,
      endTime: match.endTime,
    };
  });

  res.unavailableTimeslots = unavailableTimeslots;
  next();
}

export default router;
