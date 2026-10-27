import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import Loader from '../../components/common/Loader';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Printer,
  Download,
  Share2,
  Film
} from 'lucide-react';

export default function Confirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const fetchConfirmedBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getBookingById(bookingId);
        if (res.success) {
          setBooking(res.data);
        }
      } catch (err) {
        console.error('Failed to load confirmed booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmedBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader message="Finalizing digital ticket..." fullScreen />;
  }

  if (!booking) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-white">Booking details not available.</h4>
        <Link to="/dashboard" className="btn btn-cinema mt-3">Go to My Bookings</Link>
      </div>
    );
  }

  const show = booking.show || {};
  const movie = show.movie || {};
  const theatre = show.theatre || {};
  const screen = show.screen || {};

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          {/* Success Banner */}
          <div className="text-center mb-4 no-print">
            <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-20 text-success mb-2">
              <CheckCircle size={48} />
            </div>
            <h2 className="brand-font fw-bold text-white mb-1">Booking Confirmed!</h2>
            <p className="text-secondary small">
              Your tickets have been confirmed and seats are officially reserved.
            </p>
          </div>

          {/* Digital Ticket Pass Card */}
          <div className="card-cinema overflow-hidden border border-secondary shadow-2xl mb-4 printable-ticket">
            {/* Top Ticket Header */}
            <div
              className="p-4 d-flex flex-wrap align-items-center justify-content-between gap-3 text-white"
              style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #31104b 100%)' }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="fs-3">🎬</span>
                <div>
                  <h4 className="brand-font fw-bold mb-0">iMovies Cinema Pass</h4>
                  <div className="text-secondary small" style={{ fontSize: 11 }}>Official Admission Ticket</div>
                </div>
              </div>

              <div className="text-end">
                <div className="text-secondary small" style={{ fontSize: 11 }}>BOOKING REFERENCE</div>
                <div className="fs-5 fw-bold font-monospace text-warning">{booking.bookingReference}</div>
              </div>
            </div>

            {/* Ticket Body */}
            <div className="p-4 p-md-5">
              <div className="row g-4 align-items-center">
                {/* Movie Details */}
                <div className="col-12 col-md-8">
                  <span className="cinema-badge mb-2">{movie.certification || 'UA'} • {show.format} ({show.language})</span>
                  <h3 className="brand-font fw-bold text-white mb-2">{movie.title}</h3>
                  <div className="text-secondary small mb-3 d-flex align-items-center gap-1">
                    <MapPin size={14} className="text-primary" />
                    <span>{theatre.name}, {theatre.city}</span>
                  </div>

                  <div className="row g-3 p-3 bg-dark rounded-3 border border-secondary mb-3">
                    <div className="col-4">
                      <div className="text-secondary small" style={{ fontSize: 11 }}>DATE</div>
                      <div className="text-white fw-bold small">
                        {new Date(show.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-secondary small" style={{ fontSize: 11 }}>TIME</div>
                      <div className="text-white fw-bold small">
                        {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-secondary small" style={{ fontSize: 11 }}>AUDI / SCREEN</div>
                      <div className="text-white fw-bold small">{screen.name || 'Screen 1'}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-secondary small mb-1" style={{ fontSize: 11 }}>CONFIRMED SEATS</div>
                    <div className="d-flex flex-wrap gap-2">
                      {booking.seats?.map((seat) => (
                        <div key={seat.seatNumber} className="cinema-badge p-2 px-3 fw-bold fs-6">
                          {seat.seatNumber}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* QR Code and Scanner Box */}
                <div className="col-12 col-md-4 text-center border-start-md border-dark pt-3 pt-md-0">
                  <div className="p-3 bg-white rounded-3 d-inline-block shadow-sm mb-2">
                    <QRCodeSVG
                      value={`IMOVIES:${booking.bookingReference}:${booking._id}`}
                      size={130}
                      level="H"
                    />
                  </div>
                  <div className="text-muted small" style={{ fontSize: 11 }}>Scan at Gate Entrance</div>
                  <div className="text-success small fw-semibold mt-1">● Ticket Verified Active</div>
                </div>
              </div>
            </div>

            {/* Ticket Footer / Price summary */}
            <div className="p-3 bg-dark border-top border-dark d-flex flex-wrap justify-content-between align-items-center gap-2 small text-secondary">
              <div>Total Paid: <strong className="text-white">₹{(booking.pricing?.totalAmountPaise / 100).toFixed(2)}</strong> via {booking.paymentMethod?.toUpperCase()}</div>
              <div>Customer: <strong className="text-white">{booking.user?.name}</strong></div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="d-flex flex-wrap gap-3 justify-content-between align-items-center no-print">
            <Link to="/dashboard" className="btn btn-outline-light rounded-pill px-4">
              View in My Bookings
            </Link>

            <div className="d-flex gap-2">
              <button onClick={handlePrint} className="btn btn-cinema rounded-pill px-4 d-flex align-items-center gap-2">
                <Printer size={16} />
                <span>Print Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
