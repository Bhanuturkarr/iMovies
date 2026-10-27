import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Calendar } from 'lucide-react';

export default function MovieCard({ movie }) {
  const isUpcoming = movie.status === 'upcoming';

  return (
    <div className="card-cinema h-100 d-flex flex-column overflow-hidden position-relative group">
      {/* Poster Container */}
      <div className="position-relative overflow-hidden" style={{ paddingTop: '145%' }}>
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover transition-all"
          onError={(e) => {
            // Graceful fallback if image link breaks
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
          }}
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="position-absolute top-0 start-0 w-100 p-2 d-flex justify-content-between align-items-start" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
          <span className="cinema-badge">
            {movie.certification || 'UA'}
          </span>
          <div className="d-flex gap-1">
            {movie.formats?.slice(0, 2).map((fmt) => (
              <span key={fmt} className="cinema-badge-gold">
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Rating Overlay */}
        {!isUpcoming && movie.rating > 0 && (
          <div className="position-absolute bottom-0 start-0 w-100 p-2 d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(to top, rgba(11,12,16,0.95), transparent)' }}>
            <div className="d-flex align-items-center gap-1 text-warning small fw-bold">
              <Star size={14} fill="#f59e0b" />
              <span>{movie.rating.toFixed(1)}</span>
              <span className="text-muted" style={{ fontSize: 11 }}>({movie.voteCount})</span>
            </div>
            <div className="d-flex align-items-center gap-1 text-secondary small">
              <Clock size={12} />
              <span style={{ fontSize: 11 }}>{movie.durationMinutes}m</span>
            </div>
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          <h6 className="text-white fw-bold mb-1 text-truncate" title={movie.title}>
            {movie.title}
          </h6>
          <div className="text-secondary small mb-2 text-truncate">
            {movie.genre?.join(', ')} • {movie.language?.join(', ')}
          </div>
        </div>

        <div className="pt-2 border-top border-dark d-flex align-items-center justify-content-between">
          {isUpcoming ? (
            <div className="small text-info d-flex align-items-center gap-1">
              <Calendar size={13} />
              <span>Releasing {new Date(movie.releaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          ) : (
            <span className="small text-success fw-medium">● Now Showing</span>
          )}

          <Link
            to={`/movies/${movie._id}`}
            className={`btn btn-sm ${isUpcoming ? 'btn-outline-secondary text-light' : 'btn-cinema'} rounded-pill px-3 py-1`}
          >
            {isUpcoming ? 'Details' : 'Book'}
          </Link>
        </div>
      </div>
    </div>
  );
}
