import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new Error("No file path provided");
    }

    if (!fs.existsSync(localFilePath)) {
      throw new Error("File does not exist at path: " + localFilePath);
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      media_metadata: true
    });

    // Delete the local file
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.error("Error deleting local file:", err);
      // Continue since upload was successful
    }

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Try to clean up the local file if it exists
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error("Error deleting local file after failed upload:", err);
      }
    }
    throw error; // Re-throw to be handled by caller
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from cloudinary:", error);
    return null;
  }
};

// Extract public_id from cloudinary URL
const getPublicIdFromURL = (url) => {
  try {
    if (!url) return null;
    const urlParts = url.split('/');
    const filenameWithExt = urlParts[urlParts.length - 1];
    const publicId = filenameWithExt.split('.')[0]; // Remove file extension
    return publicId;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, getPublicIdFromURL };
