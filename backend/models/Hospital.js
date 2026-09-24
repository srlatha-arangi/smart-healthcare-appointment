const mongoose = require('mongoose');

const HospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    emergencyDeptAvailable: { type: Boolean, default: true },
    totalAmbulances: { type: Number, default: 2 },
    availableAmbulances: { type: Number, default: 2 },

    isMock: { type: Boolean, default: true }
  },
  { timestamps: true }
);

HospitalSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Hospital', HospitalSchema);
