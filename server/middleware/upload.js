const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${fileExt}`);
    },
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Error: Images only! Supported formats: jpeg, jpg, png, gif'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter,
});

// Custom error handling middleware wrapper
const uploadWithErrorHandling = (fields) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.fields(fields);
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ 
                        msg: 'File too large. Maximum file size is 5MB' 
                    });
                }
                return res.status(400).json({ 
                    msg: `Upload error: ${err.message}` 
                });
            } else if (err) {
                // An unknown error occurred
                return res.status(400).json({ 
                    msg: err.message || 'File upload failed' 
                });
            }
            
            // Log the request body for debugging
           // console.log('Form data received:', req.body);
            
            // Everything went fine
            next();
        });
    };
};

module.exports = uploadWithErrorHandling;