import React from 'react';
import { Filter, X } from 'lucide-react';

export default function MovieFilters({
  genres = [],
  languages = [],
  formats = ['2D', '3D', 'IMAX', '4DX'],
  filters,
  onChange,
  onReset
}) {
  return (
    <div className="card-cinema p-3 mb-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 border-bottom border-dark pb-2">
        <div className="d-flex align-items-center gap-2 text-white fw-bold">
          <Filter size={18} className="text-primary" />
          <span>Filters & Sort</span>
        </div>
        <button
          onClick={onReset}
          className="btn btn-sm btn-link text-secondary text-decoration-none d-flex align-items-center gap-1 p-0"
        >
          <X size={14} />
          <span>Reset All</span>
        </button>
      </div>

      <div className="row g-2">
        {/* Status */}
        <div className="col-12 col-sm-6 col-md-3">
          <label className="form-label text-secondary small fw-semibold mb-1">Release Status</label>
          <select
            className="form-select cinema-input small py-1"
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value)}
          >
            <option value="all">All Movies</option>
            <option value="now_showing">Now Showing</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>

        {/* Genre */}
        <div className="col-12 col-sm-6 col-md-3">
          <label className="form-label text-secondary small fw-semibold mb-1">Genre</label>
          <select
            className="form-select cinema-input small py-1"
            value={filters.genre}
            onChange={(e) => onChange('genre', e.target.value)}
          >
            <option value="all">All Genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div className="col-12 col-sm-6 col-md-2">
          <label className="form-label text-secondary small fw-semibold mb-1">Language</label>
          <select
            className="form-select cinema-input small py-1"
            value={filters.language}
            onChange={(e) => onChange('language', e.target.value)}
          >
            <option value="all">All Languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div className="col-12 col-sm-6 col-md-2">
          <label className="form-label text-secondary small fw-semibold mb-1">Format</label>
          <select
            className="form-select cinema-input small py-1"
            value={filters.format}
            onChange={(e) => onChange('format', e.target.value)}
          >
            <option value="all">All Formats</option>
            {formats.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="col-12 col-sm-6 col-md-2">
          <label className="form-label text-secondary small fw-semibold mb-1">Sort By</label>
          <select
            className="form-select cinema-input small py-1"
            value={filters.sortBy}
            onChange={(e) => onChange('sortBy', e.target.value)}
          >
            <option value="popularity">Popularity</option>
            <option value="rating">Top Rated</option>
            <option value="releaseDate">Release Date</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>
    </div>
  );
}
