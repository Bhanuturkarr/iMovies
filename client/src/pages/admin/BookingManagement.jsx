import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { Ticket, Search, Filter, Eye, CheckCircle, XCircle } from 'lucide-react';

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllBookings({
        search,
        status,
        limit: 50
      });
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      toast.error('Failed to load customer bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Customer Reservations & Tickets</h2>
          <p className="text-secondary small mb-0">Search references, monitor payment states, and inspect allocations</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <select
            className="form-select cinema-input small py-1"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>

          <input
            type="text"
            className="form-control cinema-input py-1 px-3 small rounded-pill"
            placeholder="Search Reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-cinema rounded-pill px-3 btn-sm">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Loader message="Loading bookings records..." />
      ) : (
        <div className="card-cinema p-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary small mb-0 align-middle">
              <thead>
                <tr className="text-secondary">
                  <th>Reference</th>
                  <th>Customer Info</th>
                  <th>Movie & Multiplex</th>
                  <th>Seats</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Details</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <span className="font-monospace text-warning fw-bold">{b.bookingReference}</span>
                    </td>
                    <td>
                      <div className="text-white fw-medium">{b.user?.name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{b.user?.email}</div>
                    </td>
                    <td>
                      <div className="text-white fw-medium">{b.show?.movie?.title}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{b.show?.theatre?.name}</div>
                    </td>
                    <td>
                      <span className="badge bg-dark border border-secondary text-light">
                        {b.seatNumbers?.join(', ')}
                      </span>
                    </td>
                    <td>
                      <span className="text-white fw-bold">₹{((b.pricing?.totalAmountPaise || 0) / 100).toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {b.paymentMethod?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        b.bookingStatus === 'confirmed'
                          ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-30'
                          : b.bookingStatus === 'cancelled'
                          ? 'bg-danger bg-opacity-25 text-danger border border-danger border-opacity-30'
                          : 'bg-warning bg-opacity-25 text-warning'
                      }`}>
                        {b.bookingStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="btn btn-sm btn-dark border-secondary text-primary p-1 rounded-2"
                        title="View Full Booking Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      No customer bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-light rounded-4">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Booking #{selectedBooking.bookingReference}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedBooking(null)}
                />
              </div>
              <div className="modal-body p-4 small">
                <div className="mb-3">
                  <div className="text-secondary">Movie Title:</div>
                  <div className="text-white fw-bold fs-6">{selectedBooking.show?.movie?.title}</div>
                </div>
                <div className="mb-3">
                  <div className="text-secondary">Theatre & Screen:</div>
                  <div className="text-white">{selectedBooking.show?.theatre?.name} — {selectedBooking.show?.screen?.name || 'Screen 1'}</div>
                </div>
                <div className="mb-3">
                  <div className="text-secondary">Customer:</div>
                  <div className="text-white">{selectedBooking.user?.name} ({selectedBooking.user?.email})</div>
                </div>
                <div className="mb-3">
                  <div className="text-secondary">Seats Allocated:</div>
                  <div className="d-flex gap-1 mt-1">
                    {selectedBooking.seatNumbers?.map(s => (
                      <span key={s} className="cinema-badge">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3 p-3 bg-dark rounded-3 border border-secondary">
                  <div className="d-flex justify-content-between text-secondary mb-1">
                    <span>Base Amount:</span>
                    <span>₹{((selectedBooking.pricing?.baseAmountPaise || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary mb-1">
                    <span>Convenience Fee:</span>
                    <span>₹{((selectedBooking.pricing?.convenienceFeePaise || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary mb-1">
                    <span>GST:</span>
                    <span>₹{((selectedBooking.pricing?.gstPaise || 0) / 100).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-white fw-bold pt-1 border-top border-dark">
                    <span>Total Paid:</span>
                    <span>₹{((selectedBooking.pricing?.totalAmountPaise || 0) / 100).toFixed(2)}</span>
                  </div>
                </div>

                {selectedBooking.cancellation && selectedBooking.cancellation.refundAmountPaise > 0 && (
                  <div className="p-2 bg-danger bg-opacity-10 border border-danger text-danger rounded-3">
                    <div>Refund Amount: ₹{(selectedBooking.cancellation.refundAmountPaise / 100).toFixed(2)}</div>
                    <div>Reason: {selectedBooking.cancellation.reason}</div>
                    <div style={{ fontSize: 11 }}>Ref: {selectedBooking.cancellation.refundReference}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-cinema rounded-pill px-4"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
