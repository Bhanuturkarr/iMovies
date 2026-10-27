import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { useBooking } from '../../context/BookingContext';
import HeroBanner from '../../components/movies/HeroBanner';
import MovieCard from '../../components/movies/MovieCard';
import Loader from '../../components/common/Loader';
import { Sparkles, Calendar, Film, ShieldCheck, Zap, Award } from 'lucide-react';

export default function Home() {
  const { selectedCity } = useBooking();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeMovies = async () => {
      try {
        setLoading(true);
        const res = await movieService.getMovies({ limit: 20 });
        if (res.success) {
          setMovies(res.data);
        }
      } catch (err) {
        console.error('Error fetching home movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeMovies();
  }, [selectedCity]);

  if (loading) {
    return <Loader message="Setting up the cinema experience..." fullScreen />;
  }

  const nowShowing = movies.filter(m => m.status === 'now_showing');
  const upcoming = movies.filter(m => m.status === 'upcoming');

  return (
    <div className="container py-4">
      {/* Featured Hero Carousel */}
      <HeroBanner movies={nowShowing} />

      {/* City Experience Bar */}
      <div className="glass-panel p-3 mb-5 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-circle bg-primary bg-opacity-25 text-primary">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-white fw-bold small">Showing in {selectedCity}</div>
            <div className="text-muted small">Select your preferred multiplex & experience IMAX, 4DX or Dolby Atmos</div>
          </div>
        </div>
        <Link to="/theatres" className="btn btn-sm btn-outline-light rounded-pill px-3 py-1">
          Explore Theatres in {selectedCity}
        </Link>
      </div>

      {/* Now Showing Section */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="text-white fw-bold brand-font mb-1 d-flex align-items-center gap-2">
              <Film className="text-primary" size={24} />
              Now Showing
            </h2>
            <p className="text-secondary small mb-0">Catch the biggest blockbusters on the big screen today</p>
          </div>
          <Link to="/movies?status=now_showing" className="btn btn-sm btn-cinema-outline rounded-pill px-3">
            See All ({nowShowing.length})
          </Link>
        </div>

        <div className="row g-4">
          {nowShowing.slice(0, 8).map((movie) => (
            <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Releases Section */}
      {upcoming.length > 0 && (
        <section className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="text-white fw-bold brand-font mb-1 d-flex align-items-center gap-2">
                <Calendar className="text-warning" size={24} />
                Upcoming Releases
              </h2>
              <p className="text-secondary small mb-0">Get ready for these anticipated movies coming soon to cinemas</p>
            </div>
            <Link to="/movies?status=upcoming" className="btn btn-sm btn-cinema-outline rounded-pill px-3">
              Explore Upcoming
            </Link>
          </div>

          <div className="row g-4">
            {upcoming.slice(0, 4).map((movie) => (
              <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Premium Perks Showcase */}
      <section className="card-cinema p-5 my-5 text-center">
        <h3 className="brand-font fw-bold text-white mb-2">Why Cinephiles Choose iMovies</h3>
        <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '540px' }}>
          Designed for seamless discovery and verified atomic bookings with zero seat contention.
        </p>
        <div className="row g-4 mt-2">
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-primary d-inline-flex mb-3">
              <Zap size={24} />
            </div>
            <h6 className="text-white fw-bold mb-1">Instant Socket-Sync Seats</h6>
            <p className="text-muted small mb-0">Live seat availability updates across devices without manual page refresh.</p>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-warning d-inline-flex mb-3">
              <ShieldCheck size={24} />
            </div>
            <h6 className="text-white fw-bold mb-1">5-Minute Atomic Hold</h6>
            <p className="text-muted small mb-0">Take your time selecting payment options while your seats remain guaranteed.</p>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 rounded-circle bg-dark border border-secondary text-info d-inline-flex mb-3">
              <Award size={24} />
            </div>
            <h6 className="text-white fw-bold mb-1">Digital QR Pass & Easy Refund</h6>
            <p className="text-muted small mb-0">Hassle-free digital entry plus transparent automated refund eligibility.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
