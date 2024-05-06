import express from "express";
import ParkModel from "../model/index.js";
import isUserAdmin from "../../../common/middleware/role/index.js";
import coordinateSort from "../../../common/middleware/utility/coordinateSort/index.js";

const router = express.Router();

// getting parks List paginated and by distance
router.get("/", async (req, res) => {
  console.log(req.user)
  const aggregateResults = await ParkModel.aggregate(
    coordinateSort(Number(req.query.lng), Number(req.query.lat), {
      o: Number(req.query.o) || 1,
      p: Number(req.query.p) || 1,
      t: Number(req.query.t) || 10,
    })
  );

  const aggregateResultsWithFormattedAddress = aggregateResults.map((park) => ({
    ...park,
    formattedaddress: `${park.address.street}, ${park.address.number} - ${park.address.neighborhood}, ${park.address.city} - ${park.address.state.abbreviation}`,
    id: park._id,
  }));

  const totalParks = await ParkModel.countDocuments();

  const result = {
    data: aggregateResultsWithFormattedAddress,
    pagination: {
      records: totalParks,
      page: Number(req.query.p) || 1,
      totalPages: Math.ceil(totalParks / (Number(req.query.t) || 10)),
    },
  };

  res.send(result);
});
//get park by id
router.get("/:id", getPark, (req, res) => {
  res.send(res.park);
});

//get parkThumbnail by parkId
router.get("/:id/thumbnail", getPark, (req, res) => {
  res.send({
    thumbnailPhoto: res.park.pictures[0],
    formattedAddress: res.park.formattedaddress,
    name: res.park.name,
  });
});
/**
 For now, only admin users will be able to create, edit and delete parks.
 **/

// editing a park by id
router.patch("/:id", [getPark, isUserAdmin], async (req, res) => {
  const fieldsToUpdate = req.body;
  // seems to be updating correctly but not returning an error when the field is not found
  for (let field in fieldsToUpdate) {
    res.park[field] = fieldsToUpdate[field];
  }

  try {
    const updated = await res.park.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//creating a park
router.post("/", async (req, res) => {
  const park = new ParkModel({
    address: {
      zipCode: req?.body?.address?.zipCode,
      street: req?.body?.address?.street,
      city: req?.body?.address?.city,
      state: {
        fullName: req?.body?.address?.state?.fullName,
        abbreviation: req?.body?.address?.state?.abbreviation,
      },
      neighborhood: req?.body?.address?.neighborhood,
      number: req?.body?.address?.number,
    },
    location: {
      type: "Point",
      coordinates: req?.body?.location?.coordinates,
    },
    description: req?.body?.description,
    name: req?.body?.name,
    functioningHours: {
      opening: req?.body?.functioningHours?.opening,
      closing: req?.body?.functioningHours?.closing,
    },
    parkType: req?.body?.parkType,
    pictures: req?.body?.pictures, // this would be another endpoint that I'd call to save the pictures
    courts: req?.body?.courts,
  });

  try {
    const newPark = await park.save();
    res.status(201).json(newPark);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// deleting a park
router.delete("/:id", [getPark, isUserAdmin], (req, res) => {
  try {
    res.park.deleteOne();
    res.json({ message: "Deleted park" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getPark(req, res, next) {
  let park;
  try {
    park = await ParkModel.findById(req.params.id);
    if (park == null) {
      return res.status(404).json({ message: "Cannot find park" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.park = park;
  next();
}

export default router;
