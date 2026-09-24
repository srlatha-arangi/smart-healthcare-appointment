import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';
import StatusTimeline from '../components/StatusTimeline';
import MapView from '../components/MapView';

export default function EmergencyTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const { data } = await api.get(`/emergency/${id}`);
      setRequest(data.emergencyRequest);
      setHospital(data.emergencyRequest.hospitalId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load emergency request.');
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onStatusUpdate = (payload) => {
      if (String(payload.requestId) === String(id)) {
        setRequest((prev) => (prev ? { ...prev, ...payload } : prev));
      }
    };
    const onLocation = (payload) => {
      if (String(payload.requestId) === String(id)) {
        setRequest((prev) => (prev ? { ...prev, ambulanceCurrentLat: payload.lat, ambulanceCurrentLng: payload.lng } : prev));
      }
    };
    const onRejected = (payload) => {
      if (String(payload.requestId) === String(id)) {
        setRequest((prev) => (prev ? { ...prev, emergencyStatus: 'REJECTED', rejectionReason: payload.reason } : prev));
      }
    };

    socket.on('emergency:status_update', onStatusUpdate);
    socket.on('ambulance:location', onLocation);
    socket.on('emergency:rejected', onRejected);

    return () => {
      socket.off('emergency:status_update', onStatusUpdate);
      socket.off('ambulance:location', onLocation);
      socket.off('emergency:rejected', onRejected);
    };
  }, [id]);

  const cancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/emergency/${id}/cancel`);
      await fetchRequest();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  if (error) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-emergency-600">{error}</div>;
  }
  if (!request) {
    return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-slate-400">Loading emergency request...</div>;
  }

  const markers = [
    { lat: request.latitude, lng: request.longitude, label: 'Patient location', type: 'patient' }
  ];
  if (hospital) markers.push({ lat: hospital.latitude, lng: hospital.longitude, label: hospital.name, type: 'hospital' });
  if (request.ambulanceCurrentLat && request.ambulanceCurrentLng) {
    markers.push({ lat: request.ambulanceCurrentLat, lng: request.ambulanceCurrentLng, label: `Ambulance ${request.ambulanceId || ''}`, type: 'ambulance' });
  }

  const canCancel = ['REQUEST_CREATED', 'HOSPITAL_NOTIFIED', 'ACCEPTED', 'AMBULANCE_ASSIGNED', 'ON_THE_WAY'].includes(request.emergencyStatus);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
        DEMO / MOCK EMERGENCY SERVICE
      </p>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-800">Live Emergency Tracking</h1>
        <span className="text-xs text-slate-400 font-mono">{request.emergencyId}</span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        {request.emergencyStatus === 'HOSPITAL_NOTIFIED'
          ? 'An ambulance request is being sent to the nearest available hospital.'
          : 'Track your ambulance in real time below.'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <StatusTimeline status={request.emergencyStatus} />

          {canCancel && (
            <button onClick={cancel} disabled={cancelling} className="btn-outline w-full justify-center text-emergency-600 border-emergency-300">
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <MapView markers={markers} height="300px" />

          {hospital && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-2">Assigned Hospital</h3>
              <p className="text-sm text-slate-600">{hospital.name}</p>
              <p className="text-xs text-slate-400 mb-3">{hospital.address}</p>
              <div className="flex gap-2">
                <a href={`tel:${hospital.phone}`} className="btn-outline text-sm flex-1 text-center">📞 Call Hospital</a>
                <a href={`tel:${request.emergencyContact}`} className="btn-outline text-sm flex-1 text-center">📞 Emergency Contact</a>
              </div>
              <a href="tel:911" className="btn-emergency text-sm w-full justify-center mt-2">📞 Call Emergency Services</a>
            </div>
          )}

          {request.ambulanceId && (
            <div className="card text-sm">
              <p><span className="text-slate-400">Ambulance ID:</span> <span className="font-medium">{request.ambulanceId}</span></p>
              <p><span className="text-slate-400">Severity:</span> <span className="font-medium">{request.severity}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
