import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { showService } from '../../services/showService';
import { useBooking } from '../../context/BookingContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  Star,
  Clock,
  Calendar,
  MapPin,
  Play,
  Film,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedCity } = useBooking();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [trailerModal, setTrailerModal] = useState(false);

  // Generate next 4 calendar dates for the date selector
  const availableDates = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateString: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' })
    };
  });

  useEffect(() => {
    const fetchMovieDetailsAndShows = async () => {
      try {
        setLoading(true);
        const movieRes = await movieService.getMovieById(id);
        if (movieRes.success) {
          setMovie(movieRes.data);
        }

        // Fetch shows for this movie in the user's selected city & date
        const showsRes = await showService.getShows({
          movie: id,
          city: selectedCity,
          date: selectedDate
        });
        if (showsRes.success) {
          setShows(showsRes.data);
        }
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetailsAndShows();
  }, [id, selectedCity, selectedDate]);

  if (loading) {
    return <Loader message="Loading movie details and cinema showtimes..." fullScreen />;
  }

  if (!movie) {
    return (
      <div className="container py-5">
        <EmptyState
          title="Movie Not Found"
          description="The requested movie could not be located in our catalogue."
          action={
            <Link to="/movies" className="btn btn-cinema rounded-pill px-4">
              Back to Movies
            </Link>
          }
        />
      </div>
    );
  }

  // Group shows by Theatre
  const filteredShows = shows.filter(s =>
    selectedFormat === 'all' ? true : s.format === selectedFormat
  );

  const showsByTheatre = filteredShows.reduce((acc, show) => {
    const theatreId = show.theatre?._id || 'unknown';
    if (!acc[theatreId]) {
      acc[theatreId] = {
        theatre: show.theatre,
        shows: []
      };
    }
    acc[theatreId].shows.push(show);
    return acc;
  }, {});

  return (
    <div>
      {/* Cinematic Backdrop Hero */}
      <div className="position-relative overflow-hidden" style={{ minHeight: '440px' }}>
        <div
          className="position-absolute top-0 start-0 w-100 h-100 bg-cover bg-center"
          style={{
            backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
            filter: 'brightness(0.35) blur(1px)'
          }}
        />
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'linear-gradient(to top, #0b0c10 0%, rgba(11,12,16,0.7) 60%, transparent 100%)'
          }}
        />

        {/* Content Banner */}
        <div className="container position-relative z-1 py-5">
          <div className="row g-4 align-items-center">
            {/* Poster */}
            <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="rounded-4 shadow-2xl border border-secondary img-fluid"
                style={{ maxHeight: '380px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Information */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="cinema-badge">{movie.certification || 'UA'}</span>
                <div className="d-flex align-items-center gap-1 text-warning small fw-bold">
                  <Star size={16} fill="#f59e0b" />
                  <span>{movie.rating ? movie.rating.toFixed(1) : '8.0'}/10</span>
                  <span className="text-secondary">({movie.voteCount} reviews)</span>
                </div>
                <span className="text-secondary small">•</span>
                <span className="text-secondary small d-flex align-items-center gap-1">
                  <Clock size={14} />
                  {movie.durationMinutes} minutes
                </span>
              </div>

              <h1 className="display-4 fw-extrabold text-white mb-2 brand-font">
                {movie.title}
              </h1>

              <div className="d-flex flex-wrap gap-2 mb-3">
                {movie.genre?.map(g => (
                  <span key={g} className="badge bg-dark border border-secondary text-light px-3 py-1 rounded-pill small">
                    {g}
                  </span>
                ))}
                {movie.language?.map(l => (
                  <span key={l} className="badge bg-primary bg-opacity-25 border border-primary text-light px-3 py-1 rounded-pill small">
                    {l}
                  </span>
                ))}
              </div>

              <p className="text-secondary small mb-4" style={{ maxWidth: '640px' }}>
                {movie.description}
              </p>

              {movie.cast && movie.cast.length > 0 && (
                <div className="mb-4">
                  <div className="text-white small fw-bold mb-1">Top Cast & Director:</div>
                  <div className="text-secondary small">
                    {movie.director && <span className="text-primary me-2">Director: {movie.director} |</span>}
                    {movie.cast.map(c => c.name).join(', ')}
                  </div>
                </div>
              )}

              <div className="d-flex align-items-center gap-3">
                <button
                  onClick={() => setTrailerModal(true)}
                  className="btn btn-outline-light rounded-pill px-4 py-2 d-flex align-items-center gap-2 small"
                >
                  <Play size={16} fill="white" />
                  Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Multiplex Listings */}
      <div className="container py-5">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-dark">
          <div>
            <h3 className="brand-font fw-bold text-white mb-1">Book Showtimes</h3>
            <div className="d-flex align-items-center gap-2 text-secondary small">
              <MapPin size={14} className="text-primary" />
              <span>Cinemas in <strong className="text-white">{selectedCity}</strong></span>
            </div>
          </div>

          {/* Date Selector Pills */}
          <div className="d-flex align-items-center gap-2 overflow-x-auto py-1">
            {availableDates.map((item) => {
              const isSelected = selectedDate === item.dateString;
              return (
                <button
                  key={item.dateString}
                  onClick={() => setSelectedDate(item.dateString)}
                  className={`btn p-2 rounded-3 text-center transition-all ${
                    isSelected
                      ? 'btn-primary bg-primary text-white shadow-sm'
                      : 'btn-dark border border-secondary text-secondary hover-text-white'
                  }`}
                  style={{ minWidth: '72px' }}
                >
                  <div className="small fw-semibold">{item.dayName}</div>
                  <div className="fs-6 fw-bold">{item.dayNum}</div>
                  <div style={{ fontSize: 10 }}>{item.month}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Multiplex Shows List */}
        {Object.keys(showsByTheatre).length > 0 ? (
          <div className="d-flex flex-column gap-4">
            {Object.values(showsByTheatre).map(({ theatre, shows }) => (
              <div key={theatre?._id || Math.random()} className="card-cinema p-4">
                <div className="row g-3 align-items-center">
                  {/* Theatre Details */}
                  <div className="col-12 col-md-4 border-end-md border-dark">
                    <h5 className="text-white fw-bold mb-1">{theatre?.name}</h5>
                    <p className="text-secondary small mb-2">{theatre?.address}</p>
                    <div className="d-flex flex-wrap gap-1">
                      {theatre?.facilities?.slice(0, 3).map((f) => (
                        <span key={f} className="cinema-badge-silver" style={{ fontSize: 10 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Show Timing Slots */}
                  <div className="col-12 col-md-8">
                    <div className="d-flex flex-wrap gap-3">
                      {shows.map((show) => {
                        const showTime = new Date(show.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                        return (
                          <div
                            key={show._id}
                            className="p-3 bg-dark bg-opacity-75 rounded-3 border border-secondary d-flex flex-column align-items-center justify-content-between"
                            style={{ minWidth: '135px' }}
                          >
                            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 mb-2 small">
                              {show.format} • {show.language}
                            </span>
                            <div className="text-white fw-bold fs-6 mb-2">{showTime}</div>
                            <div className="text-secondary small mb-2" style={{ fontSize: 11 }}>
                              {show.screen?.name || 'Screen 1'}
                            </div>
                            <Link
                              to={`/shows/${show._id}/seats`}
                              className="btn btn-sm btn-cinema w-100 py-1 rounded-pill"
                            >
                              Select Seats
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Shows Scheduled"
            description={`There are currently no scheduled shows for this movie in ${selectedCity} on the selected date.`}
            action={
              <button
                onClick={() => setSelectedDate(availableDates[0].dateString)}
                className="btn btn-sm btn-cinema rounded-pill px-4"
              >
                View Available Dates
              </button>
            }
          />
        )}
      </div>

      {/* Trailer Modal */}
      {trailerModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark border-secondary text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">{movie.title} — Official Trailer</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setTrailerModal(false)}
                />
              </div>
              <div className="modal-body p-0 ratio ratio-16x9">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/zSWdZVtXT7E?autoplay=1"
                  title="Movie Trailer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
