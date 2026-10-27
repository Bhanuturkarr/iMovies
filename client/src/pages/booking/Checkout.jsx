import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { useBooking } from '../../context/BookingContext';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearHold } = useBooking();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mock_upi'); // 'mock_upi', 'mock_card', 'razorpay'

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getBookingById(bookingId);
        if (res.success) {
          setBooking(res.data);
          if (res.data.bookingStatus === 'confirmed') {
            navigate(`/confirmation/${bookingId}`);
          }
        }
      } catch (err) {
        toast.error('Booking not found or session has expired.');
        navigate('/movies');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  // Execute payment process
  const handlePayment = async (simulateFailure = false) => {
    try {
      setProcessing(true);

      // 1. Create order on backend
      const orderRes = await paymentService.createPaymentOrder(bookingId);
      if (!orderRes.success) {
        throw new Error('Order creation failed.');
      }

      const orderData = orderRes.data;

      // 2. Mock mode payment processing
      if (orderData.isMock || paymentMethod.startsWith('mock_')) {
        toast.info('Simulating payment transaction with server verification...');

        const verificationData = {
          bookingId,
          orderId: orderData.orderId,
          paymentId: simulateFailure ? 'FAIL' : `pay_mock_${Date.now()}`,
          signature: simulateFailure ? 'INVALID_SIGNATURE' : `sig_mock_${Date.now()}`
        };

        const verifyRes = await paymentService.verifyPayment(verificationData);

        if (verifyRes.success) {
          clearHold();
          toast.success('Payment verified! Tickets confirmed.');
          navigate(`/confirmation/${bookingId}`);
        } else {
          toast.error(verifyRes.message || 'Payment simulation failed.');
        }
      } else {
        // Live Razorpay Mode (if credentials configured)
        if (!window.Razorpay) {
          toast.error('Razorpay SDK not loaded. Defaulting to Mock Mode.');
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency,
          name: 'iMovies Cinemas',
          description: `Booking #${booking.bookingReference}`,
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              const verifyRes = await paymentService.verifyPayment({
                bookingId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });

              if (verifyRes.success) {
                clearHold();
                navigate(`/confirmation/${bookingId}`);
              } else {
                toast.error('Signature verification failed on server.');
              }
            } catch (vErr) {
              toast.error(vErr.response?.data?.message || 'Payment verification failed.');
            }
          },
          prefill: {
            name: booking.user?.name,
            email: booking.user?.email,
            contact: booking.user?.phone
          },
          theme: {
            color: '#8b5cf6'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment processing error.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loader message="Initializing secure checkout gateway..." fullScreen />;
  }

  if (!booking) return null;

  const totalPaise = location.state?.finalPayablePaise || booking.pricing?.totalAmountPaise || 0;

  return (
    <div className="container py-5">
      <div className="row g-4 justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card-cinema p-4 p-md-5 shadow-2xl">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-dark pb-3">
              <div>
                <h3 className="brand-font fw-bold text-white mb-0">Payment Gateway</h3>
                <div className="text-secondary small">Ref: {booking.bookingReference}</div>
              </div>
              <div className="text-end">
                <div className="text-secondary small" style={{ fontSize: 11 }}>Payable Amount</div>
                <div className="text-white fw-bold fs-4">₹{(totalPaise / 100).toFixed(2)}</div>
              </div>
            </div>

            {/* Development Mock Notice Banner */}
            <div className="alert alert-info bg-info bg-opacity-10 border-info text-info small rounded-3 p-3 mb-4">
              <div className="d-flex align-items-center gap-2 fw-bold mb-1">
                <Sparkles size={16} />
                <span>Local Development & Simulation Mode</span>
              </div>
              <p className="mb-0 text-secondary" style={{ fontSize: 12 }}>
                Razorpay test keys can be configured in `.env`. By default, this app operates in fully functional Mock Simulation mode where payment signature verification and atomic ticket finalization are verified on the server.
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="text-white small fw-bold mb-2 d-block">Select Payment Option</label>

              <div className="d-flex flex-column gap-2">
                <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                  paymentMethod === 'mock_upi' ? 'bg-primary bg-opacity-15 border-primary text-white' : 'bg-dark border-secondary text-secondary'
                }`}>
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mock_upi"
                      checked={paymentMethod === 'mock_upi'}
                      onChange={() => setPaymentMethod('mock_upi')}
                      className="form-check-input"
                    />
                    <div>
                      <div className="fw-semibold text-white">Instant UPI Simulation (GPay / PhonePe)</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Simulated instantaneous UPI confirmation</div>
                    </div>
                  </div>
                  <Smartphone size={20} className="text-primary" />
                </label>

                <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                  paymentMethod === 'mock_card' ? 'bg-primary bg-opacity-15 border-primary text-white' : 'bg-dark border-secondary text-secondary'
                }`}>
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mock_card"
                      checked={paymentMethod === 'mock_card'}
                      onChange={() => setPaymentMethod('mock_card')}
                      className="form-check-input"
                    />
                    <div>
                      <div className="fw-semibold text-white">Debit / Credit Card Simulation</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Simulated 3D Secure card gateway</div>
                    </div>
                  </div>
                  <CreditCard size={20} className="text-warning" />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-column gap-2 mb-4">
              <button
                type="button"
                onClick={() => handlePayment(false)}
                className="btn btn-cinema py-3 rounded-pill fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                disabled={processing}
              >
                <Lock size={18} />
                <span>{processing ? 'Verifying Transaction...' : `Pay ₹${(totalPaise / 100).toFixed(2)}`}</span>
              </button>

              {/* Edge Case Demonstration: Simulate Payment Failure */}
              <button
                type="button"
                onClick={() => handlePayment(true)}
                className="btn btn-outline-danger py-2 rounded-pill small fw-semibold"
                disabled={processing}
                title="Tests proper error handling when payment gateway declines transaction"
              >
                Simulate Payment Decline (Edge Case Test)
              </button>
            </div>

            {/* Security Guarantee Footnote */}
            <div className="text-center text-muted small d-flex align-items-center justify-content-center gap-1">
              <ShieldCheck size={14} className="text-success" />
              <span>Verified 256-Bit SSL Encrypted Server Finalization</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
