const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const Papa = require('papaparse');
const FormData = require('form-data');
require('dotenv').config();

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/json'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and JSON are allowed.'));
    }
  },
});

// Retry logic with exponential backoff
const retryRequest = async (config, maxRetries = 5, initialDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios(config);
    } catch (error) {
      if (
        (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED' || error.response?.status === 502 || error.response?.status === 503) &&
        attempt < maxRetries
      ) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} after ${delay}ms due to ${error.code || error.response?.status || 'error'}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Process files by sending to Render API (CSV only)
router.post('/process', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    const columns = req.body.columns ? JSON.parse(req.body.columns) : [];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for processing' });
    }

    console.log('Processing request received with files:', files.map(f => f.originalname));
    console.log('Selected columns:', columns);

    // Validate file types
    const invalidFiles = files.filter(file => !['application/pdf', 'image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return res.status(400).json({
        error: 'Invalid file types detected',
        details: `Only PDF, JPEG, PNG, and GIF are allowed. Found: ${invalidFiles.map(f => f.mimetype).join(', ')}`,
      });
    }

    // Prepare form-data for Render API
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', Buffer.from(file.buffer), {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });
    formData.append('columns', JSON.stringify(columns));

    console.log('Sending to Render API with files:', files.map(f => f.originalname));

    // Call /process-invoices for CSV
    let csvResponse;
    try {
      csvResponse = await retryRequest(
        {
          url: process.env.INVOICE_PROCESSING_API_URL,
          method: 'post',
          data: formData,
          headers: { ...formData.getHeaders() },
          timeout: 180000,
        },
        5,
        2000
      );
      console.log('✅ Render API CSV response:', csvResponse.data);
    } catch (csvError) {
      console.error('❌ Render API CSV error:', {
        message: csvError.message,
        response: csvError.response ? {
          status: csvError.response.status,
          data: csvError.response.data,
          headers: csvError.response.headers,
        } : 'No response received',
        code: csvError.code,
      });
      throw new Error(`CSV processing failed: ${csvError.message}`);
    }

    // Convert CSV to JSON for chatbot
    const parsedCSV = Papa.parse(csvResponse.data, { header: true, skipEmptyLines: true });
    if (parsedCSV.errors.length > 0) {
      console.error('CSV parsing errors:', parsedCSV.errors);
      throw new Error('Failed to parse CSV response');
    }
    const jsonData = parsedCSV.data;

    // Filter CSV if columns are specified
    let filteredCSV = csvResponse.data;
    if (columns && Array.isArray(columns) && columns.length > 0) {
      const filteredData = parsedCSV.data.map(row => {
        const filteredRow = {};
        columns.forEach(col => {
          if (row.hasOwnProperty(col)) {
            filteredRow[col] = row[col];
          }
        });
        return filteredRow;
      });
      filteredCSV = Papa.unparse(filteredData);
    }

    res.status(200).json({
      message: 'Files processed successfully',
      data: filteredCSV,
      json: jsonData,
    });
  } catch (error) {
    console.error('❌ Process error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      } : 'No response received',
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'No config available',
    });

    res.status(500).json({
      error: 'Failed to process files',
      details: error.message,
    });
  }
});

// Proxy endpoint to upload JSON to chatbot API
router.post('/chatbot-upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No JSON file provided' });
    }

    if (file.mimetype !== 'application/json') {
      return res.status(400).json({ error: 'Only JSON files are allowed for chatbot upload' });
    }

    console.log('Received JSON for chatbot upload:', file.originalname);

    const formData = new FormData();
    formData.append('files', Buffer.from(file.buffer), {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const response = await retryRequest(
      {
        url: process.env.CHATBOT_UPLOAD_API_URL,
        method: 'post',
        data: formData,
        headers: { ...formData.getHeaders() },
        timeout: 180000,
      },
      5,
      2000
    );

    console.log('✅ Chatbot upload response:', response.data);

    res.status(200).json({
      message: 'JSON uploaded successfully',
      session_id: response.data.session_id,
    });
  } catch (error) {
    console.error('❌ Chatbot upload error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      } : 'No response received',
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'No config available',
    });

    res.status(500).json({
      error: 'Failed to upload JSON to chatbot',
      details: error.message,
    });
  }
});

// Proxy endpoint to analyze invoices via chatbot API
router.post('/chatbot-analyze', async (req, res) => {
  try {
    const { session_id, question } = req.body;

    if (!session_id || !question) {
      return res.status(400).json({ error: 'Missing session_id or question' });
    }

    console.log('Received analyze request:', { session_id, question });

    const response = await retryRequest(
      {
        url: process.env.CHATBOT_ANALYZE_API_URL,
        method: 'post',
        data: { session_id, question },
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000,
      },
      5,
      2000
    );
zzz
    console.log('✅ Chatbot analyze response:', response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Chatbot analyze error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      } : 'No response received',
      code: error.code,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'No config available',
    });

    res.status(500).json({
      error: 'Failed to analyze invoice',
      details: error.message,
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  console.error('Multer error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 10MB)' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files (max 10)' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field' });
    }
  }

  if (error.message === 'Invalid file type. Only PDF, images, and JSON are allowed.') {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: error.message,
  });
});

module.exports = router;