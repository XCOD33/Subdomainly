const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyJWT = require('../middleware/verifyJwt');

router.get('/domain', verifyJWT, adminController.getAllDomain);
router.post('/domain', verifyJWT, adminController.storeDomain);
router.post('/domain/:domain', verifyJWT, adminController.deleteDomain);

router.get('/subdomain', verifyJWT, adminController.getAllSubdomain);
router.get('/subdomain/:subdomain', verifyJWT, adminController.getSubdomain);
router.post('/subdomain', verifyJWT, adminController.storeSubdomain);
router.post('/subdomain/:subdomain/update', verifyJWT, adminController.updateSubdomain);
router.post('/subdomain/:subdomain/delete', verifyJWT, adminController.deleteSubdomain);

router.get('/blocked-name', verifyJWT, adminController.getAllBlockedName);
router.post('/blocked-name', verifyJWT, adminController.storeBlockedName);
router.post('/blocked-name/:name/update', verifyJWT, adminController.updateBlockedName);
router.post('/blocked-name/:name/delete', verifyJWT, adminController.deleteBlockedName);

module.exports = router;
