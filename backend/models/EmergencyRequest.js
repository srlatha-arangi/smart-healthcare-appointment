const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const STATUS_FLOW = [
  'REQUEST_CREATED',
  'HOSPITAL_NOTIFIED',
  'ACCEPTED',
  'AMBULANCE_ASSIGNED',
  'ON_THE_WAY',
  'ARRIVED_AT_PATIENT',
  'PATIENT_PICKED_UP',
  'ARRIVED_AT_HOSPITAL',
  'REJECTED',
  'CANCELLED'
];

const EmergencyRequestSchema = new mongoose.Schema(
  {
    emergencyId: { type: String, default: () => `EMG-${uuidv4().slice(0, 8).toUpperCase()}`, unique: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },

    // Location captured via browser Geolocation API
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    currentAddress: { type: String, default: '' },

    // Emergency medical info
    symptoms: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'], required: true },
    bloodGroup: { type: String, default: 'Unknown' },
    allergies: { type: String, default: '' },
    medicalInformation: { type: String, default: '' },
    emergencyContact: { type: String, required: true },
    accidentImage: { type: String, default: null }, // stored file path/URL

    // Status tracking
    emergencyStatus: { type: String, enum: STATUS_FLOW, default: 'REQUEST_CREATED' },
    ambulanceStatus: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'EN_ROUTE_TO_PATIENT', 'ARRIVED', 'PATIENT_ONBOARD', 'EN_ROUTE_TO_HOSPITAL', 'COMPLETED'],
      default: 'PENDING'
    },
    ambulanceId: { type: String, default: null },
    ambulanceCurrentLat: { type: Number, default: null },
    ambulanceCurrentLng: { type: Number, default: null },

    rejectionReason: { type: String, default: null },

    // Timestamps for each stage of the flow
    acceptedAt: { type: Date, default: null },
    ambulanceAssignedAt: { type: Date, default: null },
    arrivalTime: { type: Date, default: null }, // estimated/actual arrival at patient
    pickedUpAt: { type: Date, default: null },
    hospitalArrivalTime: { type: Date, default: null }
  },
  { timestamps: true } // createdAt, updatedAt
);

EmergencyRequestSchema.index({ patientId: 1, emergencyStatus: 1 });

module.exports = mongoose.model('EmergencyRequest', EmergencyRequestSchema);
module.exports.STATUS_FLOW = STATUS_FLOW;
