// export interface Pagination {
//     p: number; //page
//     t: number; //take
//     o: number; //order
//   }

export default function pagination(model) {
  return async (req, res, next) => {
    const page = parseInt(req.query.p);
    const take = parseInt(req.query.t);
    const order = req.query.o;
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

      res.paginatedResults = results;
      next();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  };
}
