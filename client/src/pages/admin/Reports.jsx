import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import { BarChart3, IndianRupee, TrendingUp, RefreshCw, Ticket, Percent } from 'lucide-react';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await adminService.getStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return <Loader message="Generating financial reports and occupancy analytics..." />;
  }

  if (!stats) return null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="brand-font fw-bold text-white mb-1">Financial & Occupancy Reports</h2>
        <p className="text-secondary small mb-0">Detailed breakdown of gross ticket revenues, tax allocations and refund ratios</p>
      </div>

      <div className="row g-4 mb-4">
        {/* Revenue Breakdown */}
        <div className="col-12 col-lg-6">
          <div className="card-cinema p-4 h-100">
            <h5 className="text-white fw-bold mb-3 border-bottom border-dark pb-2 d-flex align-items-center gap-2">
              <IndianRupee size={18} className="text-success" />
              Revenue Summary
            </h5>

            <div className="d-flex justify-content-between p-3 bg-dark rounded-3 border border-secondary mb-3">
              <div>
                <div className="text-secondary small">Gross Ticket Revenue</div>
                <div className="text-white fw-bold fs-4">
                  ₹{((stats.totalRevenuePaise || 0) / 100).toFixed(2)}
                </div>
              </div>
              <div className="text-end">
                <div className="text-secondary small">Processed Refunds</div>
                <div className="text-danger fw-bold fs-4">
                  ₹{((stats.totalRefundPaise || 0) / 100).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-dark rounded-3 border border-secondary small">
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Net Retained Revenue:</span>
                <span className="text-success fw-bold">
                  ₹{(((stats.totalRevenuePaise || 0) - (stats.totalRefundPaise || 0)) / 100).toFixed(2)}
                </span>
              </div>
              <div className="d-flex justify-content-between text-secondary mb-2">
                <span>Total Tickets Sold:</span>
                <span className="text-white fw-bold">{stats.totalTicketsSold} tickets</span>
              </div>
              <div className="d-flex justify-content-between text-secondary">
                <span>Average Ticket Value:</span>
                <span className="text-white">
                  ₹{stats.totalTicketsSold > 0 ? (((stats.totalRevenuePaise || 0) / stats.totalTicketsSold) / 100).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy and Health */}
        <div className="col-12 col-lg-6">
          <div className="card-cinema p-4 h-100">
            <h5 className="text-white fw-bold mb-3 border-bottom border-dark pb-2 d-flex align-items-center gap-2">
              <Percent size={18} className="text-primary" />
              Multiplex Efficiency & Occupancy
            </h5>

            <div className="p-3 bg-dark rounded-3 border border-secondary mb-3 text-center">
              <div className="text-secondary small mb-1">Overall Screen Utilization</div>
              <div className="display-4 fw-bold text-primary brand-font mb-2">
                {stats.occupancyRatePercent}%
              </div>
              <div className="progress bg-secondary" style={{ height: 8 }}>
                <div
                  className="progress-bar bg-primary"
                  style={{ width: `${stats.occupancyRatePercent}%` }}
                />
              </div>
            </div>

            <div className="row g-2 text-center small">
              <div className="col-6">
                <div className="p-3 bg-dark rounded-3 border border-secondary">
                  <div className="text-secondary">Confirmed Bookings</div>
                  <div className="text-success fw-bold fs-5">{stats.confirmedBookingsCount}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-3 bg-dark rounded-3 border border-secondary">
                  <div className="text-secondary">Cancelled Bookings</div>
                  <div className="text-danger fw-bold fs-5">{stats.cancelledBookingsCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
