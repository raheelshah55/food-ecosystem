const cloudinary = require('cloudinary'); // FIX: Imported the BASE object instead of .v2!
const multer = require('multer');

// Handle version differences in the storage library
const multerCloudinary = require('multer-storage-cloudinary');
const StorageConstructor = multerCloudinary.CloudinaryStorage || multerCloudinary;

// 1. Configure the v2 part
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Tell it where to store the files
const storage = new StorageConstructor({
    cloudinary: cloudinary, // FIX: Passing the base object stops the crash!
    params: {
        folder: 'PremiumFoodApp', 
        allowed_formats:['jpg', 'jpeg', 'png', 'webp']
    }
});

// 3. Export the uploader
const upload = multer({ storage: storage });
module.exports = upload;