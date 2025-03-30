import multer from "multer";
import path from "path";
import fs from 'fs';

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'public', 'temp');

// Ensure directory exists with proper permissions
try {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true, mode: 0o777 });
    }
    // Set directory permissions if it already exists
    fs.chmodSync(tempDir, 0o777);
} catch (error) {
    console.error('Error creating temp directory:', error);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Verify directory exists before saving
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true, mode: 0o777 });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only jpeg, png, and gif
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  })


