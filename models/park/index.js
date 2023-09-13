import mongoose from "mongoose";

const parkSchema = new mongoose.Schema({
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
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  description: String,
  matches: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matches",
    },
  ],
  name: String,
  functioningHours: {
    opening: String,
    closing: String,
  },
  parkType: String,
  pictures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pictures",
    },
  ],
  courts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courts",
    },
  ],
  rating: Number,
  ratingCount: Number,
});

// virtual formatted address
parkSchema.virtual("formattedaddress").get(function () {
  return `${this.address.street}, ${this.address.number} - ${this.address.neighborhood}, ${this.address.city} - ${this.address.state.abbreviation}`;
});

parkSchema.set("toJSON", { virtuals: true });

const ParkModel = mongoose.model("Parks", parkSchema);

export default ParkModel;
