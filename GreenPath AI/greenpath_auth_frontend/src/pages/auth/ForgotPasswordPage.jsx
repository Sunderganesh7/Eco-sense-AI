import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Mail, Send, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devOtp, setDevOtp] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setDevOtp(null);
    setIsSubmitting(true);

    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        // Pass the dev_otp to the verify page for effortless local project demonstration
        navigate('/verify-otp', {
          state: {
            email: email,
            devOtp: res?.data?.dev_otp,
          },
        });
      } else {
        setError(res.message || 'Failed to request OTP code.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to Authentication Engine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Reset Password
          </h1>
          <p className="text-sm text-slate-400">
            We'll send a 6-digit One-Time Password (OTP) to your registered email
          </p>
        </div>

        <div className="glass-card p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ganesh@greenpath.ai"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <Send className="w-5 h-5" />
              <span>{isSubmitting ? 'Sending OTP Code...' : 'Send 6-Digit OTP'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
