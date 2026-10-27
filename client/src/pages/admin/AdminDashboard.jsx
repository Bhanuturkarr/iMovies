import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import {
  IndianRupee,
  Ticket,
  Users,
  Film,
  Building,
  TrendingUp,
  Percent,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Loader message="Aggregating cinema revenue and occupancy statistics..." />;
  }

  if (!stats) return null;

  return (
    <div>
      {/* Title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Administrative Overview</h2>
          <p className="text-secondary small mb-0">Live aggregated metrics calculated from database transactions</p>
        </div>
        <div className="text-success small fw-semibold d-flex align-items-center gap-1">
          <span className="p-1 bg-success rounded-circle"></span> Live Database Sync
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="row g-3 mb-4">
        {/* Gross Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-cinema p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase">Gross Revenue</span>
              <div className="p-2 rounded-3 bg-success bg-opacity-20 text-success">
                <IndianRupee size={18} />
              </div>
            </div>
            <h3 className="text-white fw-bold brand-font mb-1">
              ₹{((stats.totalRevenuePaise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <div className="text-muted small" style={{ fontSize: 11 }}>Confirmed ticket sales & fees</div>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-cinema p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase">Auditorium Occupancy</span>
              <div className="p-2 rounded-3 bg-primary bg-opacity-20 text-primary">
                <Percent size={18} />
              </div>
            </div>
            <h3 className="text-white fw-bold brand-font mb-1">
              {stats.occupancyRatePercent}%
            </h3>
            <div className="text-muted small" style={{ fontSize: 11 }}>Seats booked across all scheduled shows</div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-cinema p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase">Confirmed Bookings</span>
              <div className="p-2 rounded-3 bg-warning bg-opacity-20 text-warning">
                <Ticket size={18} />
              </div>
            </div>
            <h3 className="text-white fw-bold brand-font mb-1">
              {stats.confirmedBookingsCount}
            </h3>
            <div className="text-muted small" style={{ fontSize: 11 }}>{stats.totalTicketsSold} individual tickets sold</div>
          </div>
        </div>

        {/* Registered Users */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card-cinema p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-secondary small fw-bold text-uppercase">Registered Cinephiles</span>
              <div className="p-2 rounded-3 bg-info bg-opacity-20 text-info">
                <Users size={18} />
              </div>
            </div>
            <h3 className="text-white fw-bold brand-font mb-1">
              {stats.totalUsers}
            </h3>
            <div className="text-muted small" style={{ fontSize: 11 }}>Active customer accounts</div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="p-3 bg-dark rounded-3 border border-secondary d-flex align-items-center gap-3">
            <Film size={28} className="text-primary" />
            <div>
              <div className="text-secondary small">Catalogue Movies</div>
              <div className="text-white fw-bold fs-5">{stats.totalMovies} Movies Active</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 bg-dark rounded-3 border border-secondary d-flex align-items-center gap-3">
            <Building size={28} className="text-warning" />
            <div>
              <div className="text-secondary small">Active Multiplexes</div>
              <div className="text-white fw-bold fs-5">{stats.activeTheatres} Theatres Live</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-3 bg-dark rounded-3 border border-secondary d-flex align-items-center gap-3">
            <Calendar size={28} className="text-info" />
            <div>
              <div className="text-secondary small">Upcoming Shows</div>
              <div className="text-white fw-bold fs-5">{stats.upcomingShows} Scheduled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card-cinema p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
          <h5 className="text-white fw-bold mb-0">Recent Confirmed Reservations</h5>
          <Link to="/admin/bookings" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
            View All
          </Link>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover border-secondary small mb-0 align-middle">
            <thead>
              <tr className="text-secondary">
                <th>Reference</th>
                <th>Customer</th>
                <th>Movie</th>
                <th>Theatre</th>
                <th>Total Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings?.map((b) => (
                <tr key={b._id}>
                  <td>
                    <span className="font-monospace text-warning fw-bold">{b.bookingReference}</span>
                  </td>
                  <td>
                    <div className="text-white fw-medium">{b.user?.name}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{b.user?.email}</div>
                  </td>
                  <td>
                    <span className="text-white fw-medium">{b.show?.movie?.title}</span>
                  </td>
                  <td>
                    <span className="text-secondary">{b.show?.theatre?.name}</span>
                  </td>
                  <td>
                    <span className="text-white fw-bold">₹{((b.pricing?.totalAmountPaise || 0) / 100).toFixed(2)}</span>
                  </td>
                  <td>
                    <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-30">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
              {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No confirmed bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
