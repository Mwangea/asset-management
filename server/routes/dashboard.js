const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/role');
const Asset = require('../models/asset');
const mongoose = require('mongoose');
const ActivityLog = require('../models/activitylog'); // You'll need to create this model

// @route   GET /api/dashboard/stats
// @desc    Get asset statistics for dashboard
// @access  Private (Admin and User)
router.get('/stats', auth, async (req, res) => {
  try {
    // Get total count of assets
    const totalAssets = await Asset.countDocuments();
    
    // Get count of assets by status - using your specific enum values
    const assetsInUse = await Asset.countDocuments({ status: 'In Use' });
    const availableAssets = await Asset.countDocuments({ status: 'Available' });
    const assetsUnderMaintenance = await Asset.countDocuments({ status: 'Under Maintenance' });
    const reservableAssets = await Asset.countDocuments({ status: 'Reservable'});
    
    // Get distribution by type
    const assetTypes = await Asset.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const assetDistribution = assetTypes.map(item => ({
      type: item._id,
      count: item.count
    }));
    
    // Get distribution by location
    const locationDistribution = await Asset.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      totalAssets,
      assetsInUse,
      availableAssets,
      assetsUnderMaintenance,
      reservableAssets,
      assetDistribution,
      locationDistribution
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activities for dashboard
// @access  Private (Admin and User)
router.get('/recent-activity', auth, async (req, res) => {
  try {
    // Limit to the most recent 10 activities
    const recentActivities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'username')
      .populate('asset', 'name type');
    
    res.json(recentActivities);
  } catch (err) {
    console.error('Recent activity error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET /api/dashboard/admin
// @desc    Admin dashboard with comprehensive stats
// @access  Private (Admin only)
router.get('/admin', auth, roleCheck('admin'), async (req, res) => {
  try {
    // Get all basic stats
    const totalAssets = await Asset.countDocuments();
    const assetsInUse = await Asset.countDocuments({ status: 'In Use' });
    const availableAssets = await Asset.countDocuments({ status: 'Available' });
    const assetsUnderMaintenance = await Asset.countDocuments({ status: 'Under Maintenance' });
    const reservableAssets = await Asset.countDocuments({ status: 'Reservable'});
    
    // Get distribution by type
    const assetTypes = await Asset.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get distribution by location
    const assetLocations = await Asset.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent activities
    const recentActivities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('user', 'username')
      .populate('asset', 'name type');
    
    // Get assets assigned to each user (for admin to see who has what)
    const userAssetDistribution = await Asset.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedToName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 } // Top 10 users with most assets
    ]);
    
    res.json({
      stats: {
        totalAssets,
        assetsInUse,
        availableAssets,
        assetsUnderMaintenance,
        reservableAssets,
      },
      distributions: {
        byType: assetTypes.map(item => ({ type: item._id, count: item.count })),
        byLocation: assetLocations.map(item => ({ location: item._id, count: item.count })),
        byUser: userAssetDistribution.map(item => ({ user: item._id, count: item.count }))
      },
      recentActivities
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET /api/dashboard/user
// @desc    User dashboard with user-specific stats
// @access  Private (User)
router.get('/user', auth, async (req, res) => {
  try {
    // Get assets assigned to this user
    const userId = req.user.id;
    const userAssets = await Asset.find({ assignedTo: userId });
    
    // Get recent activities by this user
    const userActivities = await ActivityLog.find({ user: userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('asset', 'name type');
    
    res.json({
      userAssets,
      assetCount: userAssets.length,
      recentActivities: userActivities
    });
  } catch (err) {
    console.error('User dashboard error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;