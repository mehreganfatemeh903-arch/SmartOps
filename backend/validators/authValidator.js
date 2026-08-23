
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'ایمیل معتبر نیست',
    'any.required': 'ایمیل الزامی است'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'رمز عبور باید حداقل ۶ کاراکتر باشد',
    'any.required': 'رمز عبور الزامی است'
  }),
  name: Joi.string().allow('').max(100)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'ایمیل معتبر نیست',
    'any.required': 'ایمیل الزامی است'
  }),
  password: Joi.string().required().messages({
    'any.required': 'رمز عبور الزامی است'
  })
});

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
}

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema)
};