import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Ticket, Star, Clock, ChevronRight, ChevronLeft } from 'lucide-react';

export default function HeroBanner({ movies = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);

  const featured = movies.filter(m => m.featured || m.rating >= 8.5).slice(0, 4);

  if (featured.length === 0) return null;

  const currentMovie = featured[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % featured.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <div className="position-relative overflow-hidden mb-5 rounded-4 shadow-2xl" style={{ minHeight: '480px' }}>
      {/* Background Backdrop Image with Multi-directional Gradients */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100 bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url(${currentMovie.backdropUrl || currentMovie.posterUrl})`,
          backgroundPosition: 'center 20%',
          filter: 'brightness(0.55)'
        }}
      />
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(90deg, #0b0c10 0%, rgba(11,12,16,0.85) 45%, rgba(11,12,16,0.2) 100%), linear-gradient(0deg, #0b0c10 0%, transparent 60%)'
        }}
      />

      {/* Content Container */}
      <div className="container position-relative z-1 py-5 d-flex flex-column justify-content-center" style={{ minHeight: '480px' }}>
        <div className="col-12 col-md-8 col-lg-6">
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="cinema-badge">FEATURED BLOCKBUSTER</span>
            <div className="d-flex align-items-center gap-1 text-warning small fw-bold">
              <Star size={14} fill="#f59e0b" />
              <span>{currentMovie.rating?.toFixed(1)}/10</span>
            </div>
            <span className="text-secondary small">•</span>
            <span className="text-secondary small">{currentMovie.durationMinutes} mins</span>
          </div>

          <h1 className="display-4 fw-extrabold text-white mb-3 brand-font lh-tight">
            {currentMovie.title}
          </h1>

          <p className="text-secondary mb-4 line-clamp-3 small fs-6" style={{ maxWidth: '520px' }}>
            {currentMovie.description}
          </p>

          <div className="d-flex flex-wrap gap-2 mb-4">
            {currentMovie.genre?.map(g => (
              <span key={g} className="badge bg-dark bg-opacity-75 border border-secondary text-light px-3 py-2 rounded-pill small">
                {g}
              </span>
            ))}
            {currentMovie.formats?.map(f => (
              <span key={f} className="badge bg-primary bg-opacity-25 border border-primary text-light px-3 py-2 rounded-pill small">
                {f}
              </span>
            ))}
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link
              to={`/movies/${currentMovie._id}`}
              className="btn btn-cinema px-4 py-2 fs-6 rounded-pill d-flex align-items-center gap-2"
            >
              <Ticket size={18} />
              Book Tickets Now
            </Link>

            <button
              onClick={() => setTrailerModalOpen(true)}
              className="btn btn-dark border border-secondary text-light px-4 py-2 fs-6 rounded-pill d-flex align-items-center gap-2 hover-bg"
            >
              <Play size={16} fill="white" />
              Watch Trailer
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots & Arrows */}
      <div className="position-absolute bottom-0 end-0 p-4 z-2 d-flex align-items-center gap-3">
        <div className="d-flex gap-2">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`btn p-0 rounded-circle border-0 transition-all ${
                idx === activeIndex ? 'bg-primary' : 'bg-secondary bg-opacity-50'
              }`}
              style={{ width: idx === activeIndex ? 24 : 8, height: 8, borderRadius: 4 }}
            />
          ))}
        </div>
        <div className="d-flex gap-1 ms-2">
          <button
            onClick={handlePrev}
            className="btn btn-sm btn-dark border border-secondary text-light p-1 rounded-circle"
            title="Previous Movie"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="btn btn-sm btn-dark border border-secondary text-light p-1 rounded-circle"
            title="Next Movie"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark border-secondary text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">{currentMovie.title} — Official Trailer</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setTrailerModalOpen(false)}
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
