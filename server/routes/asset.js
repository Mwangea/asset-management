const express = require('express');
const router = express.Router();
const roleCheck = require("../middleware/role");
const upload = require("../middleware/upload");
const auth = require('../middleware/auth');


// @route   POST /api/assets
// @desc    Add a new asset (Admin only)
// @access  Private (Admin)
router.post('/', auth, roleCheck('admin'), upload.fields([
    { name: 'assetImage', maxCount: 1},
    { name: 'qrCodeImage', maxCount: 1},
]), async (req, res) => {
    const { name, type, assignedTo, assignedToName,dateAssigned,location,status} = req.body;

    try{
        const newAsset = new Asset ({
            name,
            type,
            assetImage: req.files['assetImage'] ? req.files['assetImage'][0].path : null,
            qrCodeImage: req.files['qrCodeImage'] ? req.files['qrCodeImage'][0].path : null,
            assignedTo,
            assignedToName,
            dateAssigned,
            location,
            status,
        });

        const asset = await newAsset.save();
        res.json(asset);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route   GET /api/assets/qr/:qrCodeImage
// @desc    Get an asset by QR code
// @access  Private (Admin and User)
router.get('/qr/:qrCodeImage', auth, async (req, res) => {
    try {
        const asset = await Asset.findOne({ qrCodeImage: req.params.qrCodeImage }).populate('assignedTo', 'username');
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        res.json(asset);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/assets/:id
// @desc    Update an asset (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, roleCheck('admin'), upload.fields([
    { name: 'assetImage', maxCount: 1 },
    { name: 'qrCodeImage', maxCount: 1 },
]), async (req, res) => {
    const { name, type, assignedTo, assignedToName, dateAssigned, location, status } = req.body;

    try {
        let asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        asset.name = name || asset.name;
        asset.type = type || asset.type;
        asset.assignedTo = assignedTo || asset.assignedTo;
        asset.assignedToName = assignedToName || asset.assignedToName;
        asset.dateAssigned = dateAssigned || asset.dateAssigned;
        asset.location = location || asset.location;
        asset.status = status || asset.status;
        asset.lastUpdated = Date.now();

        if (req.files['assetImage']) {
            asset.assetImage = req.files['assetImage'][0].path;
        }
        if (req.files['qrCodeImage']) {
            asset.qrCodeImage = req.files['qrCodeImage'][0].path;
        }

        await asset.save();
        res.json(asset);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/assets
// @desc    Get all assets
// @access  Private (Admin and User)
router.get('/', auth, async (req, res) => {
    try {
        const assets = await Asset.find().populate('assignedTo', 'username');
        res.json(assets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/assets/:id
// @desc    Get a single asset by ID
// @access  Private (Admin and User)
router.get('/:id', auth, async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('assignedTo', 'username');
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }
        res.json(asset);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/assets/:id
// @desc    Delete an asset (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        await asset.remove();
        res.json({ msg: 'Asset removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;