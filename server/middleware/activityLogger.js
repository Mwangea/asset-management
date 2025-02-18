const ActivityLog = require('../models/activitylog');

/**
 * Log an activity related to an asset
 * @param {String} userId - The ID of the user performing the action
 * @param {String} username - The username of the user performing the action
 * @param {String} assetId - The ID of the asset involved
 * @param {String} action - The type of action performed (created, updated, deleted, scanned, assigned, unassigned, maintenance, available)
 * @param {String} details - Additional details about the action
 */
const logActivity = async (userId, username, assetId, action, details = null) => {
  try {
    const newActivity = new ActivityLog({
      user: userId,
      username,
      asset: assetId,
      action,
      details
    });
    
    await newActivity.save();
    console.log(`Activity logged: ${action} - ${details}`);
  } catch (err) {
    console.error('Activity logging error:', err);
    // We don't want to reject the main operation if logging fails
  }
};

module.exports = logActivity;