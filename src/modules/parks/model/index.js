import mongoose from "mongoose";

const parkSchema = new mongoose.Schema({
  address: {
    // need to add validation for this, despite that adding a park is an admin-only feature
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
      type: String, // Don't do `{ location: { type: String } }`
      enum: ["Point"], // 'location.type' must be 'Point'
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  description: String,
  name: String,
  functioningHours: {
    opening: String,
    closing: String,
  },
  pictures: [String],
  courts: [
    {
      thumbnail: [
        {
          type: String
        },
      ],
      genre: {
        type: String,
        enum: ["indoor", "beach", "traditional", "society"],
        default: "traditional",
        // required: true,
      },
      matches: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Matches",
        },
      ],
      capacity: {
        type: Number,
        min: 6,
        max: 22,
        // required: true,
      },
      creditsPerHour: {
        type: Number,
        min: 800,
        max: 5000,
        //  required: true,
      },
    },
  ],
});
parkSchema.set("toJSON", { virtuals: true });

// virtual formatted address
parkSchema.virtual("formattedaddress").get(function () {
  return `${this.address.street}, ${this.address.number} - ${this.address.neighborhood}, ${this.address.city} - ${this.address.state.abbreviation}`;
});

parkSchema.index({ location: "2dsphere" });

const ParkModel = mongoose.model("Parks", parkSchema);

export default ParkModel;
