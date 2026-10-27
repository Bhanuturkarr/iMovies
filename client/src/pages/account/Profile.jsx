import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Lock, ShieldCheck, Check } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || 'Mumbai'
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingProfile(true);
      await updateProfile(profileData);
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      setUpdatingPassword(true);
      await authService.updatePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4 justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="mb-4">
            <h2 className="brand-font fw-bold text-white mb-1">Account Settings</h2>
            <p className="text-secondary small mb-0">Manage your profile, preferred city and security credentials</p>
          </div>

          {/* Profile Details Card */}
          <div className="card-cinema p-4 mb-4">
            <h5 className="text-white fw-bold mb-3 border-bottom border-dark pb-2 d-flex align-items-center gap-2">
              <User size={18} className="text-primary" />
              Personal Information
            </h5>

            <form onSubmit={handleProfileSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-control cinema-input text-muted"
                  value={user?.email || ''}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control cinema-input"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="row g-2 mb-4">
                <div className="col-7">
                  <label className="form-label text-secondary small fw-semibold">Phone Number</label>
                  <input
                    type="text"
                    className="form-control cinema-input"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="col-5">
                  <label className="form-label text-secondary small fw-semibold">Preferred City</label>
                  <input
                    type="text"
                    className="form-control cinema-input"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-cinema px-4 py-2 rounded-pill small fw-bold"
                disabled={updatingProfile}
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card-cinema p-4">
            <h5 className="text-white fw-bold mb-3 border-bottom border-dark pb-2 d-flex align-items-center gap-2">
              <Lock size={18} className="text-warning" />
              Update Security Password
            </h5>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Current Password</label>
                <input
                  type="password"
                  className="form-control cinema-input"
                  placeholder="Enter your current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  className="form-control cinema-input"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-semibold">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control cinema-input"
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-outline-warning px-4 py-2 rounded-pill small fw-bold"
                disabled={updatingPassword}
              >
                {updatingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
