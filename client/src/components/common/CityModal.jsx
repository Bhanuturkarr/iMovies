import React, { useState, useEffect } from 'react';
import { theatreService } from '../../services/theatreService';
import { useBooking } from '../../context/BookingContext';
import { MapPin, Check } from 'lucide-react';

const popularCities = ['Mumbai', 'Bengaluru', 'Delhi NCR', 'Hyderabad', 'Chennai'];

export default function CityModal({ isOpen, onClose }) {
  const { selectedCity, updateCity } = useBooking();
  const [cities, setCities] = useState(popularCities);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await theatreService.getCities();
        if (res.success && res.data.length > 0) {
          // Merge unique
          const combined = Array.from(new Set([...popularCities, ...res.data]));
          setCities(combined);
        }
      } catch (e) {
        // Fallback to default popular cities
      }
    };
    fetchCities();
  }, []);

  if (!isOpen) return null;

  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (city) => {
    updateCity(city);
    onClose();
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark border border-secondary text-light rounded-4 shadow-lg">
          <div className="modal-header border-bottom border-secondary pb-3">
            <h5 className="modal-title d-flex align-items-center gap-2 fw-bold text-white">
              <MapPin className="text-primary" size={20} />
              Select Your Cinema City
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            <input
              type="text"
              className="form-control cinema-input w-100 mb-3"
              placeholder="Search your city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />

            <div className="text-secondary small fw-bold text-uppercase mb-2">Popular Cities</div>
            <div className="row g-2">
              {filteredCities.map((city) => {
                const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
                return (
                  <div key={city} className="col-6">
                    <button
                      className={`btn w-100 d-flex justify-content-between align-items-center p-2 rounded-3 text-start ${
                        isSelected
                          ? 'btn-primary bg-primary border-primary text-white fw-bold'
                          : 'btn-outline-secondary border-secondary text-light'
                      }`}
                      onClick={() => handleSelect(city)}
                    >
                      <span>{city}</span>
                      {isSelected && <Check size={16} />}
                    </button>
                  </div>
                );
              })}
              {filteredCities.length === 0 && (
                <div className="col-12 text-center text-muted py-3">
                  No cities found matching "{search}"
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
