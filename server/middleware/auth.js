const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Add this import

// Middleware for verifying JWT token
const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch complete user data from database
        const user = await User.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        // Set complete user object in request
        req.user = {
            id: user._id,
            username: user.username,
            role: user.role
            // Add any other needed user fields
        };
        
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = auth;