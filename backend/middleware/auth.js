const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in environment variables');
}

function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization;

    // اگر توکن وجود ندارد
    if (!header) {
      if (!required) return next();
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, JWT_SECRET);

      // قرار دادن اطلاعات کاربر در req.user
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role
      };

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = auth;
