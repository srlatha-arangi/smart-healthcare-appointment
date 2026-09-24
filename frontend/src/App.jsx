import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Hospitals from './pages/Hospitals';
import Appointments from './pages/Appointments';
import SpecialRoom from './pages/SpecialRoom';
import Emergency from './pages/Emergency';
import EmergencyTracking from './pages/EmergencyTracking';
import HospitalDashboard from './pages/HospitalDashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/hospitals" element={<ProtectedRoute><Hospitals /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/special-room" element={<ProtectedRoute><SpecialRoom /></ProtectedRoute>} />
        <Route path="/emergency" element={<ProtectedRoute roles={['patient']}><Emergency /></ProtectedRoute>} />
        <Route path="/emergency-tracking/:id" element={<ProtectedRoute roles={['patient']}><EmergencyTracking /></ProtectedRoute>} />

        <Route path="/hospital-dashboard" element={<ProtectedRoute roles={['hospital_staff', 'admin']}><HospitalDashboard /></ProtectedRoute>} />

        <Route path="*" element={<div className="p-10 text-center text-slate-400">Page not found</div>} />
      </Routes>
    </div>
  );
}
