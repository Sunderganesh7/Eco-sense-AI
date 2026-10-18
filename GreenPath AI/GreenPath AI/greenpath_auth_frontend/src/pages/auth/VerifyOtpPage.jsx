import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { KeyRound, ShieldCheck, AlertCircle, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const devOtp = location.state?.devOtp || null;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes (300 seconds) TTL

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.verifyOtp(email, otp);
      if (res.success) {
        navigate('/reset-password', {
          state: {
            email: email,
            verifiedOtp: otp,
          },
        });
      } else {
        setError(res.message || 'OTP verification failed.');
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setTimer(300);
        if (res?.data?.dev_otp) {
          // Auto fill new dev OTP if testing locally
          setOtp(res.data.dev_otp);
        }
      }
    } catch (err) {
      setError('Could not resend OTP code.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <KeyRound className="w-4 h-4" />
            <span>2-Step Verification</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Enter 6-Digit Code
          </h1>
          <p className="text-sm text-slate-400">
            Sent to <span className="text-emerald-400 font-medium">{email || 'your email'}</span>
          </p>
        </div>

        <div className="glass-card p-8 shadow-2xl">
          {/* Debug/Demo helper banner for instant Major Project testing */}
          {devOtp && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-between text-emerald-300 text-xs">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Dev OTP Code (Auto-received):</span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-mono font-bold tracking-widest text-sm transition-colors"
              >
                {devOtp}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="input-field text-center text-2xl tracking-[0.5em] font-mono font-bold py-3"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Code expires in:{' '}
                <span className={`font-mono font-semibold ${timer < 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatTime(timer)}
                </span>
              </span>
              <button
                type="button"
                onClick={handleResend}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isSubmitting ? 'Verifying OTP...' : 'Verify OTP Code'}</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-400 hover:text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Change email address</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
