import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, CreditCard, Clock, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-top border-dark text-secondary mt-auto pt-5 pb-4" style={{ backgroundColor: '#07080b' }}>
      <div className="container">
        {/* Value Badges */}
        <div className="row g-4 pb-5 border-bottom border-dark text-center text-md-start">
          <div className="col-12 col-md-4 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-primary">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h6 className="text-white mb-1 fw-bold">100% Safe & Verified Bookings</h6>
              <p className="small text-muted mb-0">Instant e-tickets with atomic seat reservation guarantee.</p>
            </div>
          </div>
          <div className="col-12 col-md-4 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-warning">
              <Clock size={28} />
            </div>
            <div>
              <h6 className="text-white mb-1 fw-bold">Real-time Seat Selection</h6>
              <p className="small text-muted mb-0">Live seat lock preventing any double booking conflicts.</p>
            </div>
          </div>
          <div className="col-12 col-md-4 d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-info">
              <CreditCard size={28} />
            </div>
            <div>
              <h6 className="text-white mb-1 fw-bold">Secure Mock & UPI Payments</h6>
              <p className="small text-muted mb-0">Fast checkout with automatic refunds for eligible cancellations.</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="row g-4 py-5">
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-3">🎬</span>
              <span className="brand-font fs-4 fw-bold text-white">iMovies</span>
            </div>
            <p className="small text-muted mb-3" style={{ maxWidth: '320px' }}>
              The next-generation cinema discovery and ticketing platform. Discover blockbusters, secure prime seats in real-time, and experience cinema at its best.
            </p>
            <div className="d-flex gap-2">
              <span className="cinema-badge">IMAX Laser</span>
              <span className="cinema-badge-gold">Dolby Atmos</span>
              <span className="cinema-badge-platinum">4DX</span>
            </div>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="text-white text-uppercase small fw-bold mb-3 tracking-wider">Movies</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li><Link to="/movies?status=now_showing" className="text-decoration-none text-secondary hover-text-white">Now Showing</Link></li>
              <li><Link to="/movies?status=upcoming" className="text-decoration-none text-secondary hover-text-white">Upcoming Releases</Link></li>
              <li><Link to="/movies?genre=Sci-Fi" className="text-decoration-none text-secondary hover-text-white">Sci-Fi Hits</Link></li>
              <li><Link to="/movies?genre=Action" className="text-decoration-none text-secondary hover-text-white">Action & Thriller</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-2">
            <h6 className="text-white text-uppercase small fw-bold mb-3 tracking-wider">Cinemas</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li><Link to="/theatres" className="text-decoration-none text-secondary hover-text-white">All Theatres</Link></li>
              <li><Link to="/theatres?city=Mumbai" className="text-decoration-none text-secondary hover-text-white">Mumbai Cinemas</Link></li>
              <li><Link to="/theatres?city=Bengaluru" className="text-decoration-none text-secondary hover-text-white">Bengaluru Cinemas</Link></li>
              <li><Link to="/theatres?city=Delhi%20NCR" className="text-decoration-none text-secondary hover-text-white">Delhi NCR Multiplexes</Link></li>
            </ul>
          </div>

          <div className="col-12 col-md-4">
            <h6 className="text-white text-uppercase small fw-bold mb-3 tracking-wider">Cinema Newsletter</h6>
            <p className="small text-muted mb-3">Subscribe to receive early-bird alerts on blockbuster advance bookings and cinema deals.</p>
            <div className="input-group">
              <input type="email" placeholder="Enter your email" className="form-control cinema-input rounded-start-pill" />
              <button className="btn btn-cinema rounded-end-pill px-4">Subscribe</button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-top border-dark pt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-muted">
          <div>
            &copy; {new Date().getFullYear()} iMovies Entertainment Ltd. All rights reserved.
          </div>
          <div className="d-flex align-items-center gap-3">
            <Link to="/about" className="text-decoration-none text-muted">About Us</Link>
            <span>•</span>
            <Link to="/about" className="text-decoration-none text-muted">Cancellation Policy</Link>
            <span>•</span>
            <Link to="/about" className="text-decoration-none text-muted">Privacy & Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
