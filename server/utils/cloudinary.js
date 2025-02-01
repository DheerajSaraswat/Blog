import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      media_metadata: true,
    });
    
    // File has been uploaded successfully
    console.log("File uploaded on cloudinary", response.url);
    
    // Remove file from local storage
    fs.unlinkSync(localFilePath);
    
    return response;
  } catch (error) {
    // Remove the locally saved temporary file as the upload operation failed
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("File deleted from cloudinary", result);
    return result;
  } catch (error) {
    console.error("Error deleting from cloudinary:", error);
    return null;
  }
};

// Extract public_id from cloudinary URL
const getPublicIdFromURL = (url) => {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0]; // Remove file extension
    return publicId;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, getPublicIdFromURL };
