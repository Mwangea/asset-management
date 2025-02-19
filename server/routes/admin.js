const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');


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

module.exports = router;