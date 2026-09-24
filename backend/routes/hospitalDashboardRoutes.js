const express = require('express');
const router = express.Router();
const {
  getIncomingRequests,
  acceptRequest,
  rejectRequest,
  assignAmbulance,
  updateStatus
} = require('../controllers/hospitalDashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('hospital_staff', 'admin'));

router.get('/requests', getIncomingRequests);
router.post('/requests/:id/accept', acceptRequest);
router.post('/requests/:id/reject', rejectRequest);
router.post('/requests/:id/assign-ambulance', assignAmbulance);
router.patch('/requests/:id/status', updateStatus);

module.exports = router;
