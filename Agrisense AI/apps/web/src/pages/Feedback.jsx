import { useState, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { submitFeedback } from '../services/api'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import AzureTranslate from '../components/AzureTranslate'

const FEEDBACK_AREAS = [
  { value: 'crop_recommendation', icon: 'eco', label: 'Crop Recommendation' },
  { value: 'yield_prediction', icon: 'agriculture', label: 'Yield Prediction' },
  { value: 'market_prices', icon: 'trending_up', label: 'Market Prices' },
  { value: 'disease_detection', icon: 'shutter_speed', label: 'Disease Detection' },
  { value: 'pest_alerts', icon: 'pest_control', label: 'Pest Alerts' },
  { value: 'fertilizer', icon: 'science', label: 'Fertilizer & Remedies' },
  { value: 'fields', icon: 'map', label: 'My Fields' },
  { value: 'planner', icon: 'calendar_month', label: 'Rotation Planner' },
  { value: 'community', icon: 'forum', label: 'Community Chat' },
  { value: 'profile', icon: 'person', label: 'Profile & Account' },
  { value: 'general', icon: 'edit_note', label: 'General / Other' },
]

export default function Feedback() {
  const { t, language, speechCode } = useLanguage()
  const { user } = useAuth()
  const [area, setArea] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const textareaRef = useRef(null)

  const { isListening, isProcessing, isSupported, toggleListening, stopListening } = useSpeechRecognition({
    lang: speechCode || 'en-IN',
    onResult: (text) => setMessage(text),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!area) { setError('Please select an area'); return }
    if (!message.trim()) { setError('Please write your feedback'); return }
    if (isListening) stopListening()
    setSending(true); setError(null); setSuccess(false)
    try {
      await submitFeedback({ area, message: message.trim() })
      setSuccess(true); setMessage(''); setArea('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) { setError(err.message || 'Failed to submit feedback') }
    setSending(false)
  }

  const selectedArea = FEEDBACK_AREAS.find(a => a.value === area)

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* ── Forest Green Hero Banner ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#087F5B]/20 bg-[#042F25] text-white p-6 md:p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[#042F25] via-[#063D2E] to-[#087F5B]/80" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#9DEBC1]/20 border border-[#9DEBC1]/30 text-[#9DEBC1] text-[10px] font-bold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[11px]">rate_review</span>
              <AzureTranslate text="Platform Experience" />
            </div>
            <h1 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight text-white">
              <AzureTranslate text="Farmer Suggestions & Feedback" />
            </h1>
            <p className="font-label text-xs md:text-sm text-white/80 mt-1 leading-relaxed">
              <AzureTranslate text="Help us refine crop recommendations, mandi price accuracy, disease detection models, and field planning tools." />
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl">
            <span className="material-symbols-outlined text-[#9DEBC1] text-xl">reviews</span>
            <div className="text-right">
              <div className="font-headline font-bold text-xs text-white">Direct Review</div>
              <div className="font-label text-[10px] text-white/70">SIH Agritech Team</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feedback Form Card ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 bg-[#F7F4EB] border-b border-[#E3ECE6] flex items-center justify-between">
          <h3 className="font-headline font-bold text-sm text-[#17251F] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#087F5B] text-base">edit_note</span>
            <AzureTranslate text="Submit New Feedback" />
          </h3>
          <span className="text-[10px] font-bold text-[#718078] uppercase">Voice + Text Supported</span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {success && (
            <div className="bg-[#E7F0E8] border border-[#087F5B]/30 text-[#063D2E] p-4 rounded-2xl flex items-center gap-2.5 animate-fade-in-up text-xs font-semibold">
              <span className="material-symbols-outlined text-[#087F5B] text-lg">check_circle</span>
              <AzureTranslate text="Thank you! Your feedback has been submitted successfully to the product engineering team." />
            </div>
          )}
          {error && (
            <div className="bg-[#C94040]/10 border border-[#C94040]/20 text-[#C94040] p-4 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
              <span className="material-symbols-outlined text-lg">error</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Area Selection */}
            <div className="space-y-2.5">
              <label className="font-label text-[11px] font-bold uppercase tracking-wider text-[#17251F]">
                <AzureTranslate text="Select Application Feature / Module" /> *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {FEEDBACK_AREAS.map(opt => {
                  const isSelected = area === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setArea(opt.value); setError(null) }}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#087F5B] text-white border-[#087F5B] shadow-sm shadow-[#087F5B]/20'
                          : 'bg-[#F7F9F7] text-[#17251F] border-[#E3ECE6] hover:bg-[#E7F0E8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{opt.icon}</span>
                      <span className="truncate"><AzureTranslate text={opt.label} /></span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-2">
              <label className="font-label text-[11px] font-bold uppercase tracking-wider text-[#17251F]">
                <AzureTranslate text="Detailed Observations & Suggestions" /> *
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Share details about accuracy, UI responsiveness, local crop variety requests, or bug reports..."
                  rows={5}
                  maxLength={2000}
                  className="w-full bg-[#F7F9F7] border border-[#DDE7E1] rounded-2xl p-4 pr-14 text-sm font-medium text-[#17251F] resize-y min-h-[120px] focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] focus:outline-none placeholder:text-[#718078]/50"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={toggleListening}
                  className={`absolute right-3 top-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'bg-[#C94040] text-white animate-pulse'
                      : isProcessing
                      ? 'bg-[#B7791F] text-white'
                      : 'bg-white border border-[#DDE7E1] text-[#063D2E] hover:bg-[#E7F0E8]'
                  } disabled:opacity-50`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isProcessing ? 'hourglass_empty' : isListening ? 'stop' : 'mic'}
                  </span>
                </button>
              </div>

              <div className="flex justify-between items-center text-[10px] text-[#718078]">
                <span>{message.length} / 2000 characters</span>
                {(isListening || isProcessing) && (
                  <span className="flex items-center gap-1 text-[#C94040] font-bold">
                    <span className="w-1.5 h-1.5 bg-[#C94040] rounded-full animate-ping" />
                    {isProcessing ? 'Processing speech...' : 'Recording voice... Speak now'}
                  </span>
                )}
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={sending || !user}
              className="w-full py-3.5 bg-[#087F5B] hover:bg-[#063D2E] text-white font-bold rounded-2xl shadow-md shadow-[#087F5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-sm"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <AzureTranslate text="Submitting Feedback..." />
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  <AzureTranslate text="Submit Feedback" />
                </>
              )}
            </button>
            {!user && (
              <div className="text-center font-label text-xs text-[#718078]">
                <AzureTranslate text="Please log in to submit platform feedback." />
              </div>
            )}
          </form>
        </div>
      </div>


    </div>
  )
}
