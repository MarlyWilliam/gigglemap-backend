const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
const placeRoutes = require('../src/routes/place.routes.js');

dotenv.config();

const app = express();
app.use(express.json());
app.use('/places', placeRoutes);

describe('Places API', () => {
  let testPlaceId = null;

  it('POST /places/seed should seed data', async () => {
    const res = await request(app).post('/places/seed');
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Test data seeded successfully');
  });

  it('GET /places should return array', async () => {
    const res = await request(app).get('/places');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    testPlaceId = res.body[0].id;
  });

  it('GET /places/:id should return single place', async () => {
    const res = await request(app).get(`/places/${testPlaceId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('GET /places/nearby/search should return nearby places', async () => {
    const res = await request(app).get('/places/nearby/search?lat=30.04&lng=31.23&radius=3000');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /places/route/distance should return a number', async () => {
    const res = await request(app).get(
      '/places/route/distance?fromLat=30.033333&fromLng=31.233334&toLat=30.050000&toLng=31.245000'
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('distance');
    expect(typeof res.body.distance).toBe('number');
    expect(res.body.distance).toBeGreaterThan(0);
  });
});
