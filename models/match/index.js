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
  date: Date,
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

const MatchModel = mongoose.model("Matches", matchSchema);

export default MatchModel;
