const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  searchUsers,
  getNearbyUsers,
  getCurrentUserProfile,
  updateUserStats,
  getUserEngagement,
  deleteUser
} = require('../controllers/user.controller.js');
const { authenticateToken, authorizeOwner } = require('../middleware/auth.middleware.js');
const { upload } = require('../services/cloudinary.service.js');

const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: User already exists
 */
router.post('/register', registerUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emailOrUsername
 *               - password
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile with private information
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, getCurrentUserProfile);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users by username or full name
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of matching users
 *       400:
 *         description: Invalid search query
 */
router.get('/search', searchUsers);

/**
 * @swagger
 * /users/nearby:
 *   get:
 *     summary: Find nearby users based on coordinates
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10000
 *         description: Search radius in meters
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of nearby users with distances
 *       400:
 *         description: Invalid coordinates
 */
router.get('/nearby', getNearbyUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public user profile
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserProfile);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               bio:
 *                 type: string
 *               website:
 *                 type: string
 *               instagram:
 *                 type: string
 *               twitter:
 *                 type: string
 *               facebook:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own profile
 */
router.put('/:id', authenticateToken, authorizeOwner, updateUserProfile);

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No image file provided or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own avatar
 */
router.post('/:id/avatar', authenticateToken, authorizeOwner, upload.single('avatar'), uploadUserAvatar);

/**
 * @swagger
 * /users/{id}/engagement:
 *   get:
 *     summary: Get user engagement stats
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User engagement statistics
 *       404:
 *         description: User not found
 */
router.get('/:id/engagement', getUserEngagement);

/**
 * @swagger
 * /users/{id}/stats:
 *   put:
 *     summary: Update user engagement stats (internal use)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statType
 *             properties:
 *               statType:
 *                 type: string
 *                 enum: [storyCount, likeCount, commentCount]
 *               increment:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Stats updated successfully
 *       400:
 *         description: Invalid stat type
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/stats', authenticateToken, updateUserStats);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only delete own account
 */
router.delete('/:id', authenticateToken, authorizeOwner, deleteUser);

module.exports = router; 