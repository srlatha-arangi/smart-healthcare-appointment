// Run with: npm run seed
// Wipes and reseeds the Hospital collection with mock demo data,
// and creates a sample hospital-staff login for each hospital.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const mockHospitals = require('./mockHospitals');

const seed = async () => {
  await connectDB();

  console.log('[Seed] Clearing existing hospitals...');
  await Hospital.deleteMany({});

  console.log('[Seed] Inserting mock hospitals...');
  const hospitals = await Hospital.insertMany(mockHospitals);

  console.log('[Seed] Creating a demo hospital-staff account for the first hospital...');
  const existingStaff = await User.findOne({ email: 'hospital.staff@medicore.demo' });
  if (!existingStaff) {
    await User.create({
      name: 'Demo Hospital Staff',
      email: 'hospital.staff@medicore.demo',
      password: 'Staff@123',
      phone: '+1-555-0000',
      role: 'hospital_staff',
      hospitalId: hospitals[0]._id
    });
    console.log(`[Seed] Hospital staff login -> email: hospital.staff@medicore.demo | password: Staff@123 | hospital: ${hospitals[0].name}`);
  }

  console.log(`[Seed] Done. Inserted ${hospitals.length} hospitals.`);
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
