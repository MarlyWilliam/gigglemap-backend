const { createPlaceService, getAllPlacesService, getPlaceByIdService, findNearbyPlacesService, getDistanceService, seedTestPlaces } = require('../services/place.service.js');

const createPlace = async (req, res) => {
  try {
    const result = await createPlaceService(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create place' });
  }
};

const getAllPlaces = async (req, res) => {
  try {
    const result = await getAllPlacesService();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get places' });
  }
};

const getPlaceById = async (req, res) => {
  try {
    const result = await getPlaceByIdService(parseInt(req.params.id));
    res.json(result || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get place by ID' });
  }
};

const findNearbyPlaces = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius || '5000');
    const result = await findNearbyPlacesService(lat, lng, radius);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to search nearby places' });
  }
};

const getDistanceBetweenPlaces = async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;
    const result = await getDistanceService(fromLat, fromLng, toLat, toLng);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate distance' });
  }
};

const seedTestData = async (req, res) => {
  try {
    await seedTestPlaces();
    res.status(201).json({ message: 'Test data seeded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to seed test data' });
  }
};

module.exports = {
  createPlace,
  getAllPlaces,
  getPlaceById,
  findNearbyPlaces,
  getDistanceBetweenPlaces,
  seedTestData
 };
