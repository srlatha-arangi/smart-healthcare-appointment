import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import EmergencyModal from '../components/EmergencyModal';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <p className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          DEMO / MOCK EMERGENCY SERVICE
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">
          Welcome to MediCore{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-slate-500 mt-3 max-w-xl mx-auto">
          Book appointments, find hospitals, manage your health profile — and get emergency ambulance
          help in seconds when it matters most.
        </p>
        <button onClick={() => setShowEmergency(true)} className="btn-emergency mt-6 px-6 py-3 text-base">
          🚨 Emergency — Request Help Now
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Hospitals', desc: 'Browse nearby hospitals and specialties', to: '/hospitals' },
          { title: 'Appointments', desc: 'Book and manage doctor appointments', to: '/appointments' },
          { title: 'Special Room', desc: 'Reserve private and ICU rooms', to: '/special-room' },
          { title: 'Profile', desc: 'Keep your medical info up to date', to: '/profile' }
        ].map((card) => (
          <button key={card.to} onClick={() => navigate(card.to)} className="card text-left hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-slate-800">{card.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{card.desc}</p>
          </button>
        ))}
      </div>

      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </div>
  );
}
