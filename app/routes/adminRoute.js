const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyJWT = require('../middleware/verifyJwt');

router.get('/domain', verifyJWT, adminController.getAllDomain);
router.post('/domain', verifyJWT, adminController.storeDomain);
router.post('/domain/:domain', verifyJWT, adminController.deleteDomain);

module.exports = router;
