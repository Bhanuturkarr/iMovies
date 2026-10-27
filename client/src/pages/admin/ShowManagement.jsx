import React, { useState, useEffect } from 'react';
import { showService } from '../../services/showService';
import { movieService } from '../../services/movieService';
import { theatreService } from '../../services/theatreService';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { Calendar, Plus, Trash2, Clock, AlertTriangle, Check, Film, Building } from 'lucide-react';

export default function ShowManagement() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    movie: '',
    theatre: '',
    screen: '',
    startTime: '',
    endTime: '',
    language: 'Hindi',
    format: '2D',
    pricing: {
      Silver: 180,
      Gold: 240,
      Platinum: 340,
      VIP: 450
    }
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        showService.getShows({ limit: 100 }),
        movieService.getMovies({ limit: 100, status: 'now_showing' }),
        theatreService.getTheatres()
      ]);

      if (showsRes.success) setShows(showsRes.data);
      if (moviesRes.success) {
        setMovies(moviesRes.data);
        if (moviesRes.data.length > 0) {
          setFormData(prev => ({ ...prev, movie: moviesRes.data[0]._id }));
        }
      }
      if (theatresRes.success) {
        setTheatres(theatresRes.data);
        if (theatresRes.data.length > 0) {
          const tId = theatresRes.data[0]._id;
          setFormData(prev => ({ ...prev, theatre: tId }));
          // Fetch screens for first theatre
          const scrRes = await theatreService.getScreens(tId);
          if (scrRes.success) {
            setScreens(scrRes.data);
            if (scrRes.data.length > 0) {
              setFormData(prev => ({ ...prev, screen: scrRes.data[0]._id }));
            }
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load show scheduling data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleTheatreChange = async (theatreId) => {
    setFormData(prev => ({ ...prev, theatre: theatreId, screen: '' }));
    try {
      const scrRes = await theatreService.getScreens(theatreId);
      if (scrRes.success) {
        setScreens(scrRes.data);
        if (scrRes.data.length > 0) {
          setFormData(prev => ({ ...prev, screen: scrRes.data[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() + 3, 0, 0, 0);

    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + 3);

    // Format for datetime-local
    const formatDt = (d) => {
      const pad = (n) => (n < 10 ? '0' + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData(prev => ({
      ...prev,
      startTime: formatDt(defaultStart),
      endTime: formatDt(defaultEnd)
    }));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movie || !formData.theatre || !formData.screen || !formData.startTime || !formData.endTime) {
      toast.error('Please complete all schedule requirements.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        movie: formData.movie,
        theatre: formData.theatre,
        screen: formData.screen,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        language: formData.language,
        format: formData.format,
        pricing: {
          Silver: formData.pricing.Silver * 100, // into paise
          Gold: formData.pricing.Gold * 100,
          Platinum: formData.pricing.Platinum * 100,
          VIP: formData.pricing.VIP * 100
        }
      };

      const res = await showService.createShow(payload);
      if (res.success) {
        toast.success('Showtime scheduled successfully without conflicts!');
        setModalOpen(false);
        // Refresh shows
        const updated = await showService.getShows();
        if (updated.success) setShows(updated.data);
      }
    } catch (err) {
      // Conflict or validation error
      toast.error(err.response?.data?.message || 'Schedule conflict detected. Please select another time.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel or delete this show?')) {
      try {
        const res = await showService.deleteShow(id);
        toast.success(res.message || 'Show deleted.');
        setShows(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete show.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Showtime Scheduling</h2>
          <p className="text-secondary small mb-0">Schedule shows with automatic screen collision detection</p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-cinema rounded-pill px-4 btn-sm d-flex align-items-center gap-1">
          <Plus size={16} /> Schedule Show
        </button>
      </div>

      {loading ? (
        <Loader message="Loading scheduled showtimes..." />
      ) : (
        <div className="card-cinema p-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary small mb-0 align-middle">
              <thead>
                <tr className="text-secondary">
                  <th>Movie</th>
                  <th>Multiplex & Screen</th>
                  <th>Date & Timing</th>
                  <th>Format & Audio</th>
                  <th>Occupancy</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.slice(0, 50).map((s) => {
                  const startTime = new Date(s.startTime);
                  return (
                    <tr key={s._id}>
                      <td>
                        <div className="text-white fw-bold">{s.movie?.title}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{s.movie?.durationMinutes}m</div>
                      </td>
                      <td>
                        <div className="text-secondary">{s.theatre?.name}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{s.screen?.name || 'Screen 1'}</div>
                      </td>
                      <td>
                        <div className="text-info fw-medium">
                          {startTime.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
                        </div>
                        <div className="text-white small">
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 me-1">
                          {s.format}
                        </span>
                        <span className="text-secondary">{s.language}</span>
                      </td>
                      <td>
                        <div className="text-white fw-bold">
                          {s.bookedSeatsCount || 0} / {s.totalSeats || 0}
                        </div>
                        <div className="progress bg-secondary" style={{ height: 4, maxWidth: 80 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{
                              width: `${Math.round(((s.bookedSeatsCount || 0) / (s.totalSeats || 1)) * 100)}%`
                            }}
                          />
                        </div>
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="btn btn-sm btn-dark border-secondary text-danger p-1 rounded-2"
                          title="Delete / Cancel Show"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark border-secondary text-light rounded-4">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">Schedule New Showtime</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Select Movie *</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.movie}
                        onChange={(e) => setFormData(prev => ({ ...prev, movie: e.target.value }))}
                        required
                      >
                        {movies.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.title} ({m.certification})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Select Multiplex *</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.theatre}
                        onChange={(e) => handleTheatreChange(e.target.value)}
                        required
                      >
                        {theatres.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Auditorium / Screen *</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.screen}
                        onChange={(e) => setFormData(prev => ({ ...prev, screen: e.target.value }))}
                        required
                      >
                        {screens.map((scr) => (
                          <option key={scr._id} value={scr._id}>
                            {scr.name} ({scr.totalSeats || 96} seats)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Format</label>
                      <select
                        className="form-select cinema-input"
                        value={formData.format}
                        onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
                      >
                        <option value="2D">2D Digital</option>
                        <option value="3D">RealD 3D</option>
                        <option value="IMAX">IMAX Laser</option>
                        <option value="4DX">4DX Motion</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Language</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Show Start Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control cinema-input"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Show End Time *</label>
                      <input
                        type="datetime-local"
                        className="form-control cinema-input"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label text-secondary small fw-semibold mb-2">Category Pricing (in ₹ Rupees)</label>
                      <div className="row g-2">
                        <div className="col-3">
                          <label className="text-muted small" style={{ fontSize: 11 }}>Silver</label>
                          <input
                            type="number"
                            className="form-control cinema-input"
                            value={formData.pricing.Silver}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, Silver: parseInt(e.target.value, 10) }
                            }))}
                          />
                        </div>
                        <div className="col-3">
                          <label className="text-muted small" style={{ fontSize: 11 }}>Gold</label>
                          <input
                            type="number"
                            className="form-control cinema-input"
                            value={formData.pricing.Gold}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, Gold: parseInt(e.target.value, 10) }
                            }))}
                          />
                        </div>
                        <div className="col-3">
                          <label className="text-muted small" style={{ fontSize: 11 }}>Platinum</label>
                          <input
                            type="number"
                            className="form-control cinema-input"
                            value={formData.pricing.Platinum}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, Platinum: parseInt(e.target.value, 10) }
                            }))}
                          />
                        </div>
                        <div className="col-3">
                          <label className="text-muted small" style={{ fontSize: 11 }}>VIP</label>
                          <input
                            type="number"
                            className="form-control cinema-input"
                            value={formData.pricing.VIP}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              pricing: { ...prev.pricing, VIP: parseInt(e.target.value, 10) }
                            }))}
                          />
                        </div>
                      </div>
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
                    {submitting ? 'Checking Schedule...' : 'Schedule Show'}
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
