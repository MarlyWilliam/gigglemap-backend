# GiggleMap Backend

A comprehensive backend API for the GiggleMap application featuring location-based services and user profile management.

## Features

### 🗺️ Location Services
- Store and retrieve place/location data with PostGIS spatial support
- Spatial queries: find nearby places using geolocation
- Calculate distance between coordinates
- Geospatial indexing for high-performance queries

### 👤 User Management
- User registration and authentication with JWT
- Comprehensive user profiles with social media links
- Avatar upload with Cloudinary integration
- User search by username or full name
- Location-based user discovery (nearby users)
- Engagement statistics tracking (stories, likes, comments)
- Profile privacy controls

### 🛠️ Developer Experience
- REST API with comprehensive Swagger documentation
- Robust error handling and validation
- Comprehensive test suite (41 tests)
- Health check endpoint
- Database seeding for development

## Prerequisites

- Node.js >= 18.x
- PostgreSQL with PostGIS extension
- Cloudinary account (for avatar uploads)
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

### 3. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
# Database
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/gigglemap"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Cloudinary (for avatar uploads)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Server
PORT=3000
NODE_ENV=development
```

### 4. Run Database Setup
```bash
npm run setup
```
> This will apply the Prisma schema, run migrations, and generate the Prisma client.

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Documentation

### 📍 Places API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/places` | List all places | No |
| `POST` | `/places` | Create a new place | No |
| `GET` | `/places/:id` | Get single place | No |
| `GET` | `/places/nearby/search` | Find nearby places | No |
| `GET` | `/places/route/distance` | Calculate distance between coordinates | No |
| `POST` | `/places/seed` | Seed test data | No |

#### Find Nearby Places
```bash
GET /places/nearby/search?lat=30.044&lng=31.235&radius=5000
```

#### Calculate Distance
```bash
GET /places/route/distance?fromLat=30.044&fromLng=31.235&toLat=30.064&toLng=31.249
```

### 👤 Users API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/users/register` | Register new user | No |
| `POST` | `/users/login` | User login | No |
| `GET` | `/users/me` | Get current user profile | Yes |
| `GET` | `/users/:id` | Get public user profile | No |
| `PUT` | `/users/:id` | Update user profile | Yes (own profile) |
| `DELETE` | `/users/:id` | Delete user account | Yes (own account) |
| `GET` | `/users/search` | Search users | No |
| `GET` | `/users/nearby` | Find nearby users | No |
| `GET` | `/users/:id/engagement` | Get user engagement stats | No |
| `PUT` | `/users/:id/stats` | Update user stats | Yes |
| `POST` | `/users/:id/avatar` | Upload user avatar | Yes (own profile) |

#### Authentication
For protected endpoints, include the JWT token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

#### User Registration
```bash
POST /users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}
```

#### User Login
```bash
POST /users/login
Content-Type: application/json

{
  "emailOrUsername": "john@example.com",
  "password": "securepassword123"
}
```

#### Update Profile
```bash
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "John Smith",
  "bio": "Software developer from Cairo",
  "website": "https://johnsmith.dev",
  "city": "Cairo",
  "country": "Egypt",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "instagram": "johnsmith_dev",
  "twitter": "johnsmith"
}
```

#### Search Users
```bash
GET /users/search?q=john&limit=10
```

#### Find Nearby Users
```bash
GET /users/nearby?lat=30.044&lng=31.235&radius=5000&limit=20
```

#### Upload Avatar
```bash
POST /users/:id/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

(Include image file in form data with key 'avatar')
```

## Testing

Run the comprehensive test suite:
```bash
npm test
```

The test suite includes:
- **Place API Tests**: 5 tests covering CRUD operations and spatial queries
- **User API Tests**: 40 tests covering registration, authentication, profiles, search, and more
- **Total**: 41 passing tests

## Development

### Swagger Documentation
Access interactive API docs at: `http://localhost:3000/docs`

### Health Check
Check server status: `http://localhost:3000/health`

### Database Management
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name your-migration-name

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Security Features

- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive validation for all endpoints
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **Authorization**: Role-based access control for user resources
- **File Upload Security**: Cloudinary integration with file type validation

## Performance Optimizations

- **PostGIS Spatial Indexing**: Optimized geospatial queries
- **Prisma Query Optimization**: Efficient database operations
- **Avatar Optimization**: Automatic image resizing and optimization via Cloudinary
- **Connection Pooling**: Efficient database connection management

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Descriptive error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

## Production Deployment

### Environment Considerations
1. Set `NODE_ENV=production`
2. Use a strong, unique `JWT_SECRET`
3. Configure proper database connection pooling
4. Set up HTTPS with SSL certificates
5. Configure CORS for your frontend domain
6. Set up monitoring and logging

### Docker Support
The application is containerized with Docker:
```bash
# Build image
docker build -t gigglemap-backend .

# Run with Docker Compose
docker-compose up -d
```

### Scaling Recommendations

For production with millions of users:

1. **Database Scaling**
   - Use read replicas for user queries
   - Implement connection pooling (pgBouncer)
   - Consider database sharding for user data

2. **Caching**
   - Redis for session management
   - CDN for avatar images via Cloudinary
   - Cache popular search results

3. **Infrastructure**
   - Load balancers for API instances
   - Auto-scaling based on traffic
   - Multi-region deployment for global availability

4. **Monitoring**
   - Database query performance monitoring
   - API response time tracking
   - Error rate monitoring and alerting

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For questions and support, please open an issue on the GitHub repository.