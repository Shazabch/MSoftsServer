const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'msofts';
const authenticate = (req, res, next) => {
const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { 
      clockTolerance: 60 
    });
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', {
      name: error.name,
      message: error.message
    });
        if (error.name === 'TokenExpiredError') {
      try {
        const decoded = jwt.decode(token);
       
      } catch (decodeErr) {
        console.error('Could not decode expired token:', decodeErr);
      }
      
      return res.status(401).json({ 
        message: 'Unauthorized: Token expired',
        expired: true
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    } else {
      return res.status(401).json({ message: 'Unauthorized: Token verification failed' });
    }
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Forbidden: Super Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireSuperAdmin, JWT_SECRET };