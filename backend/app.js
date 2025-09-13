const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const uploadRoutes = require('./routes/upload');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', uploadRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});