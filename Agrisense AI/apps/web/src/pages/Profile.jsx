import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useLocation } from '../contexts/LocationContext'
import { getProfile, saveProfile, deleteProfile } from '../services/api'
import AzureTranslate from '../components/AzureTranslate'

export default function Profile() {
  const { t } = useLanguage()
  const { user, logout, updateUserName } = useAuth()
  const { state: detectedState, latitude, longitude } = useLocation()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    name: '', phone: '', email: '', language: 'en',
    district: '', state: '', role: 'farmer', farm_size: '', crops_grown: '',
  })
  const [notifications, setNotifications] = useState({
    push: true, sms: true, whatsapp: false, weather: true, sowing: true, market: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState({ text: '', type: '' })

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const data = await getProfile()
      if (data.profile) {
        const p = data.profile
        setProfile({
          name: p.name || user?.name || '', phone: p.phone || user?.phone || '',
          email: p.email || user?.email || '', language: p.language || 'en',
          district: p.district || '', state: p.state || detectedState || '',
          role: p.role || 'farmer', farm_size: p.farm_size || '',
          crops_grown: Array.isArray(p.crops_grown) ? p.crops_grown.join(', ') : '',
        })
        if (p.notifications && typeof p.notifications === 'object') setNotifications(prev => ({ ...prev, ...p.notifications }))
      } else {
        setProfile(prev => ({ ...prev, name: user?.name || '', phone: user?.phone || '' }))
      }
    } catch (err) { setProfile(prev => ({ ...prev, name: user?.name || '', phone: user?.phone || '' })) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true); setSaveMsg({ text: '', type: '' })
    try {
      await saveProfile({
        name: profile.name, email: profile.email, district: profile.district,
        state: profile.state, language: profile.language, role: profile.role,
        farm_size: profile.farm_size ? parseFloat(profile.farm_size) : null,
        crops_grown: profile.crops_grown ? profile.crops_grown.split(',').map(c => c.trim()).filter(Boolean) : [],
        notifications, latitude: latitude || null, longitude: longitude || null,
      })
      updateUserName(profile.name)
      setSaveMsg({ text: 'Profile saved successfully!', type: 'success' })
      setTimeout(() => setSaveMsg({ text: '', type: '' }), 3000)
    } catch (err) { setSaveMsg({ text: err.message, type: 'error' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    try { await deleteProfile(); logout(); navigate('/login') }
    catch (err) { setSaveMsg({ text: err.message, type: 'error' }) }
  }

  const inputClass = "w-full bg-[#F7F9F7] border border-[#DDE7E1] rounded-xl px-4 py-3 text-sm font-medium text-[#17251F] focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] focus:outline-none transition-all placeholder:text-[#718078]/50"

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in gap-3">
        <div className="w-8 h-8 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
        <span className="font-label text-sm text-[#718078]">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Forest Green Hero Header ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#087F5B]/20 bg-[#042F25] text-white p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#042F25] via-[#063D2E] to-[#087F5B]/80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#9DEBC1]/20 border border-[#9DEBC1]/30 text-white flex items-center justify-center text-2xl font-black shadow-inner">
              {profile.name ? profile.name[0].toUpperCase() : 'S'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#9DEBC1]/20 text-[#9DEBC1] text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>👑</span> Premium Member
              </div>
              <h1 className="font-headline font-extrabold text-2xl text-white tracking-tight">
                {profile.name || 'Sunderganesh'}
              </h1>
              <p className="font-label text-xs text-white/70 mt-0.5">
                {profile.email || 'admin@capportal.gov.in'} · {profile.phone || '+91 98765 43210'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white capitalize">
              Role: {profile.role}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#9DEBC1] text-[#042F25] text-xs font-black">
              Verified Farmer
            </span>
          </div>
        </div>
      </div>

      {/* Save feedback */}
      {saveMsg.text && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in ${saveMsg.type === 'success'
              ? 'bg-[#E7F0E8] border border-[#087F5B]/30 text-[#063D2E]'
              : 'bg-[#C94040]/10 border border-[#C94040]/20 text-[#C94040]'
            }`}
        >
          <span className="material-symbols-outlined text-sm">
            {saveMsg.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {saveMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Profile Info Form (7 cols) ────────────────────────────────────────────── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 bg-[#F7F4EB] border-b border-[#E3ECE6] flex items-center justify-between">
            <h3 className="font-headline font-bold text-sm text-[#17251F] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#087F5B] text-base">person</span>
              {t('profile_title') || 'Personal & Farm Specifications'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F0E8] text-[#063D2E] border border-[#087F5B]/20 capitalize">
              {profile.role}
            </span>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="space-y-1.5">
              <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                {t('profile_fullName')}
              </label>
              <input
                className={inputClass}
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  {t('profile_phone')}
                </label>
                <input className={`${inputClass} opacity-60 cursor-not-allowed`} value={profile.phone} disabled />
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="Email Address" />
                </label>
                <input
                  className={inputClass}
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  {t('profile_district')}
                </label>
                <input
                  className={inputClass}
                  value={profile.district}
                  onChange={e => setProfile(p => ({ ...p, district: e.target.value }))}
                  placeholder="e.g. Thane"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  {t('profile_state')}
                </label>
                <input
                  className={inputClass}
                  value={profile.state}
                  onChange={e => setProfile(p => ({ ...p, state: e.target.value }))}
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="Farm Size (Hectares)" />
                </label>
                <input
                  className={inputClass}
                  type="number"
                  step="0.1"
                  min="0"
                  value={profile.farm_size}
                  onChange={e => setProfile(p => ({ ...p, farm_size: e.target.value }))}
                  placeholder="e.g. 5.5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="User Role" />
                </label>
                <select
                  className={inputClass}
                  value={profile.role}
                  onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="farmer">Farmer</option>
                  <option value="advisor">Agricultural Advisor</option>
                  <option value="researcher">Researcher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                <AzureTranslate text="Crops Grown / Monitored" />
              </label>
              <input
                className={inputClass}
                value={profile.crops_grown}
                onChange={e => setProfile(p => ({ ...p, crops_grown: e.target.value }))}
                placeholder="e.g. Wheat, Rice, Chickpea, Moong"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                {t('profile_language')}
              </label>
              <select
                className={inputClass}
                value={profile.language}
                onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 bg-[#087F5B] hover:bg-[#063D2E] text-white font-bold rounded-2xl shadow-md shadow-[#087F5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                <span className="material-symbols-outlined text-lg">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Saving Changes...' : (t('profile_save') || 'Save Profile Settings')}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column (5 cols) ────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Notifications Panel */}
          <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 bg-[#F7F4EB] border-b border-[#E3ECE6]">
              <h3 className="font-headline font-bold text-sm text-[#17251F] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F5B] text-base">notifications</span>
                {t('profile_notifications') || 'Alert & Dispatch Channels'}
              </h3>
            </div>
            <div className="p-6 space-y-1">
              <div className="font-label text-[10px] font-bold uppercase text-[#718078] tracking-wider mb-2">
                <AzureTranslate text="Delivery Channels" />
              </div>
              {[
                { key: 'push', icon: 'smartphone', label: 'Push Notifications' },
                { key: 'sms', icon: 'sms', label: 'SMS Alerts' },
                { key: 'whatsapp', icon: 'chat', label: 'WhatsApp Dispatch' },
              ].map(ch => (
                <div key={ch.key} className="flex items-center justify-between py-2.5 border-b border-[#E3ECE6]/60 last:border-0">
                  <span className="font-label text-xs text-[#17251F] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#718078]">{ch.icon}</span> {ch.label}
                  </span>
                  <div
                    onClick={() => setNotifications(n => ({ ...n, [ch.key]: !n[ch.key] }))}
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${notifications[ch.key] ? 'bg-[#087F5B]' : 'bg-[#DDE7E1]'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${notifications[ch.key] ? 'left-[22px]' : 'left-0.5'
                        }`}
                    />
                  </div>
                </div>
              ))}

              <div className="font-label text-[10px] font-bold uppercase text-[#718078] tracking-wider mt-4 mb-2">
                <AzureTranslate text="Monitored Alert Topics" />
              </div>
              {[
                { key: 'weather', icon: 'cloud', label: 'Extreme Weather Warnings' },
                { key: 'sowing', icon: 'eco', label: 'Optimal Sowing Windows' },
                { key: 'market', icon: 'trending_up', label: 'Mandi Price Spikes & Drops' },
              ].map(ch => (
                <div key={ch.key} className="flex items-center justify-between py-2.5 border-b border-[#E3ECE6]/60 last:border-0">
                  <span className="font-label text-xs text-[#17251F] font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#718078]">{ch.icon}</span> {ch.label}
                  </span>
                  <div
                    onClick={() => setNotifications(n => ({ ...n, [ch.key]: !n[ch.key] }))}
                    className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${notifications[ch.key] ? 'bg-[#087F5B]' : 'bg-[#DDE7E1]'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${notifications[ch.key] ? 'left-[22px]' : 'left-0.5'
                        }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Disease Scanner Card */}
          <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-sm text-[#17251F] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F5B] text-base">center_focus_strong</span>
                <AzureTranslate text="AI Disease Scanner" />
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#E7F0E8] text-[#087F5B] text-[10px] font-bold">
                Dual Engine
              </span>
            </div>
            <p className="font-label text-xs text-[#718078] leading-relaxed">
              <AzureTranslate text="Upload high-res leaf photographs for instant pathological diagnosis across Rice, Potato, Corn, and Sugarcane crops." />
            </p>
            <button
              onClick={() => navigate('/disease')}
              className="w-full py-2.5 bg-[#087F5B] hover:bg-[#063D2E] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer shadow-sm shadow-[#087F5B]/20"
            >
              <span className="material-symbols-outlined text-sm">shutter_speed</span>
              <AzureTranslate text="Launch Disease Scanner" />
            </button>
          </div>

          {/* System Info & Delete */}
          <div className="bg-[#F7F4EB] border border-[#E8E4DA] rounded-3xl p-6 space-y-3">
            <h3 className="font-headline font-bold text-xs uppercase text-[#063D2E] tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              {t('profile_about') || 'System & Security Details'}
            </h3>
            <div className="font-label text-xs text-[#718078] space-y-1">
              <p><strong>AgriSense AI</strong> — Smart Agriculture Platform</p>
              <p>Smart India Hackathon 2025 (Problem Statement: SIH25010)</p>
              <p>Parent Platform: Eco Sense AI</p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-[#E8E4DA]">
              <span className="text-[10px] text-[#718078]">Account Safety</span>
              <button
                onClick={handleDelete}
                className="text-xs font-bold text-[#C94040] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <AzureTranslate text="Delete Account" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
