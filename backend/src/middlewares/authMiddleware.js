const jwt = require('jsonwebtoken');

// Middleware to protect private routes
const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token from the header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token using our secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the decoded user payload to the request object
      // The decoded payload contains the 'id' we embedded in authController
      req.user = decoded;

      // Move to the next middleware or route handler
      next();
    } catch (error) {
      console.error('JWT verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
