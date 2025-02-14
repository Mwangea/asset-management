const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');

// @route   GET /api/dashboard/admin
// @desc    Admin dashboard
// @access  Private (Admin only)
router.get('/admin', auth, roleCheck('admin'), (req, res) => {
    res.json({ msg: 'Welcome to the Admin Dashboard' });
});

// @route   GET /api/dashboard/user
// @desc    User dashboard
// @access  Private (User only)
router.get('/user', auth, roleCheck('user'), (req, res) => {
    res.json({ msg: 'Welcome to the User Dashboard' });
});

module.exports = router;