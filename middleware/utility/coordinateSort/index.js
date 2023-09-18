export default function coordinateSort(
  lat,
  lng,
  filters = {
    o: 1,
    p: 1,
    t: 10,
  }
) {
  return [
    {
      $geoNear: {
        near: { type: "Point", coordinates: [-73.99279, 40.719296] },
        distanceField: "distanceInKilometers",
        distanceMultiplier: 0.001,
      },
    },
    {
      $sort: {
        distanceInKilometers: Number(filters.o),
      },
    },
    {
      $skip: Number((filters.p - 1) * filters.t),
    },
    {
      $limit: Number(filters.t),
    },
  ];
}
