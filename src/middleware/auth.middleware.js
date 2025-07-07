const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user can only access their own resources
const authorizeOwner = (req, res, next) => {
  const requestedUserId = parseInt(req.params.id);
  const currentUserId = req.user.id;

  if (requestedUserId !== currentUserId) {
    return res.status(403).json({ error: 'Access denied: You can only access your own profile' });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeOwner
}; 