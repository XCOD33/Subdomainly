const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const validateRequest = require('../middleware/validateRequest');
const { addDomainSchema } = require('../validators/domainValidator');

router.post('/add', validateRequest(addDomainSchema), domainController.addDomain);

module.exports = router;
