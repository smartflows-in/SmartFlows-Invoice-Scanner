const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Create a test file
const testFilePath = path.join(__dirname, 'test-file.txt');
fs.writeFileSync(testFilePath, 'This is a test file for upload');

// Create form data
const formData = new FormData();
formData.append('files', fs.createReadStream(testFilePath));

// Make request
axios.post('http://localhost:5000/api/upload', formData, {
  headers: formData.getHeaders()
})
.then(response => {
  console.log('Upload successful:', response.data);
  // Clean up test file
  fs.unlinkSync(testFilePath);
})
.catch(error => {
  console.error('Upload failed:', error.response?.data || error.message);
  // Clean up test file
  fs.unlinkSync(testFilePath);
});