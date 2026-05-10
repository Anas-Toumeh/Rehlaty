const jwt = require('jsonwebtoken');

// 1. Function to verify token (Authentication)
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, access denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded; 
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// 2. Function to verify permissions (Authorization)
const authorize = (...roles) => {
    return (req, res, next) => {
        // Ensure the role exists in the token
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                msg: `Role ${req.user ? req.user.role : 'unknown'} is not allowed to perform this action` 
            });
        }
        next();
    };
};


module.exports = { auth, authorize };