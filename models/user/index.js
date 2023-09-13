import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  dateOfBirth: Date,
  rating: {
    quality: Number,
    punctuality: Number,
    friendliness: Number,
  },
  ratingCount: Number,
  matchesPlayed: Number,
  matchesSubscribed: Number,
  profilePicture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pictures",
  },
  matches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matches",
    },
  ],
  description: String,
});

const UserModel = mongoose.model("Users", userSchema);

export default UserModel;
