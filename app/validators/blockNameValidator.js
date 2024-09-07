const Joi = require('joi');
const jwt = require('jsonwebtoken');

const addBlockNameSchema = Joi.object({
  secret: Joi.string().required(),
  // .custom((value, helpers) => {
  //   try {
  //     jwt.verify(value, process.env.JWT_SECRET);
  //   } catch (error) {
  //     return helpers.error('any.invalid');
  //   }

  //   return value;
  // }, 'custom validation'),
});

module.exports = {
  addBlockNameSchema,
};
