import { useState } from 'react';

const rooms = [
  { type: 'Private Room', price: '$120/night', desc: 'Single occupancy with attached bathroom and TV' },
  { type: 'Deluxe Suite', price: '$250/night', desc: 'Spacious suite with sofa area for family' },
  { type: 'ICU', price: '$450/night', desc: '24/7 monitoring with dedicated critical care staff' },
  { type: 'Semi-Private', price: '$80/night', desc: 'Shared room with curtain partition' }
];

export default function SpecialRoom() {
  const [reserved, setReserved] = useState(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Special Room Booking</h1>
      <p className="text-sm text-slate-500 mb-6">Reserve a hospital room in advance (demo).</p>

      {reserved && (
        <div className="mb-6 text-sm bg-green-50 text-green-700 px-4 py-3 rounded-lg">
          {reserved} reserved successfully. A confirmation will be sent to your registered contact.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((r) => (
          <div key={r.type} className="card">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800">{r.type}</h3>
              <span className="text-brand-600 font-semibold text-sm">{r.price}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1 mb-4">{r.desc}</p>
            <button onClick={() => setReserved(r.type)} className="btn-primary text-sm">Reserve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
