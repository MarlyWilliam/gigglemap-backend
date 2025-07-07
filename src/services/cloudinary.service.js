const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * Upload avatar image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} userId - User ID for organizing uploads
 * @returns {Promise<string>} - Cloudinary URL
 */
const uploadAvatar = async (fileBuffer, userId) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: `gigglemap/avatars`,
          public_id: `user_${userId}_avatar_${Date.now()}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Failed to upload image: ${error.message}`));
          } else {
            resolve(result.secure_url);
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new Error('Failed to upload avatar image');
  }
};

/**
 * Delete avatar image from Cloudinary
 * @param {string} imageUrl - Cloudinary URL to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteAvatar = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return true; // Nothing to delete or not a Cloudinary URL
    }

    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = `gigglemap/avatars/${fileName.split('.')[0]}`;

    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting avatar from Cloudinary:', error);
    return false; // Don't throw error, just log it
  }
};

/**
 * Get optimized avatar URL with transformations
 * @param {string} avatarUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized URL
 */
const getOptimizedAvatarUrl = (avatarUrl, options = {}) => {
  if (!avatarUrl || !avatarUrl.includes('cloudinary.com')) {
    return avatarUrl;
  }

  const { width = 200, height = 200, quality = 'auto' } = options;

  try {
    const url = new URL(avatarUrl);
    const pathParts = url.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    if (uploadIndex !== -1) {
      const transformations = `w_${width},h_${height},c_fill,g_face,q_${quality},f_auto`;
      pathParts.splice(uploadIndex + 1, 0, transformations);
      url.pathname = pathParts.join('/');
    }
    
    return url.toString();
  } catch (error) {
    console.error('Error optimizing avatar URL:', error);
    return avatarUrl;
  }
};

module.exports = {
  upload,
  uploadAvatar,
  deleteAvatar,
  getOptimizedAvatarUrl,
}; 