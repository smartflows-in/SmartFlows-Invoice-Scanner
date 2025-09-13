const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/upload');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';

// Apply CORS middleware globally
app.use(cors({
  origin: [
    "https://smartflows-invoice-scanner.vercel.app",
    "http://localhost:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use('/api', uploadRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
  });
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
  });
});

app.listen(port, host, () => {
  console.log(`Server running on host ${host} port ${port}`);
  console.log('Environment variables:', {
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    INVOICE_PROCESSING_API_URL: process.env.INVOICE_PROCESSING_API_URL ? 'Set' : 'Not set',
    CHATBOT_UPLOAD_API_URL: process.env.CHATBOT_UPLOAD_API_URL ? 'Set' : 'Not set',
    CHATBOT_ANALYZE_API_URL: process.env.CHATBOT_ANALYZE_API_URL ? 'Set' : 'Not set',
  });
});