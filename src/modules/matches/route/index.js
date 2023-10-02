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

// get match list by distance
router.get("/", async (req, res) => {
  //TO-DO aggregate bug still here
  //TO-DO need to remove matches that are already finished/started
  //TO-DO need to remove matches that are already full
  //TO-DO need to remove matches that were created by an SP
  const aggregateResults = await MatchModel.aggregate([
    {
      $lookup: {
        from: "parks",
        let: { matchId: "$_id" },
        pipeline: [
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [Number(req.query.lng), Number(req.query.lat)],
              },
              distanceField: "distanceInKilometers",
              distanceMultiplier: 0.001,
              spherical: true,
            },
          },
          {
            $match: {
              $expr: {
                $in: ["$$matchId", "$courts.matches"],
              },
            },
          },
        ],
        as: "park",
      },
    },
    {
      $unwind: "$park",
    },
    {
      $addFields: {
        distanceInKilometers: "$distanceInKilometers",
      },
    },
    // need to sort by distance
    {
      $sort: {
        distanceInKilometers: 1,
      },
    },
  ]);

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

//updating match details
router.patch("/:id", getMatch, async (req, res) => {
  //TO-DO consider if this is needed actually, none of the math updating should be done here, best to delete and create a new match
  if (req.user.id !== req.match.owner) {
    return res
      .status(401)
      .json({ message: "Unauthorized, You may only update your match" });
  }

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
  const creditsOffered = req?.body?.creditsOffered;

  if (
    res.match.players.starters.some((player) => player.id === playerId) ||
    res.match.players.subs.some((player) => player.id === playerId)
  ) {
    if (res.match.players.starters.length < res.match.playersNeeded.starters) {
      res.match.players.starters.push({
        id: playerId,
        creditsOffered: creditsOffered || 0,
      });
    } else if (res.match.players.subs.length < res.match.playersNeeded.subs) {
      res.match.players.subs.push({
        id: playerId,
        creditsOffered: creditsOffered || 0,
      });
    } else {
      return res.status(400).json({ message: "Match is full" });
    }
  }

  try {
    const updated = await res.match.save();
    //TO-DO need to update the user credits from available to inUse
    //TO-DO need to update the user matchesSubscribed
    //TO-DO need to check if the user has enough credits to join the match
    //TO-DO need to check if the user is already in the match
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
  } else {
    return res.status(400).json({ message: "Player not in match" });
  }

  try {
    const updated = await res.match.save();
    //TO-DO need to update the user credits from inUse to available
    //TO-DO need to update the user matchesSubscribed
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//kick player from match
router.patch("/:id/kick/:playerId", getMatch, async (req, res) => {
  const isOwner = req?.user?.id === res.match.owner;
  const playerToKickId = req.params.playerId;

  if (!isOwner) {
    // if you are not the owner you can't kick players
    return res.status(401).json({
      message:
        "Unauthorized, only admin is allowed to remove players from match",
    });
  }

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
  } else {
    return res.status(400).json({ message: "Player not in match" });
  }

  try {
    const updated = await res.match.save();

    //TO-DO need to update the user credits from inUse to available
    //TO-DO need to update the user matchesSubscribed

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
  } else {
    return res.status(400).json({ message: "Player not in match" });
  }

  try {
    const updated = await res.match.save();
    //TO-DO if the user adds more credits than he had previously, remove from available and add to inUse OR if the user removes credits, add to available and remove from inUse
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
