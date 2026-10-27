import React, { useState, useEffect } from 'react';
import { theatreService } from '../../services/theatreService';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { Building, Plus, Edit, Trash2, MapPin, Tv, Check } from 'lucide-react';

export default function TheatreManagement() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theatreModalOpen, setTheatreModalOpen] = useState(false);
  const [editingTheatre, setEditingTheatre] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    facilities: 'Dolby Atmos, 4DX, IMAX with Laser, Valet Parking, Gourmet Recliner'
  });

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const res = await theatreService.getTheatres({ status: 'all' });
      if (res.success) {
        setTheatres(res.data);
      }
    } catch (err) {
      toast.error('Failed to load theatres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  const handleOpenAdd = () => {
    setEditingTheatre(null);
    setFormData({
      name: '',
      address: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      facilities: 'Dolby Atmos, 4DX, IMAX with Laser, Valet Parking, Gourmet Recliner'
    });
    setTheatreModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTheatre(t);
    setFormData({
      name: t.name,
      address: t.address,
      city: t.city,
      state: t.state || '',
      pincode: t.pincode || '',
      facilities: t.facilities?.join(', ') || ''
    });
    setTheatreModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        facilities: formData.facilities.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingTheatre) {
        await theatreService.updateTheatre(editingTheatre._id, payload);
        toast.success('Theatre updated successfully!');
      } else {
        await theatreService.createTheatre(payload);
        toast.success('Theatre added successfully!');
      }

      setTheatreModalOpen(false);
      fetchTheatres();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save theatre.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to deactivate or remove "${name}"?`)) {
      try {
        const res = await theatreService.deleteTheatre(id);
        toast.success(res.message || 'Theatre deleted.');
        fetchTheatres();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete theatre.');
      }
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">Cinemas & Screen Management</h2>
          <p className="text-secondary small mb-0">Configure multiplexes, auditoriums, sound systems and facilities</p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-cinema rounded-pill px-4 btn-sm d-flex align-items-center gap-1">
          <Plus size={16} /> Add Multiplex
        </button>
      </div>

      {loading ? (
        <Loader message="Loading multiplexes..." />
      ) : (
        <div className="row g-4">
          {theatres.map((t) => (
            <div key={t._id} className="col-12 col-lg-6">
              <div className="card-cinema p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h5 className="text-white fw-bold mb-0">{t.name}</h5>
                    <span className={`badge ${
                      t.status === 'active'
                        ? 'bg-success bg-opacity-25 text-success border border-success border-opacity-30'
                        : 'bg-secondary'
                    }`}>
                      {t.status?.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-secondary small mb-3 d-flex align-items-center gap-1">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span>{t.address}, {t.city} ({t.pincode})</span>
                  </p>

                  <div className="mb-3">
                    <div className="text-white small fw-bold mb-1">Facilities:</div>
                    <div className="d-flex flex-wrap gap-1">
                      {t.facilities?.map((f) => (
                        <span key={f} className="cinema-badge small" style={{ fontSize: 10 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-top border-dark d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-1 text-muted small">
                    <Tv size={14} /> Multiple Audis Configured
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="btn btn-sm btn-dark border-secondary text-primary p-2 rounded-2"
                      title="Edit Multiplex"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id, t.name)}
                      className="btn btn-sm btn-dark border-secondary text-danger p-2 rounded-2"
                      title="Deactivate/Delete Multiplex"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Theatre Modal */}
      {theatreModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-light rounded-4">
              <div className="modal-header border-secondary">
                <h5 className="modal-title fw-bold">
                  {editingTheatre ? 'Edit Multiplex' : 'Add New Multiplex'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setTheatreModalOpen(false)}
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">Multiplex Name *</label>
                    <input
                      type="text"
                      className="form-control cinema-input"
                      placeholder="e.g. PVR ICON: Phoenix Palladium"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">Street Address *</label>
                    <input
                      type="text"
                      className="form-control cinema-input"
                      placeholder="e.g. 462, Senapati Bapat Marg, Lower Parel"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold">City *</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold">Pincode</label>
                      <input
                        type="text"
                        className="form-control cinema-input"
                        placeholder="400013"
                        value={formData.pincode}
                        onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">Facilities (comma separated)</label>
                    <input
                      type="text"
                      className="form-control cinema-input"
                      value={formData.facilities}
                      onChange={(e) => setFormData(prev => ({ ...prev, facilities: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-dark border-secondary text-light px-3"
                    onClick={() => setTheatreModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-cinema px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : 'Save Multiplex'}
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
