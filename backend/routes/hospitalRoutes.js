const express = require('express');
const router = express.Router();
const { listHospitals, nearbyHospitals, getHospital } = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');

router.get('/', protect, listHospitals);
router.get('/nearby', protect, nearbyHospitals);
router.get('/:id', protect, getHospital);

module.exports = router;
