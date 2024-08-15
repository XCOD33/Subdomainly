const express = require('express');
const router = express.Router();
const backendController = require('../controllers/backendController');

router.post('/search', backendController.search);
router.post('/add-domain', backendController.addDomain);
router.post('/create', backendController.create);
router.post('/update', backendController.update);

module.exports = router;
