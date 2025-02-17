const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    name: {
        type: String,
        required:true,
    },
    type: {
        type: String,
        required: true,
    },
    assetImage: {
        type: String,
    },
    qrCodeImage: {
        type: String,
        unique: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedToName: {
        type: String,
    },
    dateAssigned: {
        type: Date,
    },
    location: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['In Use', 'Under Maintenance', 'Available'],
        default: 'Available',
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },

});

module.exports = mongoose.model('Asset', AssetSchema);