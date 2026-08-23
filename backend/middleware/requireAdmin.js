function requireAdmin(req, res, next) {
  // User must be authenticated
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  // User must have admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }

  next();
}

module.exports = requireAdmin;