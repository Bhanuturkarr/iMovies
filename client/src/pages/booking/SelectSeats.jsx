import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { showService } from '../../services/showService';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { useSocket } from '../../context/SocketContext';
import SeatMap from '../../components/booking/SeatMap';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { Film, Clock, MapPin, ChevronRight, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function SelectSeats() {
  const { id: showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setHold, activeHold, clearHold } = useBooking();
  const { socket, joinShowRoom, leaveShowRoom } = useSocket();

  const [showData, setShowData] = useState(null);
  const [layout, setLayout] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);

  // Fetch show details and initial seat layout
  const fetchSeats = async () => {
    try {
      setLoading(true);
      const res = await showService.getShowSeats(showId);
      if (res.success) {
        setShowData(res.data);
        setLayout(res.data.layout || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load seat layout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
    joinShowRoom(showId);

    // Socket listeners for real-time seat locks
    if (socket) {
      socket.on('seats:held', ({ seats, userId, expiresAt }) => {
        // If someone else held seats, update their status to held in local layout
        setLayout((prevLayout) =>
          prevLayout.map((row) => ({
            ...row,
            seats: row.seats.map((seat) => {
              if (seats.includes(seat.seatNumber)) {
                if (user && userId === user.id) {
                  return { ...seat, status: 'selected_by_me' };
                }
                return { ...seat, status: 'held' };
              }
              return seat;
            })
          }))
        );
      });

      socket.on('seats:released', ({ seats }) => {
        setLayout((prevLayout) =>
          prevLayout.map((row) => ({
            ...row,
            seats: row.seats.map((seat) => {
              if (seats.includes(seat.seatNumber) && seat.status !== 'booked') {
                return { ...seat, status: 'available' };
              }
              return seat;
            })
          }))
        );
      });

      socket.on('seats:booked', ({ seats }) => {
        setLayout((prevLayout) =>
          prevLayout.map((row) => ({
            ...row,
            seats: row.seats.map((seat) => {
              if (seats.includes(seat.seatNumber)) {
                return { ...seat, status: 'booked' };
              }
              return seat;
            })
          }))
        );
      });
    }

    return () => {
      leaveShowRoom(showId);
      if (socket) {
        socket.off('seats:held');
        socket.off('seats:released');
        socket.off('seats:booked');
      }
    };
  }, [showId, socket]);

  // Handle seat click toggle
  const handleSeatClick = (seatNumber, category, pricePaise) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
    } else {
      if (selectedSeats.length >= 10) {
        toast.warning('Maximum 10 seats allowed per booking.');
        return;
      }
      setSelectedSeats(prev => [...prev, seatNumber]);
    }
  };

  // Calculate current total
  const selectedSeatDetails = [];
  let subtotalPaise = 0;

  layout.forEach(row => {
    row.seats.forEach(seat => {
      if (selectedSeats.includes(seat.seatNumber)) {
        selectedSeatDetails.push({
          seatNumber: seat.seatNumber,
          category: seat.category,
          pricePaise: seat.pricePaise
        });
        subtotalPaise += seat.pricePaise;
      }
    });
  });

  // Proceed to hold seats and continue to review
  const handleProceedToReview = async () => {
    if (!user) {
      toast.info('Please sign in to proceed with your seat reservation.');
      navigate('/login', { state: { from: { pathname: `/shows/${showId}/seats` } } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to proceed.');
      return;
    }

    try {
      setHolding(true);
      const res = await bookingService.holdSeats(showId, selectedSeats);
      if (res.success) {
        setHold({
          showId,
          seats: selectedSeats,
          holdToken: res.data.holdToken,
          expiresAt: res.data.expiresAt
        });
        setHoldExpiresAt(res.data.expiresAt);
        toast.success('Seats held! Proceeding to order summary...');
        navigate(`/booking/summary`, {
          state: {
            showId,
            seats: selectedSeats,
            holdToken: res.data.holdToken,
            expiresAt: res.data.expiresAt
          }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seat hold conflict. Please choose different seats.');
      fetchSeats(); // Refresh availability
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return <Loader message="Rendering interactive auditorium seating chart..." fullScreen />;
  }

  if (!showData) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-white">Show information could not be retrieved.</h4>
        <Link to="/movies" className="btn btn-cinema mt-3">Browse Movies</Link>
      </div>
    );
  }

  return (
    <div className="container py-4 pb-5">
      {/* Show Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 glass-panel">
        <div>
          <Link to={`/movies/${showData.movie?._id}`} className="text-decoration-none text-secondary small d-flex align-items-center gap-1 mb-1">
            <ArrowLeft size={14} /> Back to Movie Details
          </Link>
          <h3 className="brand-font fw-bold text-white mb-1">
            {showData.movie?.title}
          </h3>
          <div className="d-flex flex-wrap align-items-center gap-2 text-secondary small">
            <span>{showData.theatre?.name}</span>
            <span>•</span>
            <span className="text-white fw-semibold">{showData.screenName}</span>
            <span>•</span>
            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30">
              {showData.format} ({showData.language})
            </span>
            <span>•</span>
            <span className="text-info">
              {new Date(showData.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
              {new Date(showData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="text-end">
            <div className="text-secondary small">Available Seats</div>
            <div className="text-success fw-bold fs-5">{showData.availableSeatsCount} / {showData.totalSeats}</div>
          </div>
        </div>
      </div>

      {/* Auditorium Seat Map */}
      <SeatMap
        layout={layout}
        pricing={showData.pricing || {}}
        selectedSeats={selectedSeats}
        onSeatClick={handleSeatClick}
        holdExpiresAt={holdExpiresAt}
      />

      {/* Bottom Sticky Action Bar */}
      <div
        className="fixed-bottom p-3 border-top border-secondary"
        style={{ backgroundColor: 'rgba(11, 12, 16, 0.98)', backdropFilter: 'blur(12px)', zIndex: 1020 }}
      >
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Selected Seat Chips */}
          <div className="d-flex align-items-center gap-3 overflow-x-auto py-1">
            <div className="text-secondary small fw-semibold text-nowrap">
              {selectedSeats.length > 0 ? (
                <span>Selected ({selectedSeats.length} seats):</span>
              ) : (
                <span className="text-muted">No seats selected yet. Click any available seat above.</span>
              )}
            </div>
            <div className="d-flex gap-1">
              {selectedSeats.map((s) => (
                <span key={s} className="cinema-badge">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Subtotal & Proceed CTA */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {selectedSeats.length > 0 && (
              <div className="text-end">
                <div className="text-secondary small" style={{ fontSize: 11 }}>Subtotal</div>
                <div className="text-white fw-bold fs-5">₹{(subtotalPaise / 100).toFixed(0)}</div>
              </div>
            )}

            <button
              onClick={handleProceedToReview}
              className="btn btn-cinema px-4 py-2 rounded-pill fw-bold d-flex align-items-center gap-2"
              disabled={selectedSeats.length === 0 || holding}
            >
              <span>{holding ? 'Locking Seats...' : 'Proceed to Checkout'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
