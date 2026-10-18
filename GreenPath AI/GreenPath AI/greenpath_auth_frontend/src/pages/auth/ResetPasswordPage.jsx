import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';

export const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const verifiedOtp = location.state?.verifiedOtp || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Password Complexity Checker
  const pwChecks = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?~`\\]/.test(newPassword),
  };

  const isPasswordStrong = Object.values(pwChecks).every(Boolean);

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password does not meet complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.resetPassword({
        email,
        otp_code: verifiedOtp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Password has been reset successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Password reset failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Create New Password
          </h1>
          <p className="text-sm text-slate-400">
            For account <span className="text-emerald-400 font-medium">{email || 'your email'}</span>
          </p>
        </div>

        <div className="glass-card p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/90 border border-emerald-700/80 flex items-start space-x-3 text-emerald-300 text-sm">
              <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-11"
                />
              </div>
            </div>

            {/* Live Password Complexity Bar */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Password Strength Rules
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  {pwChecks.length ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={pwChecks.length ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    8+ Characters
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {pwChecks.upper ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={pwChecks.upper ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    Uppercase (A-Z)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {pwChecks.lower ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={pwChecks.lower ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    Lowercase (a-z)
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {pwChecks.digit ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={pwChecks.digit ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    Digit (0-9)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordStrong}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isSubmitting ? 'Resetting Password...' : 'Reset & Revoke Old Sessions'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
