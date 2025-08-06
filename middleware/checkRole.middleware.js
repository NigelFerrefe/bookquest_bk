

const checkRole = (requiredRole) => (req, res, next) => {
    // El payload del usuario viene en req.payload porque el middleware isAuthenticated lo añade
    if (!req.payload) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    if (req.payload.role !== requiredRole) {
      return res.status(403).json({ message: "You are not authorized to perform this action" });
    }
  
    next();
  };
  
  module.exports = checkRole;
  