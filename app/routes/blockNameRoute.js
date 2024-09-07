const express = require('express');
const router = express.Router();
const blockNameController = require('../controllers/blockNameController');
const validateRequest = require('../middleware/validateRequest');
const { addBlockNameSchema } = require('../validators/blockNameValidator');
const validateRequestParam = require('../middleware/validateRequestParam');

router.get('/lists', blockNameController.lists);
router.get('/add', validateRequestParam(addBlockNameSchema), blockNameController.add);

module.exports = router;
