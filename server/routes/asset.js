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
const QRCode = require('qrcode');
const User = require('../models/user');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
// Helper function to generate QR code
async function generateQRCode(assetData) {
    const qrData = JSON.stringify({
        id: assetData._id,
        name: assetData.name,
        type: assetData.type,
        location: assetData.location,
        status: assetData.status,
        assignedTo: assetData.assignedToName,
        lastUpdated: assetData.lastUpdated
    });
    
    const qrCodePath = path.join('uploads', 'qrcodes', `${assetData._id}.png`);
    await QRCode.toFile(qrCodePath, qrData);
    return qrCodePath;
}

// Helper function to handle errors
function handleError(err, res) {
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
    
    if (err.code === 11000) {
        return res.status(400).json({ 
            msg: 'Duplicate key error',
            field: Object.keys(err.keyPattern)[0]
        });
    }
    
    console.error('Operation error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
}


// @route   POST /api/assets
// @desc    Add a new asset (Admin only)
// @access  Private (Admin)
router.post('/', auth, roleCheck('admin'), uploadWithErrorHandling([
    { name: 'assetImage', maxCount: 1 }
]), async (req, res) => {
    console.log('Request body:', req.body);

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
        const { name, type, assignedTo, location, status } = req.body;

        // If assignedTo is provided, fetch user details
        let assignedToName = null;
        if (assignedTo) {
            const user = await User.findById(assignedTo);
            if (!user) {
                return res.status(400).json({ msg: 'Assigned user not found' });
            }
            assignedToName = user.username;
        }

        const newAsset = new Asset({
            name,
            type,
            assetImage: req.files && req.files['assetImage'] ? req.files['assetImage'][0].path : null,
            assignedTo,
            assignedToName,
            dateAssigned: assignedTo ? Date.now() : null,
            location,
            status: assignedTo ? 'In Use' : (status || 'Available'),
        });

        // Save asset first to get the ID
        const asset = await newAsset.save();

        // Generate QR code
        const qrCodePath = await generateQRCode(asset);
        asset.qrCodeImage = qrCodePath;
        await asset.save();

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
        handleError(err, res);
    }
});

// @route   GET /api/assets/scan/:id
// @desc    Scan QR code and get asset details
// @access  Private
router.get('/scan/:id', auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }

        const asset = await Asset.findById(req.params.id)
            .populate('assignedTo', 'username');

        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        // Log the scan activity
        await logActivity(
            req.user.id,
            req.user.username,
            asset._id,
            'scanned',
            `Scanned ${asset.type}: ${asset.name}`
        );

        // Return detailed asset information
        const assetDetails = {
            id: asset._id,
            name: asset.name,
            type: asset.type,
            location: asset.location,
            status: asset.status,
            assignedTo: asset.assignedToName,
            dateAssigned: asset.dateAssigned,
            lastUpdated: asset.lastUpdated,
            assetImage: asset.assetImage,
            currentScanner: req.user.username,
            scanTime: new Date()
        };

        res.json(assetDetails);
    } catch (err) {
        handleError(err, res);
    }
});

// @route   PUT /api/assets/:id
// @desc    Update an asset (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, roleCheck('admin'), uploadWithErrorHandling([
    { name: 'assetImage', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid asset ID format' });
        }

        let asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ msg: 'Asset not found' });
        }

        // Save old image paths and status
        const oldAssetImage = asset.assetImage;
        const oldStatus = asset.status;

        // Prepare details for activity log
        let updateDetails = [];
        
        // Update fields if provided
        if (req.body.name && req.body.name !== asset.name) {
            updateDetails.push(`Name changed from "${asset.name}" to "${req.body.name}"`);
            asset.name = req.body.name;
        }
        
        if (req.body.type && req.body.type !== asset.type) {
            updateDetails.push(`Type changed from "${asset.type}" to "${req.body.type}"`);
            asset.type = req.body.type;
        }
        
        if (req.body.assignedTo && req.body.assignedTo !== asset.assignedTo?.toString()) {
            const user = await User.findById(req.body.assignedTo);
            if (!user) {
                return res.status(400).json({ msg: 'Assigned user not found' });
            }
            updateDetails.push(`Reassigned to ${user.username}`);
            asset.assignedTo = req.body.assignedTo;
            asset.assignedToName = user.username;
            asset.dateAssigned = Date.now();
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

        // Handle file upload
        if (req.files && req.files['assetImage']) {
            updateDetails.push('Asset image updated');
            asset.assetImage = req.files['assetImage'][0].path;
            // Delete old image if it exists
            if (oldAssetImage && fs.existsSync(oldAssetImage)) {
                fs.unlinkSync(oldAssetImage);
            }
        }

        // Update QR code with new information
        const qrCodePath = await generateQRCode(asset);
        asset.qrCodeImage = qrCodePath;

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
        
        res.json(asset);
    } catch (err) {
        handleError(err, res);
    }
});


