import { useState } from 'react';

const mockDoctors = [
  { name: 'Dr. Ananya Rao', specialty: 'Cardiology', hospital: 'City General Hospital' },
  { name: 'Dr. Kevin Mathews', specialty: 'Orthopedics', hospital: "St. Mary's Emergency Care" },
  { name: 'Dr. Priya Nair', specialty: 'Pediatrics', hospital: 'Green Valley Hospital' },
  { name: 'Dr. Samuel Okafor', specialty: 'General Medicine', hospital: 'Metro Care Hospital' }
];

export default function Appointments() {
  const [booked, setBooked] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState('');

  const confirm = () => {
    if (!selected || !date) return;
    setBooked([...booked, { ...selected, date }]);
    setSelected(null);
    setDate('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Appointments</h1>
      <p className="text-sm text-slate-500 mb-6">Book an appointment with a specialist (demo scheduling).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {mockDoctors.map((doc) => (
          <button
            key={doc.name}
            onClick={() => setSelected(doc)}
            className={`card text-left transition-all ${selected?.name === doc.name ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
          >
            <h3 className="font-semibold text-slate-800">{doc.name}</h3>
            <p className="text-sm text-brand-600">{doc.specialty}</p>
            <p className="text-xs text-slate-400 mt-1">{doc.hospital}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="card mb-8">
          <p className="text-sm text-slate-600 mb-2">Booking with <span className="font-semibold">{selected.name}</span></p>
          <div className="flex items-center gap-3">
            <input type="datetime-local" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            <button onClick={confirm} className="btn-primary">Confirm booking</button>
          </div>
        </div>
      )}

      {booked.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Your appointments</h2>
          <div className="space-y-3">
            {booked.map((b, i) => (
              <div key={i} className="card flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800">{b.name} — {b.specialty}</p>
                  <p className="text-xs text-slate-400">{b.hospital}</p>
                </div>
                <p className="text-sm text-slate-500">{new Date(b.date).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
