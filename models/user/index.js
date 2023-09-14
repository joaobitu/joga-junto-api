import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    //needs to be unique
  },
  password: String,
  dateOfBirth: Date,
  rating: {
    quality: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    punctuality: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    friendliness: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  matchesPlayed: {
    type: Number,
    default: 0,
  },
  matchesSubscribed: {
    type: Number,
    default: 0,
  },
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
  description: String, // need to add constraints here
});

const UserModel = mongoose.model("Users", userSchema);

export default UserModel;
