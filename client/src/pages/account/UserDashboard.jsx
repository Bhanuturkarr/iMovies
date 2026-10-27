import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  CheckCircle,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', 'cancelled'
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);
  const [ticketModalBooking, setTicketModalBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings({ limit: 50 });
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      toast.error('Failed to load your booking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const now = new Date();

  // Categorize bookings
  const upcomingBookings = bookings.filter(
    b => b.bookingStatus === 'confirmed' && new Date(b.show?.startTime) >= now
  );

  const pastBookings = bookings.filter(
    b => b.bookingStatus === 'confirmed' && new Date(b.show?.startTime) < now
  );

  const cancelledBookings = bookings.filter(
    b => b.bookingStatus === 'cancelled'
  );

  const displayedBookings =
    activeTab === 'upcoming'
      ? upcomingBookings
      : activeTab === 'past'
      ? pastBookings
      : cancelledBookings;

  // Process Cancellation
  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;

    try {
      setCancelling(true);
      const res = await bookingService.cancelBooking(selectedBookingForCancel._id, cancelReason);
      if (res.success) {
        toast.success(`Booking cancelled. Refund of ₹${(res.refundAmountPaise / 100).toFixed(2)} initiated.`);
        setSelectedBookingForCancel(null);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed. Policy cutoff may have passed.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching your reservations and digital passes..." fullScreen />;
  }

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">My Cinema Bookings</h2>
          <p className="text-secondary small mb-0">
            Welcome back, <strong className="text-white">{user?.name}</strong>. Manage your tickets and view active passes.
          </p>
        </div>

        <Link to="/movies" className="btn btn-cinema rounded-pill px-4 btn-sm">
          Book New Movie
        </Link>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 border-bottom border-dark pb-3 mb-4">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`btn btn-sm rounded-pill px-3 py-2 ${
            activeTab === 'upcoming'
              ? 'btn-primary'
              : 'btn-dark border border-secondary text-secondary hover-text-white'
          }`}
        >
          Upcoming Shows ({upcomingBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`btn btn-sm rounded-pill px-3 py-2 ${
            activeTab === 'past'
              ? 'btn-primary'
              : 'btn-dark border border-secondary text-secondary hover-text-white'
          }`}
        >
          Past Bookings ({pastBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`btn btn-sm rounded-pill px-3 py-2 ${
            activeTab === 'cancelled'
              ? 'btn-primary'
              : 'btn-dark border border-secondary text-secondary hover-text-white'
          }`}
        >
          Cancelled & Refunds ({cancelledBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      {displayedBookings.length > 0 ? (
        <div className="row g-4">
          {displayedBookings.map((b) => {
            const show = b.show || {};
            const movie = show.movie || {};
            const theatre = show.theatre || {};
            const isCancelled = b.bookingStatus === 'cancelled';
            const showTime = new Date(show.startTime);
            const canCancel = !isCancelled && showTime.getTime() - now.getTime() > 2 * 60 * 60 * 1000;

            return (
              <div key={b._id} className="col-12 col-lg-6">
                <div className="card-cinema p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    {/* Top Status Bar */}
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="font-monospace text-warning small fw-bold">
                        {b.bookingReference}
                      </span>
                      <span className={`badge ${
                        isCancelled ? 'bg-danger text-white' : 'bg-success text-white'
                      }`}>
                        {isCancelled ? 'Cancelled & Refunded' : 'Confirmed Active'}
                      </span>
                    </div>

                    {/* Movie Info */}
                    <div className="d-flex gap-3 mb-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="rounded-3 border border-secondary object-fit-cover"
                        style={{ width: 68, height: 96 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                      <div>
                        <h5 className="text-white fw-bold mb-1">{movie.title}</h5>
                        <div className="text-secondary small mb-1 d-flex align-items-center gap-1">
                          <MapPin size={13} className="text-primary" />
                          <span>{theatre.name}, {theatre.city}</span>
                        </div>
                        <div className="text-info small fw-medium">
                          {showTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                          {showTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>

                    {/* Seats & Fare */}
                    <div className="p-3 bg-dark rounded-3 border border-secondary mb-3 small d-flex justify-content-between align-items-center">
                      <div>
                        <div className="text-secondary" style={{ fontSize: 11 }}>SEATS</div>
                        <div className="text-white fw-bold">{b.seatNumbers?.join(', ')}</div>
                      </div>
                      <div className="text-end">
                        <div className="text-secondary" style={{ fontSize: 11 }}>TOTAL PAID</div>
                        <div className="text-white fw-bold">₹{(b.pricing?.totalAmountPaise / 100).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Cancellation Refund Details if cancelled */}
                    {isCancelled && b.cancellation && (
                      <div className="p-2 bg-danger bg-opacity-10 border border-danger text-danger rounded-3 small mb-3">
                        <div>Refund Amount: <strong>₹{(b.cancellation.refundAmountPaise / 100).toFixed(2)}</strong></div>
                        <div style={{ fontSize: 11 }}>Status: {b.cancellation.refundStatus?.toUpperCase()} • Ref: {b.cancellation.refundReference}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-top border-dark d-flex align-items-center justify-content-between gap-2">
                    <button
                      onClick={() => setTicketModalBooking(b)}
                      className="btn btn-sm btn-outline-light rounded-pill px-3 d-flex align-items-center gap-1"
                    >
                      <Eye size={14} />
                      <span>View Pass</span>
                    </button>

                    {canCancel && (
                      <button
                        onClick={() => setSelectedBookingForCancel(b)}
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No ${activeTab} bookings`}
          description={
            activeTab === 'upcoming'
              ? "You don't have any upcoming shows. Check out what's playing in cinemas now!"
              : 'No records found in this category.'
          }
          action={
            activeTab === 'upcoming' ? (
              <Link to="/movies" className="btn btn-cinema rounded-pill px-4 btn-sm">
                Explore Movies
              </Link>
            ) : null
          }
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {selectedBookingForCancel && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-light rounded-4">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <AlertCircle size={20} />
                  Cancel Ticket Booking
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedBookingForCancel(null)}
                />
              </div>

              <div className="modal-body p-4">
                <p className="text-secondary small mb-3">
                  Are you sure you want to cancel booking <strong className="text-white">{selectedBookingForCancel.bookingReference}</strong> for{' '}
                  <strong className="text-white">{selectedBookingForCancel.show?.movie?.title}</strong>?
                </p>

                {/* Refund calculation breakdown */}
                <div className="p-3 bg-dark rounded-3 border border-secondary mb-3 small">
                  <div className="d-flex justify-content-between text-secondary mb-1">
                    <span>Base Fare Paid:</span>
                    <span className="text-white">₹{(selectedBookingForCancel.pricing?.baseAmountPaise / 100).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary mb-1">
                    <span>Refund Policy Rate:</span>
                    <span className="text-success fw-bold">85% of Base Fare</span>
                  </div>
                  <div className="d-flex justify-content-between text-secondary mb-2 pb-2 border-bottom border-dark">
                    <span>Convenience Fee:</span>
                    <span className="text-muted">Non-refundable</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold">
                    <span className="text-white">Estimated Refund:</span>
                    <span className="text-success fs-6">
                      ₹{((selectedBookingForCancel.pricing?.baseAmountPaise * 0.85) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">Reason for Cancellation</label>
                  <select
                    className="form-select cinema-input small"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="Change of schedule">Change of schedule / plan</option>
                    <option value="Booked incorrect seats">Booked incorrect seats / showtime</option>
                    <option value="Personal emergency">Personal emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-dark border-secondary text-light px-3"
                  onClick={() => setSelectedBookingForCancel(null)}
                >
                  Keep Tickets
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Processing Cancellation...' : 'Confirm & Process Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Pass View Modal */}
      {ticketModalBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-light rounded-4">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Admission Ticket</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setTicketModalBooking(null)}
                />
              </div>
              <div className="modal-body p-4 text-center">
                <div className="p-3 bg-white rounded-3 d-inline-block shadow-sm mb-3">
                  <QRCodeSVG
                    value={`IMOVIES:${ticketModalBooking.bookingReference}:${ticketModalBooking._id}`}
                    size={160}
                    level="H"
                  />
                </div>
                <div className="fs-5 fw-bold text-warning font-monospace mb-1">
                  {ticketModalBooking.bookingReference}
                </div>
                <h4 className="text-white fw-bold mb-1">{ticketModalBooking.show?.movie?.title}</h4>
                <div className="text-secondary small mb-3">
                  {ticketModalBooking.show?.theatre?.name} • {ticketModalBooking.show?.screen?.name || 'Screen 1'}
                </div>
                <div className="cinema-badge d-inline-block px-3 py-2 fs-6">
                  Seats: {ticketModalBooking.seatNumbers?.join(', ')}
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-cinema w-100 rounded-pill"
                  onClick={() => setTicketModalBooking(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
