import React from 'react';
import { Armchair, Sparkles, Clock, AlertCircle } from 'lucide-react';

export default function SeatMap({
  layout = [],
  pricing = {},
  selectedSeats = [],
  onSeatClick,
  holdExpiresAt = null,
  maxSeats = 10
}) {
  const formatCurrency = (paise) => `₹${(paise / 100).toFixed(0)}`;

  // Calculate remaining hold time
  const [timeLeft, setTimeLeft] = React.useState(null);

  React.useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = new Date(holdExpiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  return (
    <div className="card-cinema p-4 position-relative">
      {/* Hold Session Timer Banner */}
      {timeLeft && (
        <div className="alert alert-warning bg-warning bg-opacity-10 border-warning text-warning d-flex align-items-center justify-content-between py-2 px-3 mb-4 rounded-3">
          <div className="d-flex align-items-center gap-2 small fw-semibold">
            <Clock size={16} />
            <span>Seats are locked for checkout!</span>
          </div>
          <div className="badge bg-warning text-dark fs-6 px-3 py-1 font-monospace fw-bold">
            {timeLeft}
          </div>
        </div>
      )}

      {/* Screen Curved Projection Bar */}
      <div className="cinema-screen-container">
        <div className="cinema-screen-curve" />
        <div className="screen-text">SCREEN THIS WAY</div>
      </div>

      {/* Interactive Seat Rows */}
      <div className="overflow-x-auto py-2 text-center">
        <div className="d-inline-block mx-auto min-w-max">
          {layout.map((row) => {
            const rowPrice = row.pricePaise || pricing[row.category] || 24000;
            return (
              <div key={row.rowLabel} className="d-flex align-items-center justify-content-center mb-2">
                {/* Left Row Label */}
                <div
                  className="text-secondary small fw-bold me-3 text-end"
                  style={{ width: '24px' }}
                >
                  {row.rowLabel}
                </div>

                {/* Seats in Row */}
                <div className="d-flex align-items-center justify-content-center gap-1">
                  {row.seats.map((seat, seatIdx) => {
                    const isSelected = selectedSeats.includes(seat.seatNumber);
                    const isHeld = seat.status === 'held';
                    const isBooked = seat.status === 'booked';
                    const isSpace = seat.type === 'space';
                    const isWheelchair = seat.type === 'wheelchair';

                    let seatClass = 'available';
                    if (isSelected || seat.status === 'selected_by_me') {
                      seatClass = 'selected';
                    } else if (isHeld) {
                      seatClass = 'held';
                    } else if (isBooked) {
                      seatClass = 'booked';
                    }

                    // Aisle spacer after seat 4 and seat 8
                    const hasAisleGap = seatIdx === 3 || seatIdx === 7;

                    return (
                      <React.Fragment key={seat.seatNumber}>
                        <button
                          type="button"
                          className={`seat ${seatClass} ${isSpace ? 'space' : ''}`}
                          onClick={() => {
                            if (!isBooked && !isHeld) {
                              onSeatClick(seat.seatNumber, row.category, rowPrice);
                            }
                          }}
                          disabled={isBooked || isHeld}
                          title={`${seat.seatNumber} • ${row.category} • ${formatCurrency(rowPrice)}${
                            isBooked ? ' (Already Booked)' : isHeld ? ' (Held by someone)' : ''
                          }`}
                        >
                          {isWheelchair ? '♿' : seat.col}
                        </button>
                        {hasAisleGap && <div style={{ width: '18px' }} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Right Row Label */}
                <div
                  className="text-secondary small fw-bold ms-3 text-start"
                  style={{ width: '24px' }}
                >
                  {row.rowLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seating Legend */}
      <div className="mt-4 pt-4 border-top border-dark d-flex flex-wrap align-items-center justify-content-center gap-4 text-secondary small">
        <div className="d-flex align-items-center gap-2">
          <div className="seat available" style={{ width: 18, height: 18, cursor: 'default' }}></div>
          <span>Available</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat selected" style={{ width: 18, height: 18, cursor: 'default' }}></div>
          <span className="text-white fw-semibold">Your Selection</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat held" style={{ width: 18, height: 18, cursor: 'default' }}></div>
          <span>Held (Locking...)</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div className="seat booked" style={{ width: 18, height: 18, cursor: 'default' }}></div>
          <span>Sold Out</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="fs-6">♿</span>
          <span>Wheelchair Accessible</span>
        </div>
      </div>

      {/* Pricing Tier Legend */}
      <div className="mt-3 d-flex flex-wrap align-items-center justify-content-center gap-3">
        {Object.entries(pricing).map(([category, pricePaise]) => (
          <div key={category} className="cinema-badge small">
            {category}: <span className="text-white fw-bold">{formatCurrency(pricePaise)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
