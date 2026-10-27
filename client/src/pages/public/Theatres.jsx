import React, { useState, useEffect } from 'react';
import { theatreService } from '../../services/theatreService';
import { showService } from '../../services/showService';
import { useBooking } from '../../context/BookingContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { MapPin, Film, Sparkles, Tv, ShieldCheck, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Theatres() {
  const { selectedCity, updateCity } = useBooking();
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTheatresAndCities = async () => {
      try {
        setLoading(true);
        const [theatresRes, citiesRes] = await Promise.all([
          theatreService.getTheatres({ city: selectedCity }),
          theatreService.getCities()
        ]);

        if (theatresRes.success) setTheatres(theatresRes.data);
        if (citiesRes.success) setCities(citiesRes.data);
      } catch (err) {
        console.error('Failed to load theatres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheatresAndCities();
  }, [selectedCity]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Cinemas & Multiplexes</h2>
          <p className="text-secondary small mb-0">
            Premium theatre destinations in <strong className="text-white">{selectedCity}</strong>
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="d-flex align-items-center gap-2 overflow-x-auto py-1">
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => updateCity(city)}
              className={`btn btn-sm rounded-pill px-3 py-1 ${
                selectedCity.toLowerCase() === city.toLowerCase()
                  ? 'btn-primary'
                  : 'btn-dark border border-secondary text-secondary hover-text-white'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Theatres List */}
      {loading ? (
        <Loader message="Loading multiplexes..." />
      ) : theatres.length > 0 ? (
        <div className="row g-4 mb-5">
          {theatres.map((theatre) => (
            <div key={theatre._id} className="col-12 col-lg-6">
              <div className="card-cinema p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h5 className="text-white fw-bold mb-0">{theatre.name}</h5>
                    <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 small">
                      Active Cinema
                    </span>
                  </div>

                  <p className="text-secondary small mb-3 d-flex align-items-center gap-2">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span>{theatre.address}, {theatre.city} {theatre.pincode}</span>
                  </p>

                  <div className="mb-3">
                    <div className="text-white small fw-bold mb-2">Signature Experience & Facilities:</div>
                    <div className="d-flex flex-wrap gap-2">
                      {theatre.facilities?.map((f) => (
                        <span key={f} className="cinema-badge small">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-top border-dark d-flex align-items-center justify-content-between">
                  <span className="text-muted small">
                    Dolby Atmos & Laser Projection
                  </span>
                  <Link
                    to={`/movies?city=${theatre.city}`}
                    className="btn btn-sm btn-cinema rounded-pill px-4"
                  >
                    View Movies Here
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No Theatres in ${selectedCity}`}
          description="We are expanding to more cinemas soon. Please choose another city above."
        />
      )}
    </div>
  );
}
