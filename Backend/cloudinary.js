// cloudinary.js
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Create Multer storage using Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "menu_images", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

// ✅ Initialize multer with Cloudinary storage
const upload = multer({ storage });

module.exports = { upload, cloudinary };
