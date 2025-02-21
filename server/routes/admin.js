const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const Asset = require('../models/asset');
const path = require('path');
const fs = require('fs');

// @route   POST /api/admin/create-user
// @desc    Admin creates a new user
// @access  Private (Admin only)
router.post('/create-user', [auth,roleCheck('admin'),
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role = 'user' } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            password,
            role
        });

        await user.save();

        res.json({ msg: 'User created successfully', userId: user._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with their details
// @access  Private (Admin only)
router.get('/users', [auth, roleCheck('admin')], async (req, res) => {
    try {
        const users = await User.find()
            .select('username role lastLogin createdAt')
            .sort({ createdAt: -1 });
        
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/users/:id', [auth, roleCheck('admin')], async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/users/:id', [
    auth,
    roleCheck('admin'),
    check('username', 'Username is required').optional().not().isEmpty(),
    check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 }),
    check('role', 'Role must be either admin or user').optional().isIn(['admin', 'user'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update fields if provided
        if (req.body.username) user.username = req.body.username;
        if (req.body.role) user.role = req.body.role;
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        res.json({ msg: 'User updated successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/users/:id', [auth, roleCheck('admin')], async (req, res) => {
    try {
        // Check if user exists
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ msg: 'Admin cannot delete their own account' });
        }

        // Delete user
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   GET /api/admin/users-with-assets
// @desc    Get all users with their assigned assets and QR codes
// @access  Private (Admin only)
router.get('/users-with-assets', [auth, roleCheck('admin')], async (req, res) => {
    try {
        // Find all users
        const users = await User.find()
            .select('username role')
            .lean(); // Use lean() for better performance since we're just reading

        // For each user, find their assigned assets
        const usersWithAssets = await Promise.all(users.map(async (user) => {
            const assignedAssets = await Asset.find({ 
                assignedTo: user._id 
            })
            .select('name qrCodeImage status location')
            .lean();

            return {
                ...user,
                assignedAssets: assignedAssets || []
            };
        }));

        // Filter out users with no assigned assets if needed
         const usersWithAssignedAssets = usersWithAssets.filter(user => user.assignedAssets.length > 0);

        res.json(usersWithAssets);
    } catch (err) {
        console.error('Error in /users-with-assets:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/admin/users/:userId/assets
// @desc    Get all assets assigned to a specific user
// @access  Private (Admin only)
router.get('/users/:userId/assets', [auth, roleCheck('admin')], async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Find all assets assigned to this user
        const assets = await Asset.find({ 
            assignedTo: userId 
        })
        .select('name qrCodeImage status location dateAssigned')
        .sort({ dateAssigned: -1 });

        res.json(assets);
    } catch (err) {
        console.error('Error in /users/:userId/assets:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server error');
    }
});

// @route   GET /api/admin/assets/:assetId/qr-code
// @desc    Get QR code for a specific asset
// @access  Private (Admin only)
router.get('/assets/:assetId/qr-code', [auth, roleCheck('admin')], async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.assetId).select('name qrCodeImage');

        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        if (!asset.qrCodeImage) {
            return res.status(404).json({ msg: 'QR code not found for this asset' });
        }

        const qrCodePath = path.join(__dirname, '..', asset.qrCodeImage);

        // Check if the file exists before sending
        if (!fs.existsSync(qrCodePath)) {
            return res.status(404).json({ msg: 'QR code image not found on the server' });
        }

        // Set correct content type and send the file
        res.sendFile(qrCodePath);
    } catch (err) {
        console.error('Error in /assets/:assetId/qr-code:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        res.status(500).send('Server error');
    }
});



module.exports = router;