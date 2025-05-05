# GiggleMap Backend

## Features

- Store and retrieve place/location data
- Spatial queries: find nearby places using geolocation
- Calculate distance between two coordinates
- REST API with Swagger docs
- Health check endpoint
- Seed command for test data

## Prerequisites

- Node.js >= 18.x
- PostgreSQL
- PostGIS extension installed on your PostgreSQL instance
- psql CLI

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database and Enable PostGIS
```bash
psql -U postgres
CREATE DATABASE gigglemap;
\c gigglemap
CREATE EXTENSION postgis;
```

### 3. Configure `.env`
Create a `.env` file as `.env.example`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/gigglemap"
```

### 4. Run DB Setup
```bash
npm run setup
```
> This will apply schema and create spatial index.
> You may need to run `npx prisma generate`.

### 5. Start Dev Server
```bash
npm run dev
```

## Test the API
Example port here is 3000
- Swagger docs: [http://localhost:3000/docs](http://localhost:3000/docs)
- Health check: [http://localhost:3000/health](http://localhost:3000/health)
- Seed data:
```bash
curl -X POST http://localhost:3000/places/seed
```

### Endpoints
- `GET    /places` – List all places
- `POST   /places` – Create a place
- `GET    /places/:id` – Get single place
- `GET    /places/nearby/search?lat=&lng=&radius=` – Find nearby places
- `GET    /places/route/distance?fromLat=&fromLng=&toLat=&toLng=` – Distance calc

## Testing
```bash
npm test
```

## Bonus Scope

### 1. Further Performance Improvement
To make this system ready for handling tens of millions of users with minimal delay, I'd focus on optimizing the backend performance and database access. This includes:
- Setting up **connection pooling** (e.g. pgBouncer) to allow the database to handle many simultaneous requests efficiently.
- Using **Redis caching** to store frequently requested data like popular locations, reducing the number of direct DB queries.
- Introducing a **load balancer** and **read-replicas** of the PostgreSQL database to distribute traffic.
- Creating **materialized views** for hotspot zones to speed up analytics and queries in dense areas.

To adapt to usage that varies by region or time zone, I'd monitor traffic patterns and dynamically scale compute or caching resources in regions with high load.

### 2. Worldwide Availability
To make the service truly global:
- I would host the app in a cloud environment (e.g. AWS/GCP) with **multi-region support**.
- The database would use **geographically distributed read replicas** so users can get faster responses regardless of their location.
- **Global DNS routing** (e.g. AWS Route 53) would direct users to the nearest available server.

### 3. End-to-End Provisioning
To make the whole stack deployable with minimal effort:
- Add a `Dockerfile` and `docker-compose.yml` so everything (API, DB, PostGIS) can spin up with a single command.
- Automate schema setup using `prisma migrate` commands triggered on container startup.
- Set up a CI/CD pipeline (e.g. GitHub Actions) to automatically build, test, and deploy the app when changes are pushed.

### 4. Security
**Endpoint security:**
- Sanitize all inputs (already done via Prisma’s parameterization)
- Add **rate limiting**, **CORS restrictions**, and **API key/token verification**
- Implement **HTTPS** with a reverse proxy like NGINX or using a PaaS with SSL support

**Beyond the endpoint:**
- Secure the database with strong credentials and limit network exposure
- Consider adding **JWT-based auth** and **role-based access control** if extended to support user-specific data