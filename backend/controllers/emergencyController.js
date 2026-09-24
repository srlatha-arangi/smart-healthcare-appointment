const Hospital = require('../models/Hospital');
const EmergencyRequest = require('../models/EmergencyRequest');
const selectNearestSuitableHospitals = require('../utils/hospitalSelector');

const ACTIVE_STATUSES = [
  'REQUEST_CREATED',
  'HOSPITAL_NOTIFIED',
  'ACCEPTED',
  'AMBULANCE_ASSIGNED',
  'ON_THE_WAY',
  'ARRIVED_AT_PATIENT',
  'PATIENT_PICKED_UP'
];

// POST /api/emergency/request-ambulance
exports.requestAmbulance = async (req, res, next) => {
  try {
    const { latitude, longitude, currentAddress, symptoms, severity, emergencyContact } = req.body;

    // --- Validate location ---
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid current location (latitude/longitude) is required. Please enable GPS/location permissions.' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: 'Location coordinates are out of range' });
    }

    // --- Validate emergency info ---
    if (!symptoms || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: 'Please describe the emergency symptoms' });
    }
    if (!severity || !['Low', 'Moderate', 'High', 'Critical'].includes(severity)) {
      return res.status(400).json({ success: false, message: 'A valid severity level is required' });
    }
    if (!emergencyContact || !emergencyContact.trim()) {
      return res.status(400).json({ success: false, message: 'An emergency contact number is required' });
    }

    // --- Prevent duplicate active requests from the same patient ---
    const existingActive = await EmergencyRequest.findOne({
      patientId: req.user._id,
      emergencyStatus: { $in: ACTIVE_STATUSES }
    });
    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active emergency request in progress',
        emergencyId: existingActive.emergencyId,
        requestId: existingActive._id
      });
    }

    // --- Find nearby hospitals & filter by ED + ambulance availability ---
    const hospitals = await Hospital.find();
    if (!hospitals.length) {
      return res.status(503).json({ success: false, message: 'No hospitals are currently registered in the system. Please call local emergency services directly.' });
    }

    const ranked = selectNearestSuitableHospitals(lat, lng, hospitals, 50);
    if (!ranked.length) {
      return res.status(503).json({
        success: false,
        message: 'No nearby hospitals currently have an available emergency department and ambulance. Please call local emergency services directly.'
      });
    }

    const best = ranked[0];
    const selectedHospital = best.hospital;

    // --- Auto-populate verified medical info from patient profile if not provided ---
    const bloodGroup = req.body.bloodGroup || req.user.medicalProfile?.bloodGroup || 'Unknown';
    const allergies = req.body.allergies || req.user.medicalProfile?.allergies || '';
    const medicalInformation = req.body.medicalInformation || req.user.medicalProfile?.medicalInformation || '';
    const accidentImage = req.file ? `/uploads/${req.file.filename}` : null;

    // --- Create the emergency request ---
    const emergencyRequest = await EmergencyRequest.create({
      patientId: req.user._id,
      hospitalId: selectedHospital._id,
      latitude: lat,
      longitude: lng,
      currentAddress: currentAddress || '',
      symptoms: symptoms.trim(),
      severity,
      bloodGroup,
      allergies,
      medicalInformation,
      emergencyContact: emergencyContact.trim(),
      accidentImage,
      emergencyStatus: 'HOSPITAL_NOTIFIED', // request created + hospital notified happen together here
      ambulanceStatus: 'PENDING'
    });

    // --- Notify hospital dashboard in real time via Socket.IO ---
    const io = req.app.get('io');
    if (io) {
      io.to(`hospital:${selectedHospital._id}`).emit('emergency:new_request', {
        emergencyId: emergencyRequest.emergencyId,
        requestId: emergencyRequest._id,
        patientName: req.user.name,
        symptoms: emergencyRequest.symptoms,
        severity: emergencyRequest.severity,
        distanceKm: best.distanceKm,
        latitude: lat,
        longitude: lng,
        createdAt: emergencyRequest.createdAt
      });
      // Also let the patient know their own room can receive updates
      io.to(`patient:${req.user._id}`).emit('emergency:status_update', {
        requestId: emergencyRequest._id,
        emergencyStatus: emergencyRequest.emergencyStatus
      });
    }

    res.status(201).json({
      success: true,
      message: 'An ambulance request is being sent to the nearest available hospital.',
      emergencyRequest,
      hospital: {
        _id: selectedHospital._id,
        name: selectedHospital.name,
        address: selectedHospital.address,
        phone: selectedHospital.phone,
        latitude: selectedHospital.latitude,
        longitude: selectedHospital.longitude,
        distanceKm: best.distanceKm,
        emergencyDeptAvailable: selectedHospital.emergencyDeptAvailable,
        availableAmbulances: selectedHospital.availableAmbulances
      },
      alternateHospitals: ranked.slice(1, 4).map((r) => ({
        _id: r.hospital._id,
        name: r.hospital.name,
        distanceKm: r.distanceKm
      }))
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/emergency/:id - fetch a single request (patient or hospital staff owning it)
exports.getEmergencyRequest = async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id)
      .populate('hospitalId', 'name address phone latitude longitude')
      .populate('patientId', 'name phone medicalProfile');

    if (!request) return res.status(404).json({ success: false, message: 'Emergency request not found' });

    const isOwner = String(request.patientId._id) === String(req.user._id);
    const isHospitalStaff =
      req.user.role === 'hospital_staff' && String(req.user.hospitalId) === String(request.hospitalId._id);

    if (!isOwner && !isHospitalStaff && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    res.json({ success: true, emergencyRequest: request });
  } catch (err) {
    next(err);
  }
};

// GET /api/emergency/my-active - patient's current active request, for resuming tracking screen
exports.getMyActiveRequest = async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findOne({
      patientId: req.user._id,
      emergencyStatus: { $in: ACTIVE_STATUSES }
    })
      .populate('hospitalId', 'name address phone latitude longitude')
      .sort({ createdAt: -1 });

    res.json({ success: true, emergencyRequest: request || null });
  } catch (err) {
    next(err);
  }
};

// GET /api/emergency/history - patient's past requests
exports.getMyHistory = async (req, res, next) => {
  try {
    const requests = await EmergencyRequest.find({ patientId: req.user._id })
      .populate('hospitalId', 'name address phone')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};

// POST /api/emergency/:id/cancel - patient cancels before acceptance
exports.cancelRequest = async (req, res, next) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Emergency request not found' });
    if (String(request.patientId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (['ARRIVED_AT_PATIENT', 'PATIENT_PICKED_UP', 'ARRIVED_AT_HOSPITAL'].includes(request.emergencyStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel - ambulance is already at or past pickup stage. Please call the hospital directly.' });
    }

    request.emergencyStatus = 'CANCELLED';
    await request.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`hospital:${request.hospitalId}`).emit('emergency:cancelled', { requestId: request._id, emergencyId: request.emergencyId });
    }

    res.json({ success: true, message: 'Emergency request cancelled', emergencyRequest: request });
  } catch (err) {
    next(err);
  }
};

exports.ACTIVE_STATUSES = ACTIVE_STATUSES;
