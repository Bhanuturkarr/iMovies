import React from 'react';
import { Film } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'Try adjusting your search filters or check back later.',
  action = null
}) {
  return (
    <div className="card-cinema p-5 text-center my-4">
      <div className="p-3 rounded-circle bg-dark border border-secondary text-muted d-inline-flex mb-3">
        <Film size={40} />
      </div>
      <h5 className="text-white fw-bold mb-2">{title}</h5>
      <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '420px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
