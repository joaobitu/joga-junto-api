import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true,
    //needs to be unique -> and it is on the database
    maxlength: 254,
    match:
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 128,
    // regex for at least 1 special character, 1 number, 1 uppercase, 1 lowercase
    match: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },

  dateOfBirth: Date,
  currentMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Matches",
  },
  profilePicture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pictures",
  },
  matchHistory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matches",
    },
  ],
  description: {
    // eventually I will need some sort of way to filter out or censor bad words
    type: String,
    maxlength: 500,
  },
  role: {
    type: String,
    enum: ["user", "admin", "serviceprovider"],
    default: "user",
  },
  address: {
    zipCode: Number,
    street: String,
    city: String,
    state: {
      fullName: String,
      abbreviation: String,
    },
    neighborhood: String,
    number: Number,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  credits: {
    available: {
      type: Number,
      default: 0,
    },
    inUse: {
      type: Number,
      default: 0,
    },
  },
});

const UserModel = mongoose.model("Users", userSchema);

export default UserModel;
