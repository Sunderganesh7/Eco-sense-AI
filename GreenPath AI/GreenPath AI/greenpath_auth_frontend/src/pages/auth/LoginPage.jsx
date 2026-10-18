import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login({
        email,
        password,
        remember_me: rememberMe,
      });

      if (res.success) {
        navigate('/profile');
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to Authentication Engine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPw) => {
    setEmail(demoEmail);
    setPassword(demoPw);
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-12 relative">
      {/* Top-Left Navigation Button */}
      <a
        href="http://localhost:8000"
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            e.preventDefault();
            window.location.href = "http://localhost:8000";
          }
        }}
        id="auth-back-btn"
        className="fixed top-6 left-6 inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#065F46] hover:bg-[#059669] border border-[#10B981] text-white text-xs font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 z-50 group cursor-pointer"
        title="Back to Eco Sense AI"
      >
        <span className="text-sm font-bold transition-transform group-hover:-translate-x-1">←</span>
        <span>Back to Eco Sense AI</span>
      </a>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>JWT Secured Authentication</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome to GreenPath AI
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise-grade secure sign in for your Major Project
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
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@greenpath.ai"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/30"
              />
              <label htmlFor="remember_me" className="ml-2 text-sm text-slate-300 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <LogIn className="w-5 h-5" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>

            <button
              type="button"
              id="demo-login-btn"
              onClick={() => fillDemoAccount('admin@greenpath.ai', 'Admin@GreenPath2024')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-[#065F46]/20 hover:bg-[#065F46]/35 border border-[#10B981]/50 text-emerald-400 text-sm font-semibold transition-all hover:-translate-y-0.5 mt-2.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Try Demo Login</span>
            </button>
          </form>

          {/* Quick Demo Credentials Panel for Major Project Demonstration */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Quick Demo Accounts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@greenpath.ai', 'Admin@GreenPath2024')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-emerald-400 font-medium transition-colors text-center"
              >
                Admin Role
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('researcher@greenpath.ai', 'Admin@GreenPath2024')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 font-medium transition-colors text-center"
              >
                Researcher
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('officer@greenpath.ai', 'Admin@GreenPath2024')}
                className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-xs text-amber-400 font-medium transition-colors text-center"
              >
                Officer
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Register new account
          </Link>
        </p>
      </div>
    </div>
  );
};
