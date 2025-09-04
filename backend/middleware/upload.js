const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const s3Client = require('../config/aws.config.js');

// Get bucket name from environment
const bucketName = process.env.S3_BUCKET_NAME || 'invoice-ocr-project';

console.log('Using S3 bucket:', bucketName);

// Configure multer for S3 upload
const upload = multer({
  storage: {
    _handleFile: async (req, file, cb) => {
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `uploads/${uniqueSuffix}-${sanitizedName}`;

        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: bucketName,
            Key: key,
            Body: file.stream,
            ContentType: file.mimetype,
          },
        });

        const result = await upload.done();
        cb(null, {
          key: result.Key,
          location: result.Location,
          bucket: result.Bucket,
          size: file.size, // Use file.size from Multer
          mimetype: file.mimetype,
          originalname: file.originalname,
        });
      } catch (err) {
        cb(err);
      }
    },
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, 
  },
});

module.exports = upload;