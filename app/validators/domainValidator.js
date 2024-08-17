const Joi = require('joi');

const addDomainSchema = Joi.object({
  domain: Joi.string().required(),
  zoneId: Joi.string().required(),
});

module.exports = {
  addDomainSchema,
};
