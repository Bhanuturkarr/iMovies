import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import {
  Ticket,
  Clock,
  ShieldCheck,
  Tag,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  MapPin
} from 'lucide-react';

export default function BookingSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeHold, setCurrentBooking } = useBooking();

  const stateData = location.state || activeHold;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [discountPaise, setDiscountPaise] = useState(0);

  useEffect(() => {
    if (!stateData || !stateData.showId || !stateData.holdToken || !stateData.seats) {
      toast.error('No active seat hold found. Please pick your seats.');
      navigate('/movies');
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const res = await bookingService.initiateBooking({
          showId: stateData.showId,
          seatNumbers: stateData.seats,
          holdToken: stateData.holdToken
        });
        if (res.success) {
          setBooking(res.data);
          setCurrentBooking(res.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initiate booking order.');
        navigate(`/shows/${stateData.showId}/seats`);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [stateData]);

  // Apply promo discount
  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'CINEMA50' || code === 'IMOVIES50') {
      const discount = 5000; // Rs 50.00
      setDiscountPaise(discount);
      toast.success('Promo code applied! ₹50 discount added.');
    } else if (code === 'IMOVIES100') {
      const discount = 10000; // Rs 100.00
      setDiscountPaise(discount);
      toast.success('VIP promo applied! ₹100 discount added.');
    } else {
      toast.error('Invalid promo code. Try "CINEMA50" or "IMOVIES100".');
    }
  };

  if (loading) {
    return <Loader message="Calculating verified pricing and convenience fees..." fullScreen />;
  }

  if (!booking) return null;

  const pricing = booking.pricing;
  const finalPayablePaise = Math.max(0, pricing.totalAmountPaise - discountPaise);

  return (
    <div className="container py-5">
      <div className="row g-4 justify-content-center">
        <div className="col-12 col-lg-8">
          {/* Order Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <Link to={`/shows/${booking.show?._id || stateData.showId}/seats`} className="text-secondary small d-flex align-items-center gap-1 mb-1 text-decoration-none">
                <ArrowLeft size={14} /> Modify Seat Selection
              </Link>
              <h2 className="brand-font fw-bold text-white mb-0">Booking Summary</h2>
            </div>
            <div className="cinema-badge">
              Order Ref: {booking.bookingReference}
            </div>
          </div>

          {/* Booking Card */}
          <div className="card-cinema p-4 mb-4">
            <h5 className="text-white fw-bold mb-3 border-bottom border-dark pb-2">
              Reserved Seats & Show Details
            </h5>

            <div className="d-flex flex-wrap gap-2 mb-3">
              {booking.seats?.map((s) => (
                <div key={s.seatNumber} className="cinema-badge p-2 d-flex align-items-center gap-2">
                  <Ticket size={14} className="text-primary" />
                  <span>Seat {s.seatNumber} ({s.category})</span>
                  <span className="text-white fw-bold">• ₹{(s.pricePaise / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-dark rounded-3 border border-secondary text-secondary small d-flex align-items-center justify-content-between">
              <span>Customer Name: <strong className="text-white">{user?.name}</strong></span>
              <span>Contact Email: <strong className="text-white">{user?.email}</strong></span>
            </div>
          </div>

          {/* Itemized Price Breakdown */}
          <div className="card-cinema p-4 mb-4">
            <h5 className="text-white fw-bold mb-3 border-bottom border-dark pb-2">
              Itemized Payment Breakdown
            </h5>

            <div className="d-flex justify-content-between small text-secondary mb-2">
              <span>Ticket Base Fare ({booking.seats?.length} tickets)</span>
              <span className="text-white fw-semibold">₹{(pricing.baseAmountPaise / 100).toFixed(2)}</span>
            </div>

            <div className="d-flex justify-content-between small text-secondary mb-2">
              <span>Convenience Fee (₹25 per ticket)</span>
              <span className="text-white fw-semibold">₹{(pricing.convenienceFeePaise / 100).toFixed(2)}</span>
            </div>

            <div className="d-flex justify-content-between small text-secondary mb-3 pb-2 border-bottom border-dark">
              <span>Integrated GST (18% on convenience fee)</span>
              <span className="text-white fw-semibold">₹{(pricing.gstPaise / 100).toFixed(2)}</span>
            </div>

            {discountPaise > 0 && (
              <div className="d-flex justify-content-between small text-success mb-3 pb-2 border-bottom border-dark">
                <span>Promo Discount ({promoCode.toUpperCase()})</span>
                <span className="fw-bold">-₹{(discountPaise / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center pt-2">
              <div>
                <div className="text-secondary small fw-bold">Total Amount Payable</div>
                <div className="text-muted" style={{ fontSize: 11 }}>Inclusive of all applicable cinema taxes</div>
              </div>
              <div className="display-6 fw-bold text-white brand-font">
                ₹{(finalPayablePaise / 100).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Promo Code Input */}
          <div className="card-cinema p-3 mb-4">
            <form onSubmit={handleApplyPromo} className="d-flex gap-2">
              <div className="position-relative flex-grow-1">
                <Tag size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
                <input
                  type="text"
                  className="form-control cinema-input ps-5 py-2 small"
                  placeholder="Enter Promo Code (e.g. CINEMA50)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline-primary px-3 rounded-pill small">
                Apply Code
              </button>
            </form>
          </div>

          {/* Checkout CTA */}
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 text-secondary small">
              <ShieldCheck size={18} className="text-success" />
              <span>PCI-DSS Compliant 256-bit Encrypted Checkout</span>
            </div>

            <button
              onClick={() => navigate(`/checkout/${booking._id}`, { state: { finalPayablePaise } })}
              className="btn btn-cinema px-5 py-3 rounded-pill fs-6 fw-bold d-flex align-items-center gap-2 shadow-lg"
            >
              <span>Proceed to Payment</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
