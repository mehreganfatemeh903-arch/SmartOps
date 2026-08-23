const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.empty': 'عنوان تسک الزامی است',
      'any.required': 'عنوان تسک الزامی است',
      'string.min': 'عنوان تسک نمی‌تواند خالی باشد',
      'string.max': 'عنوان تسک نباید بیشتر از ۲۰۰ کاراکتر باشد'
    }),

  description: Joi.string()
    .allow('')
    .max(2000)
    .default(''),

  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium'),

  dueDate: Joi.date()
    .allow(null, ''),

  projectId: Joi.string()
    .allow(null, '')
});

const updateTaskSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'عنوان تسک نمی‌تواند خالی باشد'
    }),

  description: Joi.string()
    .allow('')
    .max(2000),

  status: Joi.string()
    .valid('pending', 'done'),

  priority: Joi.string()
    .valid('low', 'medium', 'high'),

  dueDate: Joi.date()
    .allow(null, ''),

  projectId: Joi.string()
    .allow(null, '')
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  validateCreateTask: validate(createTaskSchema),
  validateUpdateTask: validate(updateTaskSchema)
};
