export default function coordinateSort(lng, lat, filters) {
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

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
