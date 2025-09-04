const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/aws.config.js');

const bucketName = process.env.S3_BUCKET_NAME || 'pdf-analyzer-bucket';

const s3Storage = {
  _handleFile: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = 'uploads/' + uniqueSuffix + '-' + sanitizedName;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.stream,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const command = new PutObjectCommand(params);

    s3Client.send(command)
      .then((result) => {
        const location = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        cb(null, {
          key: key,
          location: location,
          size: file.size,
          mimetype: file.mimetype,
          originalname: file.originalname
        });
      })
      .catch((error) => {
        cb(error);
      });
  },

  _removeFile: function (req, file, cb) {
    // Implement if needed for cleanup
    cb(null);
  }
};

module.exports = s3Storage;