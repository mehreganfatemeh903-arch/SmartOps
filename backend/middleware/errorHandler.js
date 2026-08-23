function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // ------------------ Mongoose Validation Error ------------------
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }

  // ------------------ Mongoose CastError (invalid ObjectId) ------------------
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }

  // ------------------ Duplicate key error (e.g. email already exists) ------------------
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate value',
      field: err.keyValue
    });
  }

  // ------------------ JWT Errors ------------------
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // ------------------ Default Error ------------------
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
