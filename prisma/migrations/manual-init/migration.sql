-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Place table
CREATE TABLE "Place" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL
);

-- Index for performance
CREATE INDEX idx_place_location ON "Place" USING GIST(location);
