import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hospitals').then(({ data }) => setHospitals(data.hospitals)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Hospitals</h1>
      <p className="text-sm text-slate-500 mb-6">Network hospitals with live emergency & ambulance availability (demo data).</p>

      {loading ? (
        <p className="text-slate-400">Loading hospitals...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((h) => (
            <div key={h._id} className="card">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-800">{h.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${h.emergencyDeptAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {h.emergencyDeptAvailable ? 'ED Available' : 'ED Unavailable'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{h.address}</p>
              <p className="text-sm text-slate-500">{h.phone}</p>
              <p className="text-sm mt-2">
                🚑 Ambulances available: <span className="font-medium">{h.availableAmbulances}/{h.totalAmbulances}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
