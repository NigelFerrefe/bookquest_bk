const cloudinary = require("cloudinary").v2;

/**
 * Upload image from URL to Cloudinary
 * @param {string} imageUrl - The URL of the image to upload
 * @returns {Promise<string|null>} - The Cloudinary secure URL or null if failed
 */
async function uploadImageToCloudinary(imageUrl) {
  if (!imageUrl) {
    return null;
  }

  try {
    // Upload image from URL to Cloudinary
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "Media Library",
      resource_type: "image",
    });

    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error.message);
    // Return null if upload fails, so the book can still be created without image
    return null;
  }
}

module.exports = { uploadImageToCloudinary };
