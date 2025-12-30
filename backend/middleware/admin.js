module.exports = function (req, res, next) {
    // 401 Unauthorized
    // 403 Forbidden
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};
