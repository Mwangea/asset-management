const express = require('express');
const connectDB = require('./config/db');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes =  require('./routes/auth');
const assetRoutes = require('./routes/asset');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

const cors = require('cors');
app.use(cors());

// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));