const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const placeRoutes = require('./src/routes/place.routes.js');
const userRoutes = require('./src/routes/user.routes.js');
const setupSwagger = require('./src/swagger.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

setupSwagger(app);

app.use('/places', placeRoutes);
app.use('/users', userRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
