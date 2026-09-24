const STEPS = [
  { key: 'REQUEST_CREATED', label: 'Emergency Request Created' },
  { key: 'HOSPITAL_NOTIFIED', label: 'Hospital Notified' },
  { key: 'ACCEPTED', label: 'Request Accepted' },
  { key: 'AMBULANCE_ASSIGNED', label: 'Ambulance Assigned' },
  { key: 'ON_THE_WAY', label: 'Ambulance On the Way' },
  { key: 'ARRIVED_AT_PATIENT', label: 'Ambulance Arrived' },
  { key: 'PATIENT_PICKED_UP', label: 'Patient Picked Up' },
  { key: 'ARRIVED_AT_HOSPITAL', label: 'Arrived at Hospital' }
];

export default function StatusTimeline({ status }) {
  if (status === 'REJECTED') {
    return (
      <div className="card border-emergency-500 bg-red-50">
        <p className="font-semibold text-emergency-600">Request was rejected by the hospital.</p>
        <p className="text-sm text-slate-500 mt-1">Please try requesting again or call emergency services directly.</p>
      </div>
    );
  }
  if (status === 'CANCELLED') {
    return (
      <div className="card bg-slate-100">
        <p className="font-semibold text-slate-600">This emergency request was cancelled.</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="card">
      <ol className="space-y-4">
        {STEPS.map((step, idx) => {
          const done = idx <= currentIndex;
          const active = idx === currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${
                  done ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'
                } ${active ? 'ring-4 ring-brand-100' : ''}`}
              />
              <span className={`text-sm ${done ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
