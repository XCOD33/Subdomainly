const Joi = require('joi');
const fs = require('fs');
const path = require('path');
const { isPublicIP } = require('../helpers/utilities');

const blockedSubdomainPath = path.join(__dirname, '../../config/blockedSubdomains.json');
const blockedSubdomains = JSON.parse(
  fs.readFileSync(blockedSubdomainPath, 'utf-8')
).blocked_subdomains;

const searchSubdomainSchema = Joi.object({
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .required()
    .custom((value, helpers) => {
      if (blockedSubdomains.includes(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
});

const createSubdomainSchema = Joi.object({
  domain: Joi.string().required(),
  name: Joi.string()
    .pattern(/^(?!-)[a-z0-9-]+(?<!-)$/)
    .max(256)
    .required()
    .custom((value, helpers) => {
      if (blockedSubdomains.includes(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
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
    .optional()
    .custom((value, helpers) => {
      if (blockedSubdomains.includes(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
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

const reportSubdomainSchema = Joi.object({
  id: Joi.string().required().messages({
    'string.empty': 'Subdomain ID is required.',
    'any.required': 'Subdomain ID is required.',
  }),
  reason: Joi.string().required().max(255).messages({
    'string.empty': 'Reason is required.',
    'any.required': 'Reason is required.',
    'string.max': 'Reason should not exceed 255 characters.',
  }),
});

const deleteSubdomainWithSecretSchema = Joi.object({
  secret: Joi.string().required().messages({
    'string.empty': 'Secret is required.',
    'any.required': 'Secret is required.',
  }),
});

module.exports = {
  searchSubdomainSchema,
  createSubdomainSchema,
  updateSubdomainSchema,
  deleteSubdomainSchema,
  reportSubdomainSchema,
  deleteSubdomainWithSecretSchema,
};
