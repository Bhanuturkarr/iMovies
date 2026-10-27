import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Lock, Mail, Eye, EyeOff, Film, ShieldCheck, User } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password);
      toast.success(`Welcome back, ${res.user.name}!`);
      if (res.user.role === 'admin' && from === '/') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="card-cinema p-4 p-md-5 col-12 col-md-8 col-lg-5 shadow-2xl">
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-20 text-primary mb-2">
            <Film size={36} />
          </div>
          <h3 className="brand-font fw-bold text-white mb-1">Welcome to iMovies</h3>
          <p className="text-secondary small mb-0">Sign in to book tickets, manage reservations, and unlock cinema perks</p>
        </div>

        {/* Demo Fast-Login Pills */}
        <div className="p-3 bg-dark rounded-3 border border-secondary mb-4">
          <div className="small text-secondary fw-semibold mb-2 d-flex align-items-center gap-1">
            <ShieldCheck size={14} className="text-primary" />
            <span>Fast One-Click Demo Credentials:</span>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary w-50 py-1 small"
              onClick={() => fillCredentials('user@imovies.com', 'User@123')}
            >
              Demo User
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning w-50 py-1 small"
              onClick={() => fillCredentials('admin@imovies.com', 'Admin@123')}
            >
              Demo Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold">Email Address</label>
            <div className="position-relative">
              <Mail size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
              <input
                type="email"
                className="form-control cinema-input ps-5 py-2 small"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between">
              <label className="form-label text-secondary small fw-semibold">Password</label>
            </div>
            <div className="position-relative">
              <Lock size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control cinema-input ps-5 pe-5 py-2 small"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn position-absolute end-0 top-50 translate-middle-y me-2 text-muted border-0 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-cinema w-100 py-2 rounded-pill fw-bold mb-3"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-secondary small mt-3">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary text-decoration-none fw-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
