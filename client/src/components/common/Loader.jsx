import React from 'react';

export default function Loader({ message = 'Loading cinema data...', fullScreen = false }) {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div
        className="spinner-border text-primary mb-3"
        style={{ width: '3rem', height: '3rem', borderWidth: '0.25em' }}
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-secondary small fw-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-dark text-light">
        {content}
      </div>
    );
  }

  return content;
}
