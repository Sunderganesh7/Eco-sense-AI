import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { healthCheck } from '../services/api'
import LanguageSwitcher from '../components/LanguageSwitcher'
import AzureTranslate from '../components/AzureTranslate'
export default function Login() {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    connected: false,
    status: null,
    version: null,
    message: 'Checking backend status...',
  })

  useEffect(() => {
    let active = true
    healthCheck()
      .then(res => {
        if (!active) return
        if (res && (res.status === 'healthy' || res.status === 'degraded' || res.services?.api === 'running')) {
          setBackendStatus({
            checking: false,
            connected: true,
            status: res.status,
            database: res.database_connected,
            version: res.version,
            message: res.status === 'healthy' ? 'Backend Connected' : 'Backend Connected (ML Active)',
          })
        } else {
          setBackendStatus({
            checking: false,
            connected: false,
            status: 'offline',
            message: 'Backend Unreachable',
          })
        }
      })
      .catch(() => {
        if (!active) return
        setBackendStatus({
          checking: false,
          connected: false,
          status: 'offline',
          message: 'Cannot connect to backend service',
        })
      })
    return () => { active = false }
  }, [])

  const handleQuickDemo = (e) => {
    e.preventDefault()
    setForm(prev => ({
      ...prev,
      email: 'admin@capportal.gov.in',
      password: 'admin123',
    }))
    if (error) setError('')
  }

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const email = form.email.trim()
    if (!email) {
      setError('Please enter your email address')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g. name@example.com)')
      return
    }
    if (!form.password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        if (!form.name.trim()) { setError('Please enter your name'); setLoading(false); return }
        await register(email, form.password, form.name.trim())
      } else {
        await login(email, form.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left: Hero Image Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Agricultural hero image */}
        <img
          src="/hero-landscape.jpg"
          alt="Golden agricultural field"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary-container/80" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-white text-xl tracking-tight">AgriSense AI</h1>
              <p className="font-label text-[10px] text-white/60 uppercase tracking-[0.15em]"><AzureTranslate text="Smart Agriculture. Intelligent Decisions." /></p>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6 max-w-md">
            <h2 className="font-headline font-extrabold text-5xl text-white leading-tight tracking-tight">
              <AzureTranslate text="Cultivating" /><br />
              <span className="text-primary-fixed"><AzureTranslate text="Intelligence" /></span><br />
              <AzureTranslate text="for Every Acre" />
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              <AzureTranslate text="AI-powered crop advisory, yield prediction, and market intelligence — designed for the modern Indian farmer." />
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { icon: 'query_stats', title: 'Yield Prediction', desc: 'ML-powered forecasting' },
              { icon: 'psychology', title: 'AI Advisory', desc: 'Smart crop recommendations' },
              { icon: 'trending_up', title: 'Market Prices', desc: 'Real-time mandi data' },
              { icon: 'shutter_speed', title: 'Disease Detection', desc: 'Image-based diagnosis' },
            ].map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/15 transition-colors">
                <span className="material-symbols-outlined text-white/80 text-xl mb-2 block">{f.icon}</span>
                <h3 className="font-headline font-bold text-white text-sm">{f.title}</h3>
                <p className="font-label text-[11px] text-white/50 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center p-6 md:p-12 bg-white relative">
        <div className="absolute top-4 right-4 z-10 hidden sm:block">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-primary text-xl tracking-tight">AgriSense AI</h1>
              <p className="font-label text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em]"><AzureTranslate text="Smart Agriculture. Intelligent Decisions." /></p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
              {isRegister ? <><AzureTranslate text="Create Account" /> 👋</> : <><AzureTranslate text="Welcome Back" /> 👋</>}
            </h2>
            <p className="text-sm text-on-surface-variant/60 mt-2 leading-relaxed">
              {isRegister
                ? <AzureTranslate text="Join AgriSense AI to access AI-powered crop advisory" />
                : <AzureTranslate text="Login to your farm intelligence dashboard" />}
            </p>
          </div>

          {/* Real Backend Connection Status Indicator */}
          <div
            id="backend-connection-status"
            className="mb-5 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-surface-container-highest/60 border border-outline-variant/20 text-xs transition-all"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  backendStatus.checking
                    ? 'bg-amber-400 animate-pulse'
                    : backendStatus.connected
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-on-surface">
                {backendStatus.checking ? 'Checking backend connection...' : backendStatus.message}
              </span>
            </div>
            {backendStatus.connected && (
              <span className="text-[11px] text-on-surface-variant/60 font-mono">
                {backendStatus.version ? `v${backendStatus.version}` : 'v3.0.0'}
              </span>
            )}
          </div>

          {error && (
            <div className="bg-error-container/30 text-on-error-container p-3.5 rounded-2xl text-sm mb-5 flex items-center gap-2.5 animate-fade-in">
              <span className="material-symbols-outlined text-error text-lg">error</span>
              <span className="text-[13px]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Full Name" /></label>
                <input
                  id="name-input"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                  className="w-full py-3.5 px-4 rounded-2xl bg-surface-container-highest text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/30 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider">
                <AzureTranslate text="EMAIL ADDRESS" />
              </label>
              <input
                id="email-input"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={e => {
                  setForm(f => ({ ...f, email: e.target.value }))
                  if (error) setError('')
                }}
                autoComplete="email"
                required
                className="w-full py-3.5 px-4 rounded-2xl bg-surface-container-highest text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label text-xs font-bold text-on-surface-variant/60 uppercase tracking-wider"><AzureTranslate text="Password" /></label>
              <input
                id="password-input"
                name="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                className="w-full py-3.5 px-4 rounded-2xl bg-surface-container-highest text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/30 transition-all"
              />
            </div>

            <button
              id="submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary-container hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="spinner-sm !border-white/30 !border-t-white" />
                  <AzureTranslate text="Please wait..." />
                </>
              ) : isRegister ? (
                <>
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  <AzureTranslate text="Create Account" />
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <AzureTranslate text="Login to Dashboard" />
                </>
              )}
            </button>

            {/* Quick Demo Autofill */}
            {!isRegister && (
              <button
                id="quick-demo-btn"
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-3 rounded-2xl bg-[#E7F0E8] hover:bg-[#D8E6DA] text-[#042F25] font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-[#CDE0D1] cursor-pointer"
                title="Autofill verified demo account credentials"
              >
                <span className="material-symbols-outlined text-sm text-[#087F5B]">bolt</span>
                <span><AzureTranslate text="Quick Demo Access" /></span>
              </button>
            )}
          </form>

          <div className="mt-8 text-center">
            <span className="text-sm text-on-surface-variant/40">
              {isRegister ? <AzureTranslate text="Already have an account? " /> : <AzureTranslate text="Don't have an account? " />}
            </span>
            <button
              id="toggle-auth-mode"
              className="text-primary font-bold text-sm hover:underline"
              onClick={() => { setIsRegister(!isRegister); setError('') }}
            >
              {isRegister ? <AzureTranslate text="Login" /> : <AzureTranslate text="Register" />}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 flex items-center justify-center gap-6">
            {[
              { icon: 'lock', label: 'Secured' },
              { icon: 'sync', label: 'Sync Ready' },
              { icon: 'verified_user', label: 'GDPR' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 text-on-surface-variant/30">
                <span className="material-symbols-outlined text-sm">{b.icon}</span>
                <span className="font-label text-[10px] font-bold uppercase tracking-wider">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
