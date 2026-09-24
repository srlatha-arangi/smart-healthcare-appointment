import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import EmergencyModal from './EmergencyModal';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/hospitals', label: 'Hospitals' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/special-room', label: 'Special Room' },
  { to: '/profile', label: 'Profile' }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-xl font-extrabold text-brand-600 tracking-tight">
              Medi<span className="text-slate-800">Core</span>
            </span>
            {user && user.role === 'patient' && (
              <div className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${
                        isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
            {user && user.role === 'hospital_staff' && (
              <NavLink to="/hospital-dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                Hospital Dashboard
              </NavLink>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'patient' && (
                  <button onClick={() => setShowEmergency(true)} className="btn-emergency text-sm">
                    ● Emergency
                  </button>
                )}
                <button onClick={() => { logout(); navigate('/login'); }} className="btn-outline text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn-outline text-sm">Login</button>
                <button onClick={() => navigate('/register')} className="btn-primary text-sm">Register</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
    </>
  );
}
