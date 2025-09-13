const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/upload');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Allow only your Vercel frontend
app.use(cors({
  origin: "https://smartflows-invoice-scanner.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use('/api', uploadRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
