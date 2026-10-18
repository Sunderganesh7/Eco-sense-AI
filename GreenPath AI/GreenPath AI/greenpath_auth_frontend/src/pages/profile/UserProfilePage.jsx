import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Shield,
  Camera,
  Lock,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const UserProfilePage = () => {
  const { user, updateUserData } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  // Edit Profile States
  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phone_number || '');
  const [designation, setDesignation] = useState(user?.profile?.designation || '');
  const [organization, setOrganization] = useState(user?.profile?.organization || '');

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Feedback
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'researcher':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'officer':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await api.updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        designation,
        organization,
      });

      if (res.success && res.data?.user) {
        updateUserData(res.data.user);
        setSuccess('Profile updated successfully!');
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.uploadProfileImage(formData);
      if (res.success && res.data?.user) {
        updateUserData(res.data.user);
        setSuccess('Profile photo uploaded and refreshed automatically!');
      } else {
        setError(res.message || 'Photo upload failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        setSuccess('Password changed successfully! All older sessions have been revoked for your security.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message || 'Could not change password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Quick Info */}
        <div className="space-y-6">
          <div className="glass-card p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-emerald-900/60 to-teal-900/40 -z-10" />

            {/* Avatar Photo Upload Overlay */}
            <div className="relative w-28 h-28 mx-auto mb-4 mt-4">
              {user?.profile?.profile_photo_url ? (
                <img
                  src={user.profile.profile_photo_url}
                  alt="Profile Avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-slate-900 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-950 flex items-center justify-center border-4 border-slate-900 shadow-xl text-3xl font-bold text-emerald-400">
                  {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </div>
              )}

              <label
                htmlFor="profile-photo-input"
                className="absolute bottom-1 right-1 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg transition-transform hover:scale-110"
                title="Upload Profile Photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>

            <h2 className="text-xl font-bold text-white">
              {user?.profile?.full_name || 'Anonymous User'}
            </h2>
            <p className="text-sm text-slate-400 mb-3">{user?.email}</p>

            <div className="flex items-center justify-center space-x-2 mb-6">
              {(user?.roles || []).map((role) => (
                <span
                  key={role}
                  className={`text-xs px-3 py-1 rounded-full border font-bold uppercase tracking-wider ${getRoleBadgeColor(
                    role
                  )}`}
                >
                  {role}
                </span>
              ))}
            </div>

            <div className="border-t border-slate-800/80 pt-4 text-left space-y-3 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Account Created</span>
                </span>
                <span className="text-slate-200 font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Last Login</span>
                </span>
                <span className="text-slate-200 font-medium">
                  {user?.profile?.last_login_at
                    ? new Date(user.profile.last_login_at).toLocaleString()
                    : 'Just now'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Change Password Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            {/* Tabs */}
            <div className="flex space-x-4 border-b border-slate-800/80 pb-4 mb-6">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setError(null);
                  setSuccess(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'profile'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => {
                  setActiveTab('password');
                  setError(null);
                  setSuccess(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'password'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Change Password & Security
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-start space-x-3 text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/90 border border-emerald-700/80 flex items-start space-x-3 text-emerald-300 text-sm">
                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {activeTab === 'profile' ? (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Saving Profile...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Updating Password...' : 'Update Password & Revoke Old Sessions'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
