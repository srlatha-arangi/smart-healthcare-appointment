const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');

const ACTIVE_STATUSES = ['REQUEST_CREATED', 'HOSPITAL_NOTIFIED', 'ACCEPTED', 'AMBULANCE_ASSIGNED', 'ON_THE_WAY', 'ARRIVED_AT_PATIENT', 'PATIENT_PICKED_UP'];

// Helper: emit a status update to both the patient room and the hospital room
function broadcastUpdate(req, request) {
  const io = req.app.get('io');
  if (!io) return;
  const payload = {
    requestId: request._id,
    emergencyId: request.emergencyId,
    emergencyStatus: request.emergencyStatus,
    ambulanceStatus: request.ambulanceStatus,
    ambulanceCurrentLat: request.ambulanceCurrentLat,
    ambulanceCurrentLng: request.ambulanceCurrentLng,
    ambulanceId: request.ambulanceId
  };
  io.to(`patient:${request.patientId}`).emit('emergency:status_update', payload);
  io.to(`hospital:${request.hospitalId}`).emit('emergency:status_update', payload);
}

// GET /api/hospital-dashboard/requests - all incoming/active requests for the staff member's hospital
exports.getIncomingRequests = async (req, res, next) => {
  try {
    if (!req.user.hospitalId) {
      return res.status(400).json({ success: false, message: 'This account is not linked to a hospital' });
    }

    const requests = await EmergencyRequest.find({
      hospitalId: req.user.hospitalId,
      emergencyStatus: { $in: ACTIVE_STATUSES }
    })
      .populate('patientId', 'name phone medicalProfile')
      .sort({ severity: -1, createdAt: 1 });

    res.json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};

// POST /api/hospital-dashboard/requests/:id/accept
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.hospitalId) !== String(req.user.hospitalId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this hospital' });
    }
    if (request.emergencyStatus !== 'HOSPITAL_NOTIFIED') {
      return res.status(400).json({ success: false, message: `Cannot accept a request in status ${request.emergencyStatus}` });
    }

    request.emergencyStatus = 'ACCEPTED';
    request.acceptedAt = new Date();
    await request.save();

    broadcastUpdate(req, request);
    res.json({ success: true, message: 'Request accepted', emergencyRequest: request });
  } catch (err) {
    next(err);
  }
};

// POST /api/hospital-dashboard/requests/:id/reject
exports.rejectRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.hospitalId) !== String(req.user.hospitalId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this hospital' });
    }

    request.emergencyStatus = 'REJECTED';
    request.rejectionReason = reason || 'Hospital unable to accept at this time';
    await request.save();

    broadcastUpdate(req, request);

    const io = req.app.get('io');
    if (io) {
      io.to(`patient:${request.patientId}`).emit('emergency:rejected', {
        requestId: request._id,
        reason: request.rejectionReason
      });
    }

    res.json({ success: true, message: 'Request rejected', emergencyRequest: request });
  } catch (err) {
    next(err);
  }
};

// POST /api/hospital-dashboard/requests/:id/assign-ambulance
exports.assignAmbulance = async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.hospitalId) !== String(req.user.hospitalId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this hospital' });
    }
    if (request.emergencyStatus !== 'ACCEPTED') {
      return res.status(400).json({ success: false, message: 'Request must be accepted before assigning an ambulance' });
    }

    const hospital = await Hospital.findById(request.hospitalId);
    if (hospital.availableAmbulances < 1) {
      return res.status(409).json({ success: false, message: 'No ambulances currently available at this hospital' });
    }

    hospital.availableAmbulances -= 1;
    await hospital.save();

    request.emergencyStatus = 'AMBULANCE_ASSIGNED';
    request.ambulanceStatus = 'ASSIGNED';
    request.ambulanceAssignedAt = new Date();
    request.ambulanceId = `AMB-${Math.floor(1000 + Math.random() * 9000)}`;
    // Mock starting ambulance position at the hospital
    request.ambulanceCurrentLat = hospital.latitude;
    request.ambulanceCurrentLng = hospital.longitude;
    await request.save();

    broadcastUpdate(req, request);
    res.json({ success: true, message: 'Ambulance assigned', emergencyRequest: request });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/hospital-dashboard/requests/:id/status
// Advances the ambulance through: ON_THE_WAY -> ARRIVED_AT_PATIENT -> PATIENT_PICKED_UP -> ARRIVED_AT_HOSPITAL
// Also accepts optional mock ambulanceLat/ambulanceLng for live tracking simulation.
exports.updateStatus = async (req, res, next) => {
  try {
    const { emergencyStatus, ambulanceLat, ambulanceLng } = req.body;
    const validTransitions = ['ON_THE_WAY', 'ARRIVED_AT_PATIENT', 'PATIENT_PICKED_UP', 'ARRIVED_AT_HOSPITAL'];

    if (!validTransitions.includes(emergencyStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' });
    }

    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (String(request.hospitalId) !== String(req.user.hospitalId)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this hospital' });
    }

    request.emergencyStatus = emergencyStatus;

    const ambulanceStatusMap = {
      ON_THE_WAY: 'EN_ROUTE_TO_PATIENT',
      ARRIVED_AT_PATIENT: 'ARRIVED',
      PATIENT_PICKED_UP: 'PATIENT_ONBOARD',
      ARRIVED_AT_HOSPITAL: 'COMPLETED'
    };
    request.ambulanceStatus = ambulanceStatusMap[emergencyStatus];

    if (emergencyStatus === 'ARRIVED_AT_PATIENT') request.arrivalTime = new Date();
    if (emergencyStatus === 'PATIENT_PICKED_UP') request.pickedUpAt = new Date();
    if (emergencyStatus === 'ARRIVED_AT_HOSPITAL') {
      request.hospitalArrivalTime = new Date();
      // Return the ambulance to the available pool
      const hospital = await Hospital.findById(request.hospitalId);
      if (hospital) {
        hospital.availableAmbulances = Math.min(hospital.totalAmbulances, hospital.availableAmbulances + 1);
        await hospital.save();
      }
    }

    if (typeof ambulanceLat === 'number' && typeof ambulanceLng === 'number') {
      request.ambulanceCurrentLat = ambulanceLat;
      request.ambulanceCurrentLng = ambulanceLng;
    }

    await request.save();
    broadcastUpdate(req, request);
    res.json({ success: true, message: `Status updated to ${emergencyStatus}`, emergencyRequest: request });
  } catch (err) {
    next(err);
  }
};
