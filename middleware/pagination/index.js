// export interface Pagination {
//     p: number; //page
//     t: number; //take
//     o: number; //order
//   }

const pagination = (model) => {
  console.log("pagination middleware");
  return async (req, res, next) => {
    const page = parseInt(req.query.p) || 1;
    const take = parseInt(req.query.t) || 10;
    const order = req.query.o || -1;
    const startIndex = (page - 1) * take;
    const endIndex = page * take;
    const results = {};
    if (endIndex < (await model.countDocuments().exec())) {
      results.next = {
        page: page + 1,
        limit: take,
      };
    }
    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: take,
      };
    }
    try {
      results.results = model
        .find()
        .limit(take)
        .skip(startIndex)
        .sort({ createdAt: order });

      console.log(results);
      res.paginatedResults = results;
      next();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  };
};

//  coordinates: [Number, Number],
const sortByGeoDistanceMiddleware = () => {
  console.log("sortByGeoDistanceMiddleware");
  return (req, res, next) => {
    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [req.body.lat, req.body.lng],
          },
          $maxDistance: req.body.range * 1000 || 1000000000,
        },
      },
    };
    res.geoQuery = query;
    next();
  };
};

export default (pagination, sortByGeoDistanceMiddleware);
