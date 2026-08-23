const Joi = require('joi');
const mongoose = require('mongoose');

// Schema for creating a new project (POST /api/projects)
const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Project name is required',
    'string.min': 'Project name must be at least 2 characters',
    'string.max': 'Project name must not exceed 100 characters',
    'any.required': 'Project name is required'
  }),
  description: Joi.string().trim().max(1000).allow('', null).messages({
    'string.max': 'Description must not exceed 1000 characters'
  })
});

// Schema for updating a project (PUT /api/projects/:id)
// All fields optional, but at least one must be sent
const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Project name must be at least 2 characters',
    'string.max': 'Project name must not exceed 100 characters'
  }),
  description: Joi.string().trim().max(1000).allow('', null).messages({
    'string.max': 'Description must not exceed 1000 characters'
  })
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be sent for update'
  });

// Validates a MongoDB ObjectId in the route param (:id)
function validateObjectIdParam(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ error: 'Invalid id provided' });
    }
    next();
  };
}

// General middleware to validate request body with a Joi schema
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({ error: 'Invalid input data', details });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  validateObjectIdParam,
  validateBody
};
