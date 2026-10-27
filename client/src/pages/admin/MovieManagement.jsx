import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search, Film, Star, AlertCircle, X } from 'lucide-react';

export default function MovieManagement() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    posterUrl: '',
    backdropUrl: '',
    genre: 'Action, Thriller',
    language: 'Hindi, English',
    durationMinutes: 140,
    certification: 'UA',
    status: 'now_showing',
    rating: 8.0,
    formats: '2D, 3D'
  });

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await movieService.getMovies({ limit: 100 });
      if (res.success) {
        setMovies(res.data);
      }
    } catch (err) {
      toast.error('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      description: '',
      posterUrl: '',
      backdropUrl: '',
      genre: 'Action, Thriller',
      language: 'Hindi, English',
      durationMinutes: 140,
      certification: 'UA',
      status: 'now_showing',
      rating: 8.0,
      formats: '2D, 3D'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl || '',
      genre: movie.genre?.join(', ') || '',
      language: movie.language?.join(', ') || '',
      durationMinutes: movie.durationMinutes,
      certification: movie.certification,
      status: movie.status,
      rating: movie.rating || 8.0,
      formats: movie.formats?.join(', ') || '2D, 3D'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        durationMinutes: parseInt(formData.durationMinutes, 10),
        rating: parseFloat(formData.rating),
        genre: formData.genre.split(',').map(s => s.trim()).filter(Boolean),
        language: formData.language.split(',').map(s => s.trim()).filter(Boolean),
        formats: formData.formats.split(',').map(s => s.trim()).filter(Boolean),
        releaseDate: editingMovie?.releaseDate || new Date()
      };

      if (editingMovie) {
        await movieService.updateMovie(editingMovie._id, payload);
        toast.success('Movie updated successfully!');
      } else {
        await movieService.createMovie(payload);
        toast.success('Movie added to catalogue!');
      }

      setModalOpen(false);
      fetchMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save movie.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to remove or archive "${title}"?`)) {
      try {
        const res = await movieService.deleteMovie(id);
        toast.success(res.message || 'Movie deleted or archived.');
        fetchMovies();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete movie.');
      }
    }
  };

  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Movie Catalogue Management</h2>
          <p className="text-secondary small mb-0">Create, edit, and organize movies, certifications, and formats</p>
        </div>

        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control cinema-input py-1 px-3 small rounded-pill"
            placeholder="Search movie title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={handleOpenAdd} className="btn btn-cinema rounded-pill px-4 btn-sm d-flex align-items-center gap-1 text-nowrap">
            <Plus size={16} /> Add Movie
          </button>
        </div>
      </div>

      {loading ? (
        <Loader message="Loading movie catalogue..." />
      ) : (
        <div className="card-cinema p-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary small mb-0 align-middle">
              <thead>
                <tr className="text-secondary">
                  <th>Poster</th>
                  <th>Title & Duration</th>
                  <th>Genre & Language</th>
                  <th>Cert</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="rounded-2 object-fit-cover"
                        style={{ width: 40, height: 56 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                    </td>
                    <td>
                      <div className="text-white fw-bold">{m.title}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{m.durationMinutes} minutes</div>
                    </td>
                    <td>
                      <div className="text-secondary">{m.genre?.join(', ')}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{m.language?.join(', ')}</div>
                    </td>
                    <td>
                      <span className="cinema-badge">{m.certification}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        m.status === 'now_showing'
                          ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-30'
                          : m.status === 'upcoming'
                          ? 'bg-warning bg-opacity-25 text-warning border border-warning border-opacity-30'
                          : 'bg-secondary'
                      }`}>
                        {m.status === 'now_showing' ? 'Now Showing' : m.status === 'upcoming' ? 'Upcoming' : 'Ended'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1 text-warning fw-semibold">
                        <Star size={13} fill="#f59e0b" />
                        <span>{m.rating?.toFixed(1) || '8.0'}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="btn btn-sm btn-dark border-secondary text-primary p-1 rounded-2"
                          title="Edit Movie"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(m._id, m.title)}
                          className="btn btn-sm btn-dark border-secondary text-danger p-1 rounded-2"
                          title="Delete/Archive Movie"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No movies found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark border-secondary text-light rounded-4">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">
                  {editingMovie ? 'Edit Movie' : 'Add New Movie to Catalogue'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label text-secondary small fw-semibold">Movie Title *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Certification</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.certification}
                        onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.value }))}
                      >
                        <option value="U">U (Universal)</option>
                        <option value="UA">UA (Parental Guidance)</option>
                        <option value="A">A (Adults Only)</option>
                        <option value="S">S (Specialized)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label text-secondary small fw-semibold">Description / Synopsis *</label>
                      <textarea
                        className="form-control cinema-input"
                        rows="3"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Poster URL *</label>
                      <input
                        type="url"
                        className="form-control cinema-input"
                        placeholder="https://..."
                        value={formData.posterUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Backdrop Image URL</label>
                      <input
                        type="url"
                        className="form-control cinema-input"
                        placeholder="https://..."
                        value={formData.backdropUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, backdropUrl: e.target.value }))}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Genres (comma separated)</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Action, Sci-Fi, Thriller"
                        value={formData.genre}
                        onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Languages (comma separated)</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Hindi, English, Tamil"
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Duration (Minutes)</label>
                      <input
                        type="number"
                        className="form-control cinema-input"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Status</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="now_showing">Now Showing</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="ended">Ended</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Formats (comma separated)</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        value={formData.formats}
                        onChange={(e) => setFormData(prev => ({ ...prev, formats: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-dark border-secondary text-light px-3"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-cinema px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Movie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
