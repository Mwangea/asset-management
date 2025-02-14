const roleCheck = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ msg: 'Access denied' });
    }
    next();
};

module.exports = roleCheck;