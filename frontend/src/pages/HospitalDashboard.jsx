import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import MapView from '../components/MapView';

const severityColor = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Moderate: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600'
};

const nextStatusMap = {
  AMBULANCE_ASSIGNED: { next: 'ON_THE_WAY', label: 'Mark: Ambulance On the Way' },
  ON_THE_WAY: { next: 'ARRIVED_AT_PATIENT', label: 'Mark: Arrived at Patient' },
  ARRIVED_AT_PATIENT: { next: 'PATIENT_PICKED_UP', label: 'Mark: Patient Picked Up' },
  PATIENT_PICKED_UP: { next: 'ARRIVED_AT_HOSPITAL', label: 'Mark: Arrived at Hospital' }
};

export default function HospitalDashboard() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      const { data } = await api.get('/hospital-dashboard/requests');
      setRequests(data.requests);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load requests.');
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => loadRequests();
    socket.on('emergency:new_request', refresh);
    socket.on('emergency:status_update', refresh);
    socket.on('emergency:cancelled', refresh);
    return () => {
      socket.off('emergency:new_request', refresh);
      socket.off('emergency:status_update', refresh);
      socket.off('emergency:cancelled', refresh);
    };
  }, [loadRequests]);

  const act = async (id, action, payload) => {
    setBusyId(id);
    setError('');
    try {
      if (action === 'accept') await api.post(`/hospital-dashboard/requests/${id}/accept`);
      if (action === 'reject') await api.post(`/hospital-dashboard/requests/${id}/reject`, { reason: payload });
      if (action === 'assign') await api.post(`/hospital-dashboard/requests/${id}/assign-ambulance`);
      if (action === 'status') await api.patch(`/hospital-dashboard/requests/${id}/status`, { emergencyStatus: payload });
      await loadRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Hospital Emergency Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Live incoming ambulance requests for your hospital.</p>

      {error && <div className="mb-4 text-sm bg-red-50 text-emergency-600 px-3 py-2 rounded-lg">{error}</div>}

      {requests.length === 0 ? (
        <div className="card text-center text-slate-400 py-12">No active emergency requests right now.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map((r) => (
            <div key={r._id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{r.patientId?.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{r.emergencyId}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${severityColor[r.severity]}`}>{r.severity}</span>
              </div>

              <p className="text-sm text-slate-600 mb-1"><span className="text-slate-400">Symptoms:</span> {r.symptoms}</p>
              <p className="text-sm text-slate-600 mb-1"><span className="text-slate-400">Blood group:</span> {r.bloodGroup} &nbsp;|&nbsp; <span className="text-slate-400">Allergies:</span> {r.allergies || 'None reported'}</p>
              <p className="text-sm text-slate-600 mb-1"><span className="text-slate-400">Status:</span> <span className="font-medium">{r.emergencyStatus.replaceAll('_', ' ')}</span></p>
              <p className="text-xs text-slate-400 mb-3">Requested {new Date(r.createdAt).toLocaleTimeString()}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                <button onClick={() => setSelected(selected?._id === r._id ? null : r)} className="btn-outline text-xs">
                  {selected?._id === r._id ? 'Hide location' : 'View Location'}
                </button>
                <a href={`tel:${r.patientId?.phone}`} className="btn-outline text-xs">Contact Patient</a>

                {r.emergencyStatus === 'HOSPITAL_NOTIFIED' && (
                  <>
                    <button disabled={busyId === r._id} onClick={() => act(r._id, 'accept')} className="btn-primary text-xs">Accept</button>
                    <button disabled={busyId === r._id} onClick={() => act(r._id, 'reject', 'Unable to accommodate at this time')} className="btn-outline text-xs text-emergency-600 border-emergency-300">Reject</button>
                  </>
                )}

                {r.emergencyStatus === 'ACCEPTED' && (
                  <button disabled={busyId === r._id} onClick={() => act(r._id, 'assign')} className="btn-primary text-xs">Assign Ambulance</button>
                )}

                {nextStatusMap[r.emergencyStatus] && (
                  <button disabled={busyId === r._id} onClick={() => act(r._id, 'status', nextStatusMap[r.emergencyStatus].next)} className="btn-primary text-xs">
                    {nextStatusMap[r.emergencyStatus].label}
                  </button>
                )}
              </div>

              {selected?._id === r._id && (
                <MapView markers={[{ lat: r.latitude, lng: r.longitude, label: r.patientId?.name || 'Patient', type: 'patient' }]} height="220px" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
