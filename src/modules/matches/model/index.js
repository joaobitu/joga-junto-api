import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  courtId: String,
  park: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parks",
    required: true,
  },
  players: {
    starters: {
      type: [
        {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
          },
          creditsOffered: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    subs: {
      type: [
        {
          id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
          },
          creditsOffered: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
  },
  playersNeeded: {
    starters: {
      type: Number,
      min: 6,
      max: 22,
      required: true,
    },
    subs: {
      type: Number,
      min: 0,
      max: 11,
      required: true,
    },
  },
  startTime: {
    type: Date,
    required: true,
    validate: function (input) {
      // needs to be at least 1 hour in the future
      return input.getTime() > Date.now() + 3600000;
    },
    message: "Match needs to be at least 1 hour in the future",
  },
  endTime: {
    type: Date,
    required: true,
    validate: function (input) {
      // needs to be at least 1:30 hours in the future and can't be before the start time
      return (
        input.getTime() > Date.now() + 5400000 &&
        input.getTime() > this.startTime.getTime()
      );
    },
    message:
      "End time needs to be at least 1:30 hours in the future and can't be before the start time",
  },
  note: {
    type: String,
    maxlength: 500,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  createdAt: {
    type: Date, // Date type
    default: Date.now, // A default value
  },
  creditsPerHour: {
    type: Number,
    min: 800,
    max: 5000,
    required: true,
  },
});

matchSchema.pre("save", function (next) {
  if (this.isNew) {
    this.players.starters.push({
      id: this.owner,
    });
  }
  next();
});

matchSchema.set("toJSON", { virtuals: true });

matchSchema.virtual("totalCreditsNeeded").get(function () {
  const duration = this.endTime - this.startTime;
  const hours = duration / 3600000;
  return hours * this.creditsPerHour;
});

matchSchema.virtual("status").get(function () {
  const now = new Date();
  const matchDate = new Date(this.date);
  const matchDateEnd = new Date(matchDate.getTime() + this.duration * 3600000);
  if (now < matchDate) {
    return "upcoming";
  } else if (now > matchDateEnd) {
    return "finished";
  } else if (now >= matchDate && now <= matchDateEnd) {
    return "ongoing";
  } else {
    return "unknown";
  }
});

matchSchema.virtual("totalCreditsOffered").get(function () {
  let total = 0;
  this.players.starters.forEach((player) => {
    total += player.creditsOffered;
  });
  this.players.subs.forEach((player) => {
    total += player.creditsOffered;
  });
  return total;
});

const MatchModel = mongoose.model("Matches", matchSchema);

export default MatchModel;
