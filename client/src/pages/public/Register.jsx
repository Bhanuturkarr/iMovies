import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { toast } from 'react-toastify';
import { User, Mail, Lock, Phone, MapPin, Film } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { selectedCity } = useBooking();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: selectedCity || 'Mumbai'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await register(formData);
      toast.success(`Welcome to iMovies, ${res.user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card-cinema p-4 p-md-5 col-12 col-md-8 col-lg-5 shadow-2xl">
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-20 text-primary mb-2">
            <Film size={36} />
          </div>
          <h3 className="brand-font fw-bold text-white mb-1">Create an Account</h3>
          <p className="text-secondary small mb-0">Join iMovies to reserve prime seats, earn cinema rewards and access instant digital passes</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold">Full Name *</label>
            <div className="position-relative">
              <User size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
              <input
                type="text"
                name="name"
                className="form-control cinema-input ps-5 py-2 small"
                placeholder="e.g. Bhanu Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold">Email Address *</label>
            <div className="position-relative">
              <Mail size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
              <input
                type="email"
                name="email"
                className="form-control cinema-input ps-5 py-2 small"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold">Password * (Min 6 chars)</label>
            <div className="position-relative">
              <Lock size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
              <input
                type="password"
                name="password"
                className="form-control cinema-input ps-5 py-2 small"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row g-2 mb-4">
            <div className="col-7">
              <label className="form-label text-secondary small fw-semibold">Phone Number</label>
              <div className="position-relative">
                <Phone size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
                <input
                  type="text"
                  name="phone"
                  className="form-control cinema-input ps-5 py-2 small"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="col-5">
              <label className="form-label text-secondary small fw-semibold">City</label>
              <div className="position-relative">
                <MapPin size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
                <input
                  type="text"
                  name="city"
                  className="form-control cinema-input ps-5 py-2 small"
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-cinema w-100 py-2 rounded-pill fw-bold mb-3"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-secondary small mt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-primary text-decoration-none fw-semibold">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
