import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bloodGroup: user?.medicalProfile?.bloodGroup || 'Unknown',
    allergies: user?.medicalProfile?.allergies || '',
    medicalInformation: user?.medicalProfile?.medicalInformation || '',
    emergencyContact: user?.medicalProfile?.emergencyContact || ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Your Profile</h1>
      <p className="text-sm text-slate-500 mb-6">
        Keep your medical information current — it auto-fills into emergency requests so you save
        precious seconds during a crisis.
      </p>

      {saved && <div className="mb-4 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg">Profile updated successfully.</div>}

      <form onSubmit={submit} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Blood group</label>
          <select className="input" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Known allergies</label>
          <textarea className="input" rows={2} value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="e.g. Penicillin, peanuts" />
        </div>

        <div>
          <label className="label">Relevant medical information</label>
          <textarea className="input" rows={3} value={form.medicalInformation} onChange={(e) => setForm({ ...form, medicalInformation: e.target.value })} placeholder="Chronic conditions, current medications, prior surgeries..." />
        </div>

        <div>
          <label className="label">Emergency contact number</label>
          <input className="input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="+1-555-0000" />
        </div>

        <button className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save profile'}</button>
      </form>
    </div>
  );
}
