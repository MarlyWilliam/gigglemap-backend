const express = require('express');
const {
  createPlace,
  getAllPlaces,
  getPlaceById,
  findNearbyPlaces,
  getDistanceBetweenPlaces,
  seedTestData
} = require('../controllers/place.controller.js');

const router = express.Router();

/**
 * @swagger
 * /places:
 *   post:
 *     summary: Create a new place
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Place created successfully
 */
router.post('/', createPlace);

/**
 * @swagger
 * /places:
 *   get:
 *     summary: Get all places
 *     responses:
 *       200:
 *         description: A list of places
 */
router.get('/', getAllPlaces);

/**
 * @swagger
 * /places/{id}:
 *   get:
 *     summary: Get place by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the place
 *     responses:
 *       200:
 *         description: A single place
 */
router.get('/:id', getPlaceById);

/**
 * @swagger
 * /places/nearby/search:
 *   get:
 *     summary: Find nearby places
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         required: false
 *         description: Search radius in meters
 *     responses:
 *       200:
 *         description: List of nearby places
 */
router.get('/nearby/search', findNearbyPlaces);

/**
 * @swagger
 * /places/route/distance:
 *   get:
 *     summary: Get distance between two points
 *     parameters:
 *       - in: query
 *         name: fromLat
 *         schema:
 *           type: number
 *         required: true
 *       - in: query
 *         name: fromLng
 *         schema:
 *           type: number
 *         required: true
 *       - in: query
 *         name: toLat
 *         schema:
 *           type: number
 *         required: true
 *       - in: query
 *         name: toLng
 *         schema:
 *           type: number
 *         required: true
 *     responses:
 *       200:
 *         description: Distance in meters
 */
router.get('/route/distance', getDistanceBetweenPlaces);

/**
 * @swagger
 * /places/seed:
 *   post:
 *     summary: Seed test places
 *     responses:
 *       201:
 *         description: Test data seeded
 */
router.post('/seed', seedTestData);

module.exports = router;