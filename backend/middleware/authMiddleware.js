const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Look for the token in the headers
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        // Verify the token using our secret key
        // We split it because tokens are usually sent as "Bearer <token>"
        const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        
        // Attach the user info to the request so we can use it in the next route
        req.user = verified; 
        next(); // Let them pass!
    } catch (error) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports = verifyToken;