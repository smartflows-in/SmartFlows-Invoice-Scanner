const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Test connection to S3
async function testS3Connection() {
  try {
    const command = new ListBucketsCommand({});
    const data = await s3Client.send(command);
    console.log('✅ Successfully connected to AWS S3');
    console.log('Available buckets:', data.Buckets.map(b => b.Name));

    const targetBucket = process.env.S3_BUCKET_NAME;
    const bucketExists = data.Buckets.some(b => b.Name === targetBucket);

    if (bucketExists) {
      console.log(`✅ Target bucket "${targetBucket}" exists`);
    } else {
      console.log(`❌ Target bucket "${targetBucket}" does NOT exist`);
    }
  } catch (err) {
    console.error('❌ AWS S3 Connection Failed:', err.message);
    console.error('Error code:', err.name);
  }
}

testS3Connection();

module.exports = s3Client;