// @route   GET /api/assets
// @desc    Get assets (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const query = {};
        
        // Add filters if provided in query params
        if (req.query.type) query.type = req.query.type;
        if (req.query.status) query.status = req.query.status;
        if (req.query.location) query.location = req.query.location;
        
        // If user is not admin, only show their assigned assets
        if (req.user.role !== 'admin') {
            query.assignedTo = req.user.id;
        } else if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }
        
        const assets = await Asset.find(query)
            .populate('assignedTo', 'username')
            .sort({ lastUpdated: -1 });
            
        res.json(assets);
    } catch (err) {
        handleError(err, res);
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

        // Store asset details for activity log
        const assetType = asset.type;
        const assetName = asset.name;
        const assetId = asset._id;

        // Delete associated files
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
        handleError(err, res);
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

// @route   POST /api/assets/bulk-upload
// @desc    Bulk upload assets
// @access  Private (Admin)
router.post('/bulk-upload', auth, roleCheck('admin'), uploadWithErrorHandling([
    {name: 'file', maxCount: 1}
]), async (req, res) => {
    try {
        if (!req.files || !req.file['file'] || req.files['file'].length === 0) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const file = req.files['file'][0];
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        let results = [];
        let filePath = file.path;


        // parse the file based on its extension 
        if(fileExtension === 'csv') {
            // For CSV FILES
            await new Promise((resolve, reject) => {
                const stream = fs.createReadStream(filePath);
                stream 
                     .pipe(csv())
                     .on('data', (data) => results.push(data))
                     .on('end', resolve)
                     .on('error',  reject);
            });
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
            // For Excel files
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            results = xlsx.utils.sheet_to_json(sheet);
        } else {
            return res.status(400).json({ msg: 'Invalid file type. Please upload a CSV or Excel file' });
        }

        // Process the results
        const processedData = await processBulkUpload(results);
        
        //clean up the temporary file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.json(processedData);

    } catch (err) {
        handleError(err, res);
    }
});

// Helper function to process bulk upload data
async function processBulkUpload(data) {
    const processedCount = data.length;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
  
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row['Asset Name'] || !row['Category'] || !row['Type'] || !row['Location']) {
          throw new Error(`Row ${i+1}: Missing required fields (Asset Name, Category, Type, Location)`);
        }
  
        // Map the row to asset fields
        const assetData = {
          name: row['Asset Name'],
          category: row['Category'],
          subcategory: row['Subcategory'] || '',
          type: row['Type'],
          location: row['Location'],
          status: row['Status'] || 'Available',
          serialNumber: row['Serial Number'] || '',
          purchaseDate: row['Purchase Date (YYYY-MM-DD)'] || '',
          purchasePrice: row['Purchase Price'] || '',
          warranty: row['Warranty (months)'] || '',
          assignedTo: '', // Will be set if username is provided and found
          assignedToName: '',
          dateAssigned: '',
        };
  
        // If assigned to a user, find the user by username
        if (row['Assigned To (Username)']) {
          const user = await User.findOne({ username: row['Assigned To (Username)'] });
          if (user) {
            assetData.assignedTo = user._id;
            assetData.assignedToName = user.username;
            assetData.dateAssigned = Date.now();
            assetData.status = 'In Use';
          } else {
            // User not found, but we still create the asset without assignment
            errors.push(`Row ${i+1}: User '${row['Assigned To (Username)']}' not found. Asset created without assignment.`);
          }
        }
  
        // Create the asset
        const newAsset = new Asset(assetData);
        const asset = await newAsset.save();
  
        // Generate QR code
        const qrCodePath = await generateQRCode(asset);
        asset.qrCodeImage = qrCodePath;
        await asset.save();
  
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`Row ${i+1}: ${err.message}`);
      }
    }
  
    // Return the result
    return {
      success: errorCount === 0,
      processedCount,
      successCount,
      errorCount,
      errors
    };
  }

module.exports = router;