const { PrismaClient } = require('../../generated/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @returns {Object} Created user (without password)
 */
const createUserService = async ({ username, email, password, fullName }) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName: fullName || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        website: true,
        instagram: true,
        twitter: true,
        facebook: true,
        city: true,
        country: true,
        storyCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Authenticate user login
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - Plain text password
 * @returns {Object} User data and JWT token
 */
const loginUserService = async (emailOrUsername, password) => {
  try {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

/**
 * Get user profile by ID (public view)
 * @param {number} userId - User ID
 * @returns {Object} Public user profile
 */
const getUserProfileService = async (userId) => {
  try {
    const user = await prisma.$queryRaw`
      SELECT 
        id, username, "fullName", "avatarUrl", bio, website,
        instagram, twitter, facebook, city, country,
        "storyCount", "likeCount", "commentCount",
        "createdAt", "updatedAt",
        ST_AsText(coordinates) AS coordinates
      FROM "User"
      WHERE id = ${userId}
    `;

    if (!user || user.length === 0) {
      return null;
    }

    return user[0];
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Profile data to update
 * @returns {Object} Updated user profile
 */
const updateUserProfileService = async (userId, updateData) => {
  try {
    const {
      fullName, bio, website, instagram, twitter, facebook,
      city, country, latitude, longitude, avatarUrl
    } = updateData;

    // Prepare update data
    const updateFields = {};
    
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (bio !== undefined) updateFields.bio = bio;
    if (website !== undefined) updateFields.website = website;
    if (instagram !== undefined) updateFields.instagram = instagram;
    if (twitter !== undefined) updateFields.twitter = twitter;
    if (facebook !== undefined) updateFields.facebook = facebook;
    if (city !== undefined) updateFields.city = city;
    if (country !== undefined) updateFields.country = country;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

    // Handle coordinates separately if provided
    if (latitude !== undefined && longitude !== undefined) {
      const location = `SRID=4326;POINT(${longitude} ${latitude})`;
      await prisma.$executeRaw`
        UPDATE "User" 
        SET coordinates = ST_GeographyFromText(${location}),
            "updatedAt" = NOW()
        WHERE id = ${userId}
      `;
    }

    // Update other fields
    if (Object.keys(updateFields).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateFields
      });
    }

    // Return updated profile
    return await getUserProfileService(userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Search users by username or full name
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of matching users
 */
const searchUsersService = async (query, limit = 20) => {
  try {
    const searchTerm = `%${query.toLowerCase()}%`;
    
    const users = await prisma.$queryRaw`
      SELECT 
        id, username, "fullName", "avatarUrl", bio,
        city, country, "storyCount", "likeCount", "commentCount",
        ST_AsText(coordinates) AS coordinates
      FROM "User"
      WHERE 
        LOWER(username) LIKE ${searchTerm} OR 
        LOWER("fullName") LIKE ${searchTerm}
      ORDER BY 
        CASE 
          WHEN LOWER(username) = ${query.toLowerCase()} THEN 1
          WHEN LOWER("fullName") = ${query.toLowerCase()} THEN 2
          WHEN LOWER(username) LIKE ${`${query.toLowerCase()}%`} THEN 3
          WHEN LOWER("fullName") LIKE ${`${query.toLowerCase()}%`} THEN 4
          ELSE 5
        END,
        "storyCount" DESC,
        "likeCount" DESC
      LIMIT ${limit}
    `;

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Get nearby users based on coordinates
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in meters
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of nearby users
 */
const getNearbyUsersService = async (latitude, longitude, radius = 10000, limit = 50) => {
  try {
    return await prisma.$queryRaw`
      SELECT 
        id, username, "fullName", "avatarUrl", bio,
        city, country, "storyCount", "likeCount", "commentCount",
        ST_AsText(coordinates) AS coordinates,
        ST_Distance(
          coordinates,
          ST_MakePoint(${longitude}, ${latitude})::geography
        ) AS distance
      FROM "User"
      WHERE 
        coordinates IS NOT NULL AND
        ST_DWithin(
          coordinates,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radius}
        )
      ORDER BY distance ASC
      LIMIT ${limit}
    `;
  } catch (error) {
    console.error('Error finding nearby users:', error);
    throw error;
  }
};

/**
 * Update user engagement stats
 * @param {number} userId - User ID
 * @param {string} statType - Type of stat ('storyCount', 'likeCount', 'commentCount')
 * @param {number} increment - Amount to increment (can be negative)
 * @returns {Object} Updated user stats
 */
const updateUserStatsService = async (userId, statType, increment = 1) => {
  try {
    const validStats = ['storyCount', 'likeCount', 'commentCount'];
    if (!validStats.includes(statType)) {
      throw new Error(`Invalid stat type: ${statType}`);
    }

    if (statType === 'storyCount') {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "storyCount" = GREATEST(0, "storyCount" + ${increment}),
            "updatedAt" = NOW()
        WHERE id = ${userId}
      `;
    } else if (statType === 'likeCount') {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "likeCount" = GREATEST(0, "likeCount" + ${increment}),
            "updatedAt" = NOW()
        WHERE id = ${userId}
      `;
    } else if (statType === 'commentCount') {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "commentCount" = GREATEST(0, "commentCount" + ${increment}),
            "updatedAt" = NOW()
        WHERE id = ${userId}
      `;
    }

    return await getUserProfileService(userId);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {number} userId - User ID
 * @returns {boolean} Success status
 */
const deleteUserService = async (userId) => {
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Get user engagement summary
 * @param {number} userId - User ID
 * @returns {Object} User engagement stats
 */
const getUserEngagementService = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        storyCount: true,
        likeCount: true,
        commentCount: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error getting user engagement:', error);
    throw error;
  }
};

module.exports = {
  createUserService,
  loginUserService,
  getUserProfileService,
  updateUserProfileService,
  searchUsersService,
  getNearbyUsersService,
  updateUserStatsService,
  deleteUserService,
  getUserEngagementService
}; 