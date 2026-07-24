const multer = require('multer');
const path = require('path');
const fs = require('fs');

const os = require('os');

// On Vercel or production serverless, use the OS writable /tmp directory to avoid read-only system errors
const uploadDir = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration (Saves locally first. If Cloudinary is setup, the controller pushes it and deletes local copy)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Validate file type (Images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/i;
  const extname = allowedTypes.test(path.extname(file.originalname));
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: fileFilter,
});

module.exports = upload;
