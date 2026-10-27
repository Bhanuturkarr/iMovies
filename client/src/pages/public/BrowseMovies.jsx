import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import MovieCard from '../../components/movies/MovieCard';
import MovieFilters from '../../components/movies/MovieFilters';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { Search } from 'lucide-react';

export default function BrowseMovies() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState({ genres: [], languages: [], formats: [] });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, currentPage: 1 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || 'all',
    genre: searchParams.get('genre') || 'all',
    language: searchParams.get('language') || 'all',
    format: searchParams.get('format') || 'all',
    sortBy: searchParams.get('sortBy') || 'popularity',
    page: 1
  });

  // Fetch filter metadata once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await movieService.getFilterMeta();
        if (res.success) {
          setMeta(res.data);
        }
      } catch (e) {
        console.error('Failed to load filter metadata:', e);
      }
    };
    fetchMeta();
  }, []);

  // Fetch movies whenever filters change
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const params = {
          ...filters,
          limit: 12
        };
        const res = await movieService.getMovies(params);
        if (res.success) {
          setMovies(res.data);
          setPagination({
            total: res.total,
            totalPages: res.totalPages,
            currentPage: res.currentPage
          });
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      status: 'all',
      genre: 'all',
      language: 'all',
      format: 'all',
      sortBy: 'popularity',
      page: 1
    });
    setSearchParams({});
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Explore Movies</h2>
          <p className="text-secondary small mb-0">
            Showing {movies.length} of {pagination.total} movies
          </p>
        </div>

        {/* Search Bar */}
        <div className="position-relative" style={{ maxWidth: '320px', width: '100%' }}>
          <Search size={16} className="position-absolute start-0 ms-3 top-50 translate-middle-y text-muted" />
          <input
            type="text"
            className="form-control cinema-input ps-5 pe-3 py-2 rounded-pill small w-100"
            placeholder="Search movie title..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
      </div>

      {/* Filter Component */}
      <MovieFilters
        genres={meta.genres}
        languages={meta.languages}
        formats={meta.formats}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Movie Grid */}
      {loading ? (
        <Loader message="Fetching matching movies..." />
      ) : movies.length > 0 ? (
        <>
          <div className="row g-4 mb-5">
            {movies.map((movie) => (
              <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 my-4">
              <button
                className="btn btn-sm btn-dark border border-secondary text-light px-3"
                disabled={pagination.currentPage <= 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="d-flex align-items-center px-3 small text-secondary">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                className="btn btn-sm btn-dark border border-secondary text-light px-3"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No Movies Found"
          description="We couldn't find any movie matching your current filters. Try resetting the filters or searching for something else."
          action={
            <button onClick={handleReset} className="btn btn-sm btn-cinema rounded-pill px-4">
              Clear All Filters
            </button>
          }
        />
      )}
    </div>
  );
}
