const Joi = require('joi');
const mongoose = require('mongoose');

// Validate ObjectId in route params (e.g. /admin/users/:id)
const objectIdParamValidation = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid id provided.',
    });
  }

  next();
};

// Schema: pagination and search for GET /admin/users
const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number.',
    'number.min': 'Page must be at least 1.',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number.',
    'number.max': 'Maximum limit is 100.',
  }),
  search: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Search term must not exceed 100 characters.',
  }),
  sortBy: Joi.string()
    .valid('createdAt', 'name', 'email')
    .default('createdAt')
    .messages({
      'any.only': 'Invalid sort field.',
    }),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Sort order must be asc or desc.',
  }),
});

// Schema: date range filter for GET /admin/tasks-by-priority
const taskStatsQuerySchema = Joi.object({
  from: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format (e.g. 2025-01-01).',
  }),
  to: Joi.date().iso().min(Joi.ref('from')).optional().messages({
    'date.format': 'End date must be in ISO format.',
    'date.min': 'End date cannot be before start date.',
  }),
});

// Schema: update user role (PATCH /admin/users/:id/role)
const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'admin').required().messages({
    'any.only': 'Invalid role. Allowed values: user, admin',
    'any.required': 'Role is required.',
    'string.empty': 'Role cannot be empty.',
  }),
});

// Schema: update user status (PATCH /admin/users/:id/status)
const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'inactive').required().messages({
    'any.only': 'Invalid status. Allowed values: active, suspended, inactive',
    'any.required': 'Status is required.',
    'string.empty': 'Status cannot be empty.',
  }),
  reason: Joi.string().max(500).optional().allow('').messages({
    'string.max': 'Reason must not exceed 500 characters.',
  }),
});

// Generic middlewares
const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map((d) => d.message),
    });
  }

  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Query validation error',
      errors: error.details.map((d) => d.message),
    });
  }

  req.query = value;
  next();
};

module.exports = {
  objectIdParamValidation,
  listUsersQuerySchema,
  taskStatsQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  validateBody,
  validateQuery,
};
