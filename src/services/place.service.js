const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPlaceService = async ({ name, description, latitude, longitude }) => {
  const location = `SRID=4326;POINT(${longitude} ${latitude})`;
  await prisma.$executeRaw`
    INSERT INTO "Place" (name, description, location)
    VALUES (${name}, ${description}, ST_GeographyFromText(${location}))
  `;
  return { message: 'Place created successfully' };
};

const getAllPlacesService = async () => {
  return await prisma.$queryRaw`
    SELECT id, name, description, ST_AsText(location) AS location
    FROM "Place"
  `;
};

const getPlaceByIdService = async (id) => {
  const result = await prisma.$queryRaw`
    SELECT id, name, description, ST_AsText(location) AS location
    FROM "Place"
    WHERE id = ${id}
  `;
  return result[0];
};

const findNearbyPlacesService = async (lat, lng, radius) => {
  return await prisma.$queryRaw`
    SELECT id, name, description, ST_AsText(location) AS location
    FROM "Place"
    WHERE ST_DWithin(
      location,
      ST_MakePoint(${lng}, ${lat})::geography,
      ${radius}
    )
  `;
};

const getDistanceService = async (fromLat, fromLng, toLat, toLng) => {
  const result = await prisma.$queryRaw`
    SELECT ST_Distance(
      ST_MakePoint(${parseFloat(fromLng)}, ${parseFloat(fromLat)})::geography,
      ST_MakePoint(${parseFloat(toLng)}, ${parseFloat(toLat)})::geography
    ) AS distance
  `;
  return result[0];
};

const seedTestPlaces = async () => {
  const testPlaces = [
    {
      name: 'City Square',
      description: 'A center point',
      lat: 30.033333,
      lng: 31.233334
    },
    {
      name: 'Library Park',
      description: 'Quiet place with trees',
      lat: 30.040000,
      lng: 31.220000
    },
    {
      name: 'Food Plaza',
      description: 'Famous for street food',
      lat: 30.050000,
      lng: 31.245000
    }
  ];

  for (const p of testPlaces) {
    const loc = `SRID=4326;POINT(${p.lng} ${p.lat})`;
    await prisma.$executeRaw`
      INSERT INTO "Place" (name, description, location)
      VALUES (${p.name}, ${p.description}, ST_GeographyFromText(${loc}))
    `;
  }
};

module.exports = {
  createPlaceService,
  getAllPlacesService,
  getPlaceByIdService,
  findNearbyPlacesService,
  getDistanceService,
  seedTestPlaces
};