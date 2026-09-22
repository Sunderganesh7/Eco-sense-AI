import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  Building2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Researcher');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Password Complexity Checker
  const pwChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?~`\\]/.test(password),
  };

  const isPasswordStrong = Object.values(pwChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password does not meet all security complexity requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        designation,
        organization,
        role,
        password,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        // Automatically redirect to login page with success alert
        navigate('/login', { state: { registeredEmail: email } });
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to register account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Create an Enterprise Account
          </h1>
          <p className="text-sm text-slate-400">
            Join GreenPath AI with role-based access permissions
          </p>
        </div>

        <div className="glass-card p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Sunder Ganesh"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address *
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

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* RBAC Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Requested Role *
                </label>
                <div className="relative">
                  <Shield className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="input-field pl-11 bg-slate-950 text-slate-100"
                  >
                    <option value="Researcher">Researcher (AI Detection & Reports)</option>
                    <option value="Officer">Officer (View Only & Field Reports)</option>
                    <option value="Admin">Admin (Full System & User Control)</option>
                  </select>
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Designation
                </label>
                <div className="relative">
                  <Briefcase className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Lead AI Researcher"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Organization / University
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="GreenPath AI Lab"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password *
                </label>
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password *
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
            </div>

            {/* Live Password Strength Validation Bar */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Password Strength Rules
              </span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
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
                <div className="flex items-center space-x-1.5">
                  {pwChecks.special ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600" />
                  )}
                  <span className={pwChecks.special ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                    Special (!@#$%)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordStrong}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3.5"
            >
              <UserPlus className="w-5 h-5" />
              <span>{isSubmitting ? 'Creating Account...' : 'Register Secure Account'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
