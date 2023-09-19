import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Courts",
    required: true,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  ],
  date: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    min: 1,
    max: 4,
    required: true,
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
});

matchSchema.set("toJSON", { virtuals: true });

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

const MatchModel = mongoose.model("Matches", matchSchema);

export default MatchModel;
