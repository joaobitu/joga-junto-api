import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  parkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Parks",
  },
  courtId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Courts",
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  ],
  date: Date,
  note: {
    type: String,
    maxlength: 500,
  },
});

const MatchModel = mongoose.model("Matches", matchSchema);

export default MatchModel;
