const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/upload');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';  // Add this: Bind to all interfaces for Railway/Render

// Allow only your Vercel frontend (unchanged)
app.use(cors({
  origin: [
    "https://smartflows-invoice-scanner.vercel.app",
    "http://localhost:5173"  // Add this for Vite dev server
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use('/api', uploadRoutes);

app.listen(port, host, () => {  // Add host here
  console.log(`Server running on host ${host} port ${port}`);
});