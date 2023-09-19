export default function coordinateSort(lng, lat, filters) {
  console.log(lat, lng, filters);
  return [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distanceInKilometers",
        distanceMultiplier: 0.001,
      },
    },
    {
      $sort: {
        distanceInKilometers: filters.o,
      },
    },
    {
      $skip: (filters.p - 1) * filters.t,
    },
    {
      $limit: filters.t,
    },
  ];
}
