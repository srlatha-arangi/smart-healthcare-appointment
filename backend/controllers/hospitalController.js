const Hospital = require('../models/Hospital');
const haversineDistance = require('../utils/haversine');
const selectNearestSuitableHospitals = require('../utils/hospitalSelector');

// GET /api/hospitals - list all hospitals (for the Hospitals page)
exports.listHospitals = async (req, res, next) => {
  try {
    const hospitals = await Hospital.find().sort({ name: 1 });
    res.json({ success: true, hospitals });
  } catch (err) {
    next(err);
  }
};

// GET /api/hospitals/nearby?lat=..&lng=..&radiusKm=..
exports.nearbyHospitals = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm) : 25;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query params are required' });
    }

    const hospitals = await Hospital.find();
    if (!hospitals.length) {
      return res.status(404).json({ success: false, message: 'No hospitals available in the system' });
    }

    const ranked = hospitals
      .map((h) => ({
        hospital: h,
        distanceKm: haversineDistance(lat, lng, h.latitude, h.longitude)
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 10)
      .map((entry) => ({
        _id: entry.hospital._id,
        name: entry.hospital.name,
        address: entry.hospital.address,
        phone: entry.hospital.phone,
        latitude: entry.hospital.latitude,
        longitude: entry.hospital.longitude,
        emergencyDeptAvailable: entry.hospital.emergencyDeptAvailable,
        availableAmbulances: entry.hospital.availableAmbulances,
        distanceKm: entry.distanceKm
      }));

    res.json({ success: true, hospitals: ranked });
  } catch (err) {
    next(err);
  }
};

// GET /api/hospitals/:id
exports.getHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    res.json({ success: true, hospital });
  } catch (err) {
    next(err);
  }
};

exports._selectNearestSuitableHospitals = selectNearestSuitableHospitals;
