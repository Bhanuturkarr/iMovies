import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import { Users, Search, ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers({ search, role, limit: 100 });
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      toast.error('Failed to load registered users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminService.updateUserStatus(userId, nextStatus);
      if (res.success) {
        toast.success(res.message);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="brand-font fw-bold text-white mb-1">User & Role Management</h2>
          <p className="text-secondary small mb-0">Manage registered users, administrative roles, and account security</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
          <select
            className="form-select cinema-input small py-1"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Cinephile (User)</option>
            <option value="admin">Administrator</option>
          </select>

          <input
            type="text"
            className="form-control cinema-input py-1 px-3 small rounded-pill"
            placeholder="Search Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-cinema rounded-pill px-3 btn-sm">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <Loader message="Loading registered accounts..." />
      ) : (
        <div className="card-cinema p-4">
          <div className="table-responsive">
            <table className="table table-dark table-hover border-secondary small mb-0 align-middle">
              <thead>
                <tr className="text-secondary">
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>City</th>
                  <th>Joined Date</th>
                  <th>Account Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="text-white fw-bold">{u.name}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{u.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <span className="text-secondary">{u.email}</span>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.role === 'admin'
                          ? 'bg-warning bg-opacity-25 text-warning border border-warning border-opacity-30'
                          : 'bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30'
                      }`}>
                        {u.role?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary">{u.city || 'Mumbai'}</span>
                    </td>
                    <td>
                      <span className="text-muted">
                        {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        u.status === 'active'
                          ? 'bg-success bg-opacity-25 text-success'
                          : 'bg-danger bg-opacity-25 text-danger'
                      }`}>
                        {u.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleStatusToggle(u._id, u.status)}
                          className={`btn btn-sm rounded-pill px-3 py-1 ${
                            u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
