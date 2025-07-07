const { 
  createUserService, 
  loginUserService,
  getUserProfileService, 
  updateUserProfileService,
  searchUsersService,
  getNearbyUsersService,
  updateUserStatsService,
  deleteUserService,
  getUserEngagementService
} = require('../services/user.service.js');
const { uploadAvatar, deleteAvatar, getOptimizedAvatarUrl } = require('../services/cloudinary.service.js');

/**
 * Register a new user
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await createUserService({ username, email, password, fullName });
    res.status(201).json({ 
      message: 'User created successfully', 
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * User login
 */
const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const result = await loginUserService(emailOrUsername, password);
    res.json({
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Get user profile by ID (public endpoint)
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await getUserProfileService(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Optimize avatar URL for response
    if (user.avatarUrl) {
      user.avatarUrl = getOptimizedAvatarUrl(user.avatarUrl, { width: 200, height: 200 });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

/**
 * Update user profile (authenticated endpoint)
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const {
      fullName, bio, website, instagram, twitter, facebook,
      city, country, latitude, longitude
    } = req.body;

    const updateData = {
      fullName, bio, website, instagram, twitter, facebook,
      city, country, latitude, longitude
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await updateUserProfileService(userId, updateData);
    
    // Optimize avatar URL for response
    if (updatedUser.avatarUrl) {
      updatedUser.avatarUrl = getOptimizedAvatarUrl(updatedUser.avatarUrl, { width: 200, height: 200 });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Upload user avatar
 */
const uploadUserAvatar = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get current user to check for existing avatar
    const currentUser = await getUserProfileService(userId);
    
    // Upload new avatar to Cloudinary
    const avatarUrl = await uploadAvatar(req.file.buffer, userId);
    
    // Delete old avatar if it exists
    if (currentUser && currentUser.avatarUrl) {
      await deleteAvatar(currentUser.avatarUrl);
    }
    
    // Update user profile with new avatar URL
    const updatedUser = await updateUserProfileService(userId, { avatarUrl });
    
    // Optimize avatar URL for response
    updatedUser.avatarUrl = getOptimizedAvatarUrl(updatedUser.avatarUrl, { width: 200, height: 200 });

    res.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser,
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    if (error.message.includes('Only image files')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

/**
 * Search users by username or full name
 */
const searchUsers = async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const users = await searchUsersService(query.trim(), parseInt(limit));
    
    // Optimize avatar URLs for response
    const optimizedUsers = users.map(user => ({
      ...user,
      avatarUrl: user.avatarUrl ? getOptimizedAvatarUrl(user.avatarUrl, { width: 100, height: 100 }) : null
    }));

    res.json({
      query: query.trim(),
      count: optimizedUsers.length,
      users: optimizedUsers
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

/**
 * Get nearby users based on coordinates
 */
const getNearbyUsers = async (req, res) => {
  try {
    const { lat, lng, radius = 10000, limit = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);
    const searchLimit = parseInt(limit);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    const users = await getNearbyUsersService(latitude, longitude, searchRadius, searchLimit);
    
    // Optimize avatar URLs and format distance
    const optimizedUsers = users.map(user => ({
      ...user,
      avatarUrl: user.avatarUrl ? getOptimizedAvatarUrl(user.avatarUrl, { width: 100, height: 100 }) : null,
      distance: Math.round(parseFloat(user.distance))
    }));

    res.json({
      center: { latitude, longitude },
      radius: searchRadius,
      count: optimizedUsers.length,
      users: optimizedUsers
    });
  } catch (error) {
    console.error('Error finding nearby users:', error);
    res.status(500).json({ error: 'Failed to find nearby users' });
  }
};

/**
 * Get current user's own profile (authenticated)
 */
const getCurrentUserProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = req.user;
    
    // Get fresh data from database with coordinates
    const fullProfile = await getUserProfileService(user.id);
    
    // Include private information for own profile
    res.json({
      ...fullProfile,
      email: user.email, // Include email for own profile
      avatarUrl: fullProfile.avatarUrl ? getOptimizedAvatarUrl(fullProfile.avatarUrl, { width: 200, height: 200 }) : null
    });
  } catch (error) {
    console.error('Error getting current user profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Update user engagement stats (internal endpoint)
 */
const updateUserStats = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { statType, increment = 1 } = req.body;

    if (!statType) {
      return res.status(400).json({ error: 'Stat type is required' });
    }

    const updatedUser = await updateUserStatsService(userId, statType, parseInt(increment));
    res.json({
      message: 'User stats updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
    if (error.message.includes('Invalid stat type')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update user stats' });
  }
};

/**
 * Get user engagement summary
 */
const getUserEngagement = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const engagement = await getUserEngagementService(userId);
    res.json(engagement);
  } catch (error) {
    console.error('Error getting user engagement:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to get user engagement' });
  }
};

/**
 * Delete user account (authenticated)
 */
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Get user profile to check for avatar
    const user = await getUserProfileService(userId);
    
    // Delete avatar from Cloudinary if exists
    if (user && user.avatarUrl) {
      await deleteAvatar(user.avatarUrl);
    }
    
    // Delete user from database
    await deleteUserService(userId);
    
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
};

module.exports = {
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
}; 