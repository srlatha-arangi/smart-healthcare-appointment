// Mock hospital + ambulance data for the DEMO / MOCK EMERGENCY SERVICE prototype.
// Coordinates are spread around a sample city center so distance calculations are meaningful.
// Replace with real hospital directory / maps API integration in production.

const mockHospitals = [
  {
    name: 'City General Hospital',
    address: '12 MG Road, Central District',
    phone: '+1-555-0101',
    latitude: 17.3850,
    longitude: 78.4867,
    emergencyDeptAvailable: true,
    totalAmbulances: 3,
    availableAmbulances: 2,
    isMock: true
  },
  {
    name: 'St. Mary\'s Emergency Care',
    address: '45 Church Street, North Zone',
    phone: '+1-555-0102',
    latitude: 17.4239,
    longitude: 78.4738,
    emergencyDeptAvailable: true,
    totalAmbulances: 2,
    availableAmbulances: 1,
    isMock: true
  },
  {
    name: 'Riverside Multi-Specialty Hospital',
    address: '8 Riverside Ave, East Zone',
    phone: '+1-555-0103',
    latitude: 17.3616,
    longitude: 78.5245,
    emergencyDeptAvailable: true,
    totalAmbulances: 4,
    availableAmbulances: 0,
    isMock: true
  },
  {
    name: 'Sunrise Trauma Center',
    address: '101 Sunrise Blvd, West Zone',
    phone: '+1-555-0104',
    latitude: 17.4065,
    longitude: 78.4300,
    emergencyDeptAvailable: false,
    totalAmbulances: 2,
    availableAmbulances: 2,
    isMock: true
  },
  {
    name: 'Green Valley Hospital',
    address: '23 Green Valley Road, South Zone',
    phone: '+1-555-0105',
    latitude: 17.3300,
    longitude: 78.4600,
    emergencyDeptAvailable: true,
    totalAmbulances: 3,
    availableAmbulances: 3,
    isMock: true
  },
  {
    name: 'Metro Care Hospital',
    address: '77 Metro Lane, Central District',
    phone: '+1-555-0106',
    latitude: 17.3950,
    longitude: 78.4950,
    emergencyDeptAvailable: true,
    totalAmbulances: 2,
    availableAmbulances: 1,
    isMock: true
  }
];

module.exports = mockHospitals;
