const Joi = require('joi');
const { isPublicIP } = require('../helpers/utilities');

const createSubdomainSchema = Joi.object({
  domain: Joi.string().required(),
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .required(),
  content: Joi.string()
    .custom((value, helpers) => {
      if (!isPublicIP(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required(),
  type: Joi.string().valid('A', 'AAAA', 'CNAME').required(),
});

const updateSubdomainSchema = Joi.object({
  prevSubdomain: Joi.string().required(),
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .optional(),
  content: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (!isPublicIP(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  type: Joi.string().valid('A', 'AAAA', 'CNAME').optional(),
  securityCode: Joi.string().required(),
});

const deleteSubdomainSchema = Joi.object({
  prevSubdomain: Joi.string().required(),
  securityCode: Joi.string().required(),
});

module.exports = {
  createSubdomainSchema,
  updateSubdomainSchema,
  deleteSubdomainSchema,
};
