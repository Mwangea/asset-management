const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    assetImage: {
        type: String,
    },
    qrCodeImage: {
        type: String,
        required: true,  // Now explicitly required
        unique: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedToName: {
        type: String,
        trim: true
    },
    dateAssigned: {
        type: Date,
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ['In Use', 'Under Maintenance', 'Available'],
            message: '{VALUE} is not a valid status. Valid statuses are: In Use, Under Maintenance, Available'
        },
        default: 'Available',
        set: function(value) {
            // Handle case insensitivity by capitalizing the first letter of each word
            if (typeof value === 'string') {
                return value.split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ');
            }
            return value;
        }
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Asset', AssetSchema);