const express = require('express');
const connectDB = require('./config/db');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes =  require('./routes/auth');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const cors = require('cors');
app.use(cors());

// Connect to Database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));