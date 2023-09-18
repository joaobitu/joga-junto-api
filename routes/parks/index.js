import express from "express";
import ParkModel from "../../models/park/index.js";
import isUserAdmin from "../../middleware/role/index.js";
import pagination from "../../middleware/pagination/index.js";
import coordinateSort from "../../middleware/utility/coordinateSort/index.js";

const router = express.Router();

// getting all parks
router.get("/", pagination(ParkModel), async (req, res) => {
  console.log(req.query);
  const aggregateResults = await ParkModel.aggregate(
    coordinateSort(req.query.lat, req.query.lng, {
      o: req.query.o,
      p: req.query.p,
      t: req.query.t,
    })
  );

  res.send(aggregateResults);
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
      coordinates: [
        req?.body?.location?.coordinates?.lng,
        req?.body?.location?.coordinates?.lat,
      ],
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
//create 100 random parks
// router.post("/random", async (req, res) => {
//   const getRandomCoordinates = () => {
//     const latitude = Math.random() * (90 - -90) + -90;
//     const longitude = Math.random() * (180 - -180) + -180;
//     return [longitude, latitude];
//   };
//   let randomParks = [];

//   for (let i = 0; i < 100; i++) {
//     randomParks.push(
//       new ParkModel({
//         address: {
//           zipCode: Math.floor(Math.random() * 100000),
//           street: "random street",
//           city: `random city ${Math.floor(Math.random() * 100)}`,
//           state: {
//             fullName: "random state",
//             abbreviation: "RS",
//           },
//           neighborhood: "random neighborhood",
//           number: Math.floor(Math.random() * 100),
//         },
//         location: {
//           coordinates: getRandomCoordinates(),
//         },
//       })
//     );
//   }

//   try {
//     const newPark = await ParkModel.insertMany(randomParks);
//     res.status(201).json(newPark);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

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
