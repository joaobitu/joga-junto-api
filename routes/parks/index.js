import express from "express";
import ParkModel from "../../models/park/index.js";
import isUserAdmin from "../../middleware/role/index.js";
import pagination from "../../middleware/pagination/index.js";
import sortByGeoDistanceMiddleware from "../../middleware/pagination/index.js";
const router = express.Router();

// getting all parks
router.get("/", [sortByGeoDistanceMiddleware, pagination], async (req, res) => {
  const paginatedResults = res.paginatedResults; // Retrieve the paginated results from the response
  console.log(res.locals);
  try {
    // Execute the query and fetch the paginated results from the database
    const result = await paginatedResults.results
      .aggregate([res.geoQuery])
      .exec();

    // Send the paginated results to the client
    res.send(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
    //distance: will need to calculate the distance between the user and the park
  });
});
/**
 For now, only admin users will be able to create, edit and delete parks.
 **/

//creating a park
router.post("/", isUserAdmin, async (req, res) => {
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
    coordinates: req?.body?.coordinates,
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
// editing a park by id
router.patch("/:id", [getPark, isUserAdmin], async (req, res) => {
  try {
    //TODO - check if this is the best way to do it
    const updatedPark = await res.park.save();
    res.json(updatedPark);
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
