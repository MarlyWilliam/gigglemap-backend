const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GiggleMap API',
      version: '1.0.0',
      description: 'A social mapping platform API with user profiles and location-based features',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      {
        name: 'Users',
        description: 'User management and profile operations',
      },
      {
        name: 'Places',
        description: 'Place management and location operations',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = setupSwagger;