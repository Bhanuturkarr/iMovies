import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Building,
  Calendar,
  Ticket,
  Users,
  BarChart3,
  ArrowLeft
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Movies', path: '/admin/movies', icon: Film },
    { label: 'Theatres & Screens', path: '/admin/theatres', icon: Building },
    { label: 'Show Schedules', path: '/admin/shows', icon: Calendar },
    { label: 'Customer Bookings', path: '/admin/bookings', icon: Ticket },
    { label: 'Users & Roles', path: '/admin/users', icon: Users },
    { label: 'Reports & Revenue', path: '/admin/reports', icon: BarChart3 }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-12 col-md-3 col-xl-2">
          <div className="card-cinema p-3 sticky-top" style={{ top: '80px' }}>
            <div className="pb-3 mb-3 border-bottom border-dark">
              <span className="badge bg-warning text-dark fw-bold mb-1">CINEMA ADMIN</span>
              <h5 className="brand-font fw-bold text-white mb-0">Control Center</h5>
            </div>

            <div className="d-flex flex-column gap-1 mb-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`btn d-flex align-items-center gap-2 text-start p-2 rounded-3 small transition-all ${
                      isActive
                        ? 'btn-primary bg-primary text-white fw-bold shadow-sm'
                        : 'btn-dark border-0 text-secondary hover-text-white'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-top border-dark pt-3">
              <Link to="/" className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1 rounded-pill">
                <ArrowLeft size={14} /> Back to Public App
              </Link>
            </div>
          </div>
        </div>

        {/* Content Outlet */}
        <div className="col-12 col-md-9 col-xl-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
