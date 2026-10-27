import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import CityModal from './CityModal';
import {
  Film,
  MapPin,
  Search,
  User,
  Ticket,
  LogOut,
  ShieldAlert,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { selectedCity } = useBooking();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky-top border-bottom border-dark shadow-sm" style={{ backgroundColor: 'rgba(11, 12, 16, 0.95)', backdropFilter: 'blur(10px)', zIndex: 1030 }}>
        <div className="container py-2 d-flex align-items-center justify-content-between">
          {/* Brand Logo */}
          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
              <span className="fs-3">🎬</span>
              <span className="brand-font fs-3 fw-bold cinema-gradient-text tracking-tight">iMovies</span>
            </Link>

            {/* City Selector Pill */}
            <button
              onClick={() => setCityModalOpen(true)}
              className="btn btn-sm btn-outline-secondary border-secondary text-light d-flex align-items-center gap-1 rounded-pill px-3 py-1 ms-2"
              title="Change your cinema city"
            >
              <MapPin size={14} className="text-primary" />
              <span className="small fw-semibold">{selectedCity}</span>
              <ChevronDown size={14} className="text-muted" />
            </button>
          </div>

          {/* Quick Search Bar (Desktop) */}
          <form onSubmit={handleSearchSubmit} className="d-none d-md-flex align-items-center position-relative mx-3" style={{ maxWidth: '360px', width: '100%' }}>
            <Search size={16} className="position-absolute start-0 ms-3 text-muted" />
            <input
              type="text"
              placeholder="Search movies, genres, cinemas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control cinema-input ps-5 pe-3 py-1 small rounded-pill w-100"
            />
          </form>

          {/* Navigation Links & User Action */}
          <div className="d-none d-lg-flex align-items-center gap-4">
            <Link to="/movies" className="text-decoration-none text-light fw-medium small hover-opacity">
              Explore Movies
            </Link>
            <Link to="/theatres" className="text-decoration-none text-light fw-medium small hover-opacity">
              Theatres & Formats
            </Link>
            <Link to="/about" className="text-decoration-none text-secondary fw-medium small hover-opacity">
              About & FAQ
            </Link>

            {user ? (
              <div className="dropdown">
                <button
                  className="btn btn-dark border border-secondary text-light dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, fontSize: 12 }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="small fw-semibold">{user.name.split(' ')[0]}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark bg-dark border-secondary shadow-lg rounded-3 mt-2 p-2">
                  <li className="px-3 py-2 border-bottom border-secondary mb-1">
                    <div className="fw-bold text-white small">{user.name}</div>
                    <div className="text-secondary" style={{ fontSize: 11 }}>{user.email}</div>
                  </li>
                  <li>
                    <Link to="/dashboard" className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 small">
                      <Ticket size={16} className="text-primary" />
                      My Bookings & Tickets
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 small">
                      <User size={16} className="text-info" />
                      Account Profile
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link to="/admin" className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 small text-warning fw-semibold">
                        <ShieldAlert size={16} />
                        Admin Dashboard
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider border-secondary my-1" /></li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2 small text-danger">
                      <LogOut size={16} />
                      Log Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-sm btn-outline-light rounded-pill px-3 py-1">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-sm btn-cinema rounded-pill px-3 py-1">
                  Book Tickets
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="d-flex d-lg-none align-items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-dark border border-secondary text-light p-1 rounded-2"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="d-lg-none bg-dark border-top border-secondary p-3">
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <input
                type="text"
                placeholder="Search movies, cinemas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control cinema-input w-100 rounded-pill small"
              />
            </form>
            <div className="d-flex flex-column gap-2 mb-3">
              <Link to="/movies" onClick={() => setMobileMenuOpen(false)} className="text-decoration-none text-light p-2 rounded-2 hover-bg">
                Explore Movies
              </Link>
              <Link to="/theatres" onClick={() => setMobileMenuOpen(false)} className="text-decoration-none text-light p-2 rounded-2 hover-bg">
                Theatres & Formats
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-decoration-none text-secondary p-2 rounded-2 hover-bg">
                About & FAQ
              </Link>
            </div>
            {user ? (
              <div className="border-top border-secondary pt-2">
                <div className="text-white small fw-bold mb-2">Signed in as {user.name}</div>
                <div className="d-flex flex-column gap-1">
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline-secondary text-start w-100 py-2 small">
                    My Bookings
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="btn btn-warning text-dark text-start w-100 py-2 small fw-bold">
                      Admin Portal
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-danger text-start w-100 py-2 small mt-1">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="d-flex gap-2 pt-2 border-top border-secondary">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline-light w-50 py-2 small">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-cinema w-50 py-2 small">
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* City Selector Modal */}
      <CityModal isOpen={cityModalOpen} onClose={() => setCityModalOpen(false)} />
    </>
  );
}
