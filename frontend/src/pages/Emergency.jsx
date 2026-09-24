import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MapView from '../components/MapView';

const severityLevels = ['Low', 'Moderate', 'High', 'Critical'];

export default function Emergency() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locationStatus, setLocationStatus] = useState('idle'); // idle | requesting | granted | denied | error
  const [coords, setCoords] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);

  const [form, setForm] = useState({
    symptoms: '',
    severity: 'Moderate',
    bloodGroup: user?.medicalProfile?.bloodGroup || 'Unknown',
    allergies: user?.medicalProfile?.allergies || '',
    medicalInformation: user?.medicalProfile?.medicalInformation || '',
    emergencyContact: user?.medicalProfile?.emergencyContact || ''
  });
  const [accidentImage, setAccidentImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check for an already-active request on mount to avoid duplicates
  useEffect(() => {
    api.get('/emergency/my-active').then(({ data }) => {
      if (data.emergencyRequest) {
        navigate(`/emergency-tracking/${data.emergencyRequest._id}`, { replace: true });
      }
    });
  }, [navigate]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        setLocationStatus('granted');
        try {
          const { data } = await api.get('/hospitals/nearby', { params: { lat: latitude, lng: longitude } });
          setNearbyHospitals(data.hospitals);
        } catch (err) {
          setError('Could not load nearby hospitals. Check your network connection.');
        }
      },
      (err) => {
        setLocationStatus('denied');
        setError('Location permission denied. We cannot dispatch an ambulance without your location. Please enable location access and try again, or call emergency services directly.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!coords) {
      setError('Please share your location first.');
      return;
    }
    if (!form.symptoms.trim()) {
      setError('Please describe your symptoms.');
      return;
    }
    if (!form.emergencyContact.trim()) {
      setError('Please provide an emergency contact number.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('latitude', coords.latitude);
      payload.append('longitude', coords.longitude);
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (accidentImage) payload.append('accidentImage', accidentImage);

      const { data } = await api.post('/emergency/request-ambulance', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/emergency-tracking/${data.emergencyRequest._id}`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requestId) {
        navigate(`/emergency-tracking/${err.response.data.requestId}`);
        return;
      }
      setError(err.response?.data?.message || 'Something went wrong submitting your request. Please try again or call emergency services.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
        DEMO / MOCK EMERGENCY SERVICE
      </p>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Request an Ambulance</h1>
      <p className="text-sm text-slate-500 mb-6">
        We'll locate the nearest hospital with an available emergency department and ambulance.
      </p>

      {error && <div className="mb-4 text-sm bg-red-50 text-emergency-600 px-3 py-2 rounded-lg">{error}</div>}

      {/* Step 1: Location */}
      <div className="card mb-4">
        <h2 className="font-semibold text-slate-800 mb-2">1. Share your current location</h2>
        {locationStatus !== 'granted' ? (
          <button onClick={requestLocation} className="btn-primary" disabled={locationStatus === 'requesting'}>
            {locationStatus === 'requesting' ? 'Getting location...' : '📍 Enable GPS & Share Location'}
          </button>
        ) : (
          <div>
            <p className="text-sm text-green-700 mb-3">
              ✓ Location captured ({coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)})
            </p>
            <MapView markers={[{ lat: coords.latitude, lng: coords.longitude, label: 'You are here', type: 'patient' }, ...nearbyHospitals.slice(0, 3).map((h) => ({ lat: h.latitude, lng: h.longitude, label: `${h.name} (${h.distanceKm} km)`, type: 'hospital' }))]} height="280px" />
          </div>
        )}
      </div>

      {/* Step 2: Nearby hospitals preview */}
      {nearbyHospitals.length > 0 && (
        <div className="card mb-4">
          <h2 className="font-semibold text-slate-800 mb-3">2. Nearest hospitals</h2>
          <div className="space-y-2">
            {nearbyHospitals.slice(0, 4).map((h) => (
              <div key={h._id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 last:pb-0">
                <div>
                  <p className="font-medium text-slate-700">{h.name}</p>
                  <p className="text-xs text-slate-400">{h.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-600">{h.distanceKm} km</p>
                  <p className={`text-xs ${h.emergencyDeptAvailable && h.availableAmbulances > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {h.emergencyDeptAvailable && h.availableAmbulances > 0 ? 'Available' : 'Unavailable'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Emergency details form */}
      {locationStatus === 'granted' && (
        <form onSubmit={submit} className="card space-y-4">
          <h2 className="font-semibold text-slate-800">3. Emergency details</h2>

          <div>
            <label className="label">Symptoms *</label>
            <textarea className="input" rows={2} required value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              placeholder="e.g. Severe chest pain, difficulty breathing" />
          </div>

          <div>
            <label className="label">Severity level *</label>
            <div className="flex gap-2">
              {severityLevels.map((level) => (
                <button type="button" key={level}
                  onClick={() => setForm({ ...form, severity: level })}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${form.severity === level ? 'bg-emergency-600 text-white border-emergency-600' : 'border-slate-300 text-slate-600'}`}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Blood group</label>
              <input className="input" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
            </div>
            <div>
              <label className="label">Emergency contact *</label>
              <input className="input" required value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Known allergies</label>
            <input className="input" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
          </div>

          <div>
            <label className="label">Relevant medical information</label>
            <textarea className="input" rows={2} value={form.medicalInformation} onChange={(e) => setForm({ ...form, medicalInformation: e.target.value })} />
          </div>

          <div>
            <label className="label">Accident photo (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setAccidentImage(e.target.files[0])} className="text-sm" />
          </div>

          <button type="submit" className="btn-emergency w-full justify-center text-base py-3" disabled={submitting}>
            {submitting ? 'Submitting request...' : '🚨 Request Ambulance Now'}
          </button>
        </form>
      )}
    </div>
  );
}
