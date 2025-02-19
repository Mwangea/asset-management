const express = require('express');
const connectDB = require('./config/db');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/asset');
const adminRoutes = require('./routes/admin');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

const cors = require('cors');
app.use(cors());

// Connect to Database
connectDB();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        msg: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message 
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/admin', adminRoutes);

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));