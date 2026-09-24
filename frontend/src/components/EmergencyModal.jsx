import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function EmergencyModal({ onClose }) {
  const navigate = useNavigate();
  const [shareMsg, setShareMsg] = useState('');

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setShareMsg('Geolocation is not supported by this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setShareMsg(`Location shared: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      (err) => {
        setShareMsg('Could not access location. Please enable location permissions in your browser settings.');
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-emergency-600 animate-pulse-slow" />
          <h2 className="text-lg font-bold text-slate-800">Emergency Options</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">DEMO / MOCK EMERGENCY SERVICE</p>

        <div className="space-y-3">
          <button
            onClick={() => { onClose(); navigate('/emergency'); }}
            className="w-full btn-emergency justify-center flex items-center gap-2"
          >
            🚑 Request Ambulance
          </button>

          <a
            href="tel:911"
            className="w-full btn-outline justify-center flex items-center gap-2 border-emergency-500 text-emergency-600"
          >
            📞 Call Emergency Services
          </a>

          <button onClick={handleShareLocation} className="w-full btn-outline justify-center flex items-center gap-2">
            📍 Share Current Location
          </button>
          {shareMsg && <p className="text-xs text-slate-500 text-center">{shareMsg}</p>}

          <button onClick={onClose} className="w-full text-sm text-slate-400 hover:text-slate-600 pt-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
