const express = require('express');
const router = express.Router();
const roleCheck = require("../middleware/role");
const uploadWithErrorHandling = require("../middleware/upload");
const auth = require('../middleware/auth');
const Asset = require('../models/asset');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

        // Update fields only if they exist in the request
        if (req.body.name) asset.name = req.body.name;
        if (req.body.type) asset.type = req.body.type;
        if (req.body.assignedTo) asset.assignedTo = req.body.assignedTo;
        if (req.body.assignedToName) asset.assignedToName = req.body.assignedToName;
        if (req.body.dateAssigned) asset.dateAssigned = req.body.dateAssigned;
        if (req.body.location) asset.location = req.body.location;
        if (req.body.status) asset.status = req.body.status;
        asset.lastUpdated = Date.now();

        // Handle file uploads
        if (req.files && req.files['assetImage']) {
            asset.assetImage = req.files['assetImage'][0].path;
            // Delete old image if it exists
            if (oldAssetImage && fs.existsSync(oldAssetImage)) {
                fs.unlinkSync(oldAssetImage);
            }
        }
        
        if (req.files && req.files['qrCodeImage']) {
            asset.qrCodeImage = req.files['qrCodeImage'][0].path;
            // Delete old QR code image if it exists
            if (oldQrCodeImage && fs.existsSync(oldQrCodeImage)) {
                fs.unlinkSync(oldQrCodeImage);
            }
        }

        await asset.save();
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

        // Delete associated image files
        if (asset.assetImage && fs.existsSync(asset.assetImage)) {
            fs.unlinkSync(asset.assetImage);
        }
        
        if (asset.qrCodeImage && fs.existsSync(asset.qrCodeImage)) {
            fs.unlinkSync(asset.qrCodeImage);
        }

        await asset.deleteOne();
        res.json({ msg: 'Asset removed successfully' });
    } catch (err) {
        console.error('Delete asset error:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;