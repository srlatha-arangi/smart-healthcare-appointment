const haversineDistance = require('./haversine');

/**
 * Given a patient location and a list of hospitals, this:
 *  1. Filters hospitals that have an available emergency dept AND at least one available ambulance
 *  2. Calculates distance to each via Haversine
 *  3. Sorts by distance ascending
 *  4. Returns the ranked list (nearest suitable hospital first)
 *
 * A configurable search radius (km) can be applied; default 25km for the demo.
 */
function selectNearestSuitableHospitals(patientLat, patientLng, hospitals, radiusKm = 25) {
  const withDistance = hospitals.map((h) => ({
    hospital: h,
    distanceKm: haversineDistance(patientLat, patientLng, h.latitude, h.longitude)
  }));

  const suitable = withDistance
    .filter(
      (entry) =>
        entry.hospital.emergencyDeptAvailable === true &&
        entry.hospital.availableAmbulances > 0 &&
        entry.distanceKm <= radiusKm
    )
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return suitable;
}

module.exports = selectNearestSuitableHospitals;
