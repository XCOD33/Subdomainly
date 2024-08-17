const express = require('express');
const router = express.Router();
const subdomainController = require('../controllers/subdomainController');
const validateRequest = require('../middleware/validateRequest');
const {
  searchSubdomainSchema,
  createSubdomainSchema,
  updateSubdomainSchema,
  deleteSubdomainSchema,
} = require('../validators/subdomainValidator');

router.post('/search', validateRequest(searchSubdomainSchema), subdomainController.search);
router.post('/create', validateRequest(createSubdomainSchema), subdomainController.create);
router.put('/update', validateRequest(updateSubdomainSchema), subdomainController.update);
router.delete('/delete', validateRequest(deleteSubdomainSchema), subdomainController.delete);

module.exports = router;
