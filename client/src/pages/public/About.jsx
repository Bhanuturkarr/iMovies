import React from 'react';
import { Film, ShieldCheck, Clock, RefreshCw, Zap, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="container py-5">
      <div className="text-center col-12 col-md-8 mx-auto mb-5">
        <span className="cinema-badge mb-2">ABOUT IMOVIES</span>
        <h1 className="display-4 fw-bold text-white brand-font mb-3">Redefining Cinema Ticketing</h1>
        <p className="text-secondary fs-6">
          iMovies is a full-stack, enterprise-grade cinema management and real-time ticket booking platform designed for film lovers, multiplex chains, and independent theatres.
        </p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <div className="card-cinema p-4 h-100">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-primary d-inline-flex mb-3">
              <Zap size={24} />
            </div>
            <h5 className="text-white fw-bold mb-2">Atomic Seat Concurrency</h5>
            <p className="text-secondary small mb-0">
              Our backend employs conditional database locking and WebSocket broadcasting to ensure two customers never collide or purchase the same seat simultaneously.
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-cinema p-4 h-100">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-warning d-inline-flex mb-3">
              <Clock size={24} />
            </div>
            <h5 className="text-white fw-bold mb-2">5-Minute Dynamic Hold</h5>
            <p className="text-secondary small mb-0">
              Once you pick your seats, an atomic temporary hold protects them for 5 minutes during checkout. Abandoned holds expire gracefully and return to the seat pool.
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card-cinema p-4 h-100">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-success d-inline-flex mb-3">
              <RefreshCw size={24} />
            </div>
            <h5 className="text-white fw-bold mb-2">Fair Cancellation & Refunds</h5>
            <p className="text-secondary small mb-0">
              Cancel eligible bookings up to 2 hours before showtime directly from your dashboard and receive an immediate 85% refund of ticket fare to your original source.
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Rules Policy Table */}
      <div className="card-cinema p-4 p-md-5 mb-5">
        <h4 className="brand-font fw-bold text-white mb-3 d-flex align-items-center gap-2">
          <ShieldCheck className="text-primary" size={24} />
          Booking & Cancellation Policy Rules
        </h4>
        <div className="table-responsive">
          <table className="table table-dark table-striped border-secondary small mb-0">
            <thead>
              <tr>
                <th>Timeline</th>
                <th>Refund Percentage</th>
                <th>Convenience Fee</th>
                <th>Seat Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>&gt; 2 Hours before Showtime</td>
                <td><span className="text-success fw-bold">85% of Base Ticket Fare</span></td>
                <td>Non-refundable (Payment Gateway & GST)</td>
                <td>Released immediately back to public pool</td>
              </tr>
              <tr>
                <td>&lt; 2 Hours before Showtime</td>
                <td><span className="text-danger fw-bold">0% (Ineligible)</span></td>
                <td>Non-refundable</td>
                <td>Retained as confirmed booking</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
