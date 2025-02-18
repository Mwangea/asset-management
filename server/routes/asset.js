const express = require('express');
const router = express.Router();
const roleCheck = require("../middleware/role");
const uploadWithErrorHandling = require("../middleware/upload");
const auth = require('../middleware/auth');
const Asset = require('../models/asset');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const logActivity = require('../middleware/activityLogger');

// @route   POST /api/assets
// @desc    Add a new asset (Admin only)
// @access  Private (Admin)
router.post('/', auth, roleCheck('admin'), uploadWithErrorHandling([
    { name: 'assetImage', maxCount: 1 },
    { name: 'qrCodeImage', maxCount: 1 },
]), async (req, res) => {
    console.log('Request body:', req.body);

    // Validate required fields - add more debug info
    if (!req.body.name || !req.body.type || !req.body.location) {
        return res.status(400).json({ 
            msg: 'Name, type, and location are required fields',
            receivedData: req.body,
            missingFields: {
                name: !req.body.name,
                type: !req.body.type,
                location: !req.body.location
            }
        });
    }

    try {
        const { name, type, assignedTo, assignedToName, dateAssigned, location, status } = req.body;

        const newAsset = new Asset({
            name,
            type,
            assetImage: req.files && req.files['assetImage'] ? req.files['assetImage'][0].path : null,
            qrCodeImage: req.files && req.files['qrCodeImage'] ? req.files['qrCodeImage'][0].path : null,
            assignedTo,
            assignedToName,
            dateAssigned,
            location,
            status,
        });

        const asset = await newAsset.save();
        
        // Log asset creation activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'created',
            `Created new ${type}: ${name}`
        );
        
        res.json(asset);
    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errorMessages = {};
            
            for (const field in err.errors) {
                errorMessages[field] = err.errors[field].message;
            }
            
            return res.status(400).json({ 
                msg: 'Validation failed',
                errors: errorMessages
            });
        }
        
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ 
                msg: 'Duplicate key error',
                field: Object.keys(err.keyPattern)[0]
            });
        }
        
        console.error('Asset creation error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET /api/assets/qr/:qrCodeImage
// @desc    Get an asset by QR code
// @access  Private (Admin and User)
router.get('/qr/:qrCodeImage', auth, async (req, res) => {
    try {
        const asset = await Asset.findOne({ 
            qrCodeImage: { $regex: new RegExp(req.params.qrCodeImage, 'i') } 
        }).populate('assignedTo', 'username');
        
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        // Log asset scan activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'scanned',
            `Scanned ${asset.type}: ${asset.name}`
        );
        
        res.json(asset);
    } catch (err) {
        console.error('Get asset by QR code error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   PUT /api/assets/:id
// @desc    Update an asset (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, roleCheck('admin'), uploadWithErrorHandling([
    { name: 'assetImage', maxCount: 1 },
    { name: 'qrCodeImage', maxCount: 1 },
]), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }

        let asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        // Save old image paths in case we need to delete them
        const oldAssetImage = asset.assetImage;
        const oldQrCodeImage = asset.qrCodeImage;
        const oldStatus = asset.status;

        // Prepare details for activity log
        let updateDetails = [];
        
        // Update fields only if they exist in the request
        if (req.body.name && req.body.name !== asset.name) {
            updateDetails.push(`Name changed from "${asset.name}" to "${req.body.name}"`);
            asset.name = req.body.name;
        }
        
        if (req.body.type && req.body.type !== asset.type) {
            updateDetails.push(`Type changed from "${asset.type}" to "${req.body.type}"`);
            asset.type = req.body.type;
        }
        
        if (req.body.assignedTo && req.body.assignedTo !== asset.assignedTo?.toString()) {
            updateDetails.push(`Reassigned to ${req.body.assignedToName || 'new user'}`);
            asset.assignedTo = req.body.assignedTo;
        }
        
        if (req.body.assignedToName && req.body.assignedToName !== asset.assignedToName) {
            asset.assignedToName = req.body.assignedToName;
        }
        
        if (req.body.dateAssigned) {
            asset.dateAssigned = req.body.dateAssigned;
        }
        
        if (req.body.location && req.body.location !== asset.location) {
            updateDetails.push(`Location changed from "${asset.location}" to "${req.body.location}"`);
            asset.location = req.body.location;
        }
        
        if (req.body.status && req.body.status !== asset.status) {
            updateDetails.push(`Status changed from "${asset.status}" to "${req.body.status}"`);
            asset.status = req.body.status;
        }
        
        asset.lastUpdated = Date.now();

        // Handle file uploads
        if (req.files && req.files['assetImage']) {
            updateDetails.push('Asset image updated');
            asset.assetImage = req.files['assetImage'][0].path;
            // Delete old image if it exists
            if (oldAssetImage && fs.existsSync(oldAssetImage)) {
                fs.unlinkSync(oldAssetImage);
            }
        }
        
        if (req.files && req.files['qrCodeImage']) {
            updateDetails.push('QR code image updated');
            asset.qrCodeImage = req.files['qrCodeImage'][0].path;
            // Delete old QR code image if it exists
            if (oldQrCodeImage && fs.existsSync(oldQrCodeImage)) {
                fs.unlinkSync(oldQrCodeImage);
            }
        }

        // Save the updated asset
        await asset.save();
        
        // Log asset update activity
        if (updateDetails.length > 0) {
            await logActivity(
                req.user.id,
                req.user.username,
                asset._id,
                'updated',
                `Updated ${asset.type}: ${asset.name}. Changes: ${updateDetails.join(', ')}`
            );
        }
        
        // Additionally log status change specifically if it happened
        if (req.body.status && req.body.status !== oldStatus) {
            let actionType;
            switch(req.body.status) {
                case 'In Use':
                    actionType = 'assigned';
                    break;
                case 'Under Maintenance':
                    actionType = 'maintenance';
                    break;
                case 'Available':
                    actionType = 'available';
                    break;
                default:
                    actionType = 'updated';
            }
            
            await logActivity(
                req.user.id,
                req.user.username,
                asset._id,
                actionType,
                `Status changed to ${req.body.status} for ${asset.type}: ${asset.name}`
            );
        }
        
        res.json(asset);
    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const errorMessages = {};
            
            for (const field in err.errors) {
                errorMessages[field] = err.errors[field].message;
            }
            
            return res.status(400).json({ 
                msg: 'Validation failed',
                errors: errorMessages
            });
        }
        
        console.error('Update asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   POST /api/assets/:id/assign
// @desc    Assign asset to a user (Admin only)
// @access  Private (Admin)
router.post('/:id/assign', auth, roleCheck('admin'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }
        
        const { assignedTo, assignedToName } = req.body;
        
        if (!assignedTo || !assignedToName) {
            return res.status(400).json({ msg: 'Assigned user ID and name are required' });
        }
        
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        // Check if already assigned to the same user
        if (asset.assignedTo && asset.assignedTo.toString() === assignedTo && 
            asset.status === 'In Use') {
            return res.status(400).json({ 
                msg: 'Asset is already assigned to this user'
            });
        }
        
        // Update assignment details
        asset.assignedTo = assignedTo;
        asset.assignedToName = assignedToName;
        asset.status = 'In Use';
        asset.dateAssigned = Date.now();
        asset.lastUpdated = Date.now();
        
        await asset.save();
        
        // Log assignment activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'assigned',
            `Assigned ${asset.type}: ${asset.name} to ${assignedToName}`
        );
        
        res.json({
            msg: 'Asset assigned successfully',
            asset
        });
    } catch (err) {
        console.error('Assign asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   POST /api/assets/:id/unassign
// @desc    Unassign asset from a user (Admin only)
// @access  Private (Admin)
router.post('/:id/unassign', auth, roleCheck('admin'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }
        
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        // Check if already unassigned
        if (!asset.assignedTo && asset.status === 'Available') {
            return res.status(400).json({ 
                msg: 'Asset is already unassigned'
            });
        }
        
        // Store the previous assignee for the activity log
        const previousAssignee = asset.assignedToName;
        
        // Update assignment details
        asset.assignedTo = null;
        asset.assignedToName = null;
        asset.status = 'Available';
        asset.lastUpdated = Date.now();
        
        await asset.save();
        
        // Log unassignment activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'unassigned',
            `Unassigned ${asset.type}: ${asset.name} from ${previousAssignee || 'user'}`
        );
        
        res.json({
            msg: 'Asset unassigned successfully',
            asset
        });
    } catch (err) {
        console.error('Unassign asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   POST /api/assets/:id/maintenance
// @desc    Set asset status to Under Maintenance (Admin only)
// @access  Private (Admin)
router.post('/:id/maintenance', auth, roleCheck('admin'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }
        
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        // Check if already under maintenance
        if (asset.status === 'Under Maintenance') {
            return res.status(400).json({ 
                msg: 'Asset is already under maintenance'
            });
        }
        
        // Store previous status for log
        const previousStatus = asset.status;
        const previousAssignee = asset.assignedToName;
        
        // Update status
        asset.status = 'Under Maintenance';
        if (previousStatus === 'In Use') {
            // Keep track of who had it before maintenance
            // but don't actually assign it to them
            asset.assignedTo = null;
            // Keep the name for reference
        }
        asset.lastUpdated = Date.now();
        
        await asset.save();
        
        // Log maintenance activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'maintenance',
            `Set ${asset.type}: ${asset.name} to maintenance status` + 
            (previousStatus === 'In Use' ? ` (previously assigned to ${previousAssignee})` : '')
        );
        
        res.json({
            msg: 'Asset set to maintenance successfully',
            asset
        });
    } catch (err) {
        console.error('Maintenance asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   POST /api/assets/:id/available
// @desc    Set asset status to Available (Admin only)
// @access  Private (Admin)
router.post('/:id/available', auth, roleCheck('admin'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }
        
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        // Check if already available
        if (asset.status === 'Available' && !asset.assignedTo) {
            return res.status(400).json({ 
                msg: 'Asset is already available'
            });
        }
        
        // Store previous status for log
        const previousStatus = asset.status;
        const previousAssignee = asset.assignedToName;
        
        // Update status
        asset.status = 'Available';
        asset.assignedTo = null;
        asset.assignedToName = null;
        asset.lastUpdated = Date.now();
        
        await asset.save();
        
        // Log available activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'available',
            `Set ${asset.type}: ${asset.name} to available status` + 
            (previousStatus === 'In Use' ? ` (previously assigned to ${previousAssignee})` : 
             previousStatus === 'Under Maintenance' ? ' (completed maintenance)' : '')
        );
        
        res.json({
            msg: 'Asset set to available successfully',
            asset
        });
    } catch (err) {
        console.error('Available asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET /api/assets
// @desc    Get all assets
// @access  Private (Admin and User)
router.get('/', auth, async (req, res) => {
    try {
        const query = {};
        
        // Add filters if provided in query params
        if (req.query.type) query.type = req.query.type;
        if (req.query.status) query.status = req.query.status;
        if (req.query.location) query.location = req.query.location;
        if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
        
        const assets = await Asset.find(query).populate('assignedTo', 'username');
        res.json(assets);
    } catch (err) {
        console.error('Get all assets error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   GET /api/assets/:id
// @desc    Get a single asset by ID
// @access  Private (Admin and User)
router.get('/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }

        const asset = await Asset.findById(req.params.id).populate('assignedTo', 'username');
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        res.json(asset);
    } catch (err) {
        console.error('Get asset by ID error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   DELETE /api/assets/:id
// @desc    Delete an asset (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }

        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        // Store asset details for activity log before deletion
        const assetType = asset.type;
        const assetName = asset.name;
        const assetId = asset._id;

        // Delete associated image files
        if (asset.assetImage && fs.existsSync(asset.assetImage)) {
            fs.unlinkSync(asset.assetImage);
        }
        
        if (asset.qrCodeImage && fs.existsSync(asset.qrCodeImage)) {
            fs.unlinkSync(asset.qrCodeImage);
        }

        await asset.deleteOne();
        
        // Log deletion activity
        await logActivity(
            req.user.id,
            req.user.username,
            assetId,
            'deleted',
            `Deleted ${assetType}: ${assetName}`
        );
        
        res.json({ msg: 'Asset removed successfully' });
    } catch (err) {
        console.error('Delete asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// @route   POST /api/assets/scan
// @desc    Record an asset scan
// @access  Private (User and Admin)
router.post('/scan', auth, async (req, res) => {
    try {
        const { assetId, scanLocation } = req.body;
        
        if (!assetId) {
            return res.status(400).json({ msg: 'Asset ID is required' });
        }
        
        if (!mongoose.Types.ObjectId.isValid(assetId)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }
        
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        
        // Log scan activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'scanned',
            `Scanned ${asset.type}: ${asset.name}` + 
            (scanLocation ? ` at ${scanLocation}` : '')
        );
        
        res.json({
            msg: 'Asset scan recorded successfully',
            asset
        });
    } catch (err) {
        console.error('Scan recording error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;