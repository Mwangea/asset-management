const ActivityLog = require('../models/activitylog');

/**
 * Remove URLs from scan details
 * @param {String} details - The details string that might contain URLs
 * @returns {String} Cleaned details without URLs
 */
const removeUrls = (details) => {
  if (!details) return details;
  
  // Remove http/https URLs
  return details.replace(/https?:\/\/[^\s]+/g, '').trim();
};

/**
 * Log an activity related to an asset and clean up old logs
 * @param {String} userId - The ID of the user performing the action
 * @param {String} username - The username of the user performing the action
 * @param {String} assetId - The ID of the asset involved
 * @param {String} action - The type of action performed
 * @param {String} details - Additional details about the action
 */
const logActivity = async (userId, username, assetId, action, details = null) => {
  try {
    // Clean the details by removing URLs
    const cleanedDetails = removeUrls(details);
    
    // Create new activity log
    const newActivity = new ActivityLog({
      user: userId,
      username,
      asset: assetId,
      action,
      details: cleanedDetails
    });
    
    await newActivity.save();
    console.log(`Activity logged: ${action} - ${cleanedDetails}`);

    // Clean up old logs (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    await ActivityLog.deleteMany({ timestamp: { $lt: tenMinutesAgo } });

  } catch (err) {
    console.error('Activity logging error:', err);
    // We don't want to reject the main operation if logging fails
  }
};

module.exports = logActivity;