const express = require('express');
const router = express.Router();
const {
  requestAmbulance,
  getEmergencyRequest,
  getMyActiveRequest,
  getMyHistory,
  cancelRequest
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');
const { emergencyLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// POST /api/emergency/request-ambulance
router.post('/request-ambulance', protect, emergencyLimiter, upload.single('accidentImage'), requestAmbulance);

router.get('/my-active', protect, getMyActiveRequest);
router.get('/history', protect, getMyHistory);
router.get('/:id', protect, getEmergencyRequest);
router.post('/:id/cancel', protect, cancelRequest);

module.exports = router;
