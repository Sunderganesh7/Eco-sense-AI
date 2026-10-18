import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { getCommunityMessages, sendCommunityMessage, getOnlineCount } from '../services/api'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import AzureTranslate from '../components/AzureTranslate'

function hashColor(str) {
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 45%, 45%)`
}

export default function Community() {
  const { t, speechCode } = useLanguage()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [onlineCount, setOnlineCount] = useState(1)
  const messagesEndRef = useRef(null)
  const pollRef = useRef(null)

  const { isListening, isProcessing, isSupported, toggleListening, stopListening } = useSpeechRecognition({
    lang: speechCode || 'en-IN',
    onResult: (text) => setInput(text),
  })

  const loadMessages = useCallback(async () => {
    try { const data = await getCommunityMessages(50); setMessages(data.messages || []) }
    catch (err) { console.error('Failed to load messages:', err) }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMessages()
    pollRef.current = setInterval(loadMessages, 5000)
    getOnlineCount().then(d => setOnlineCount(d.online_count || 1)).catch(() => {})
    return () => clearInterval(pollRef.current)
  }, [loadMessages])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const msg = input.trim()
    if (!msg || sending) return
    if (isListening) stopListening()
    setSending(true); setInput('')
    try { await sendCommunityMessage(msg); await loadMessages() }
    catch (err) { console.error('Send failed:', err); setInput(msg) }
    setSending(false)
  }

  function groupByDate(msgs) {
    const groups = {}
    msgs.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const grouped = groupByDate(messages)

  return (
    <div className="flex flex-col max-w-4xl mx-auto animate-fade-in" style={{ height: 'calc(100vh - 130px)' }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="pb-3 flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7F0E8] text-[#087F5B] text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[11px]">forum</span>
            <AzureTranslate text="Farmer Network" />
          </div>
          <h1 className="font-headline font-extrabold text-2xl text-[#17251F] tracking-tight">
            <AzureTranslate text="Community Discussions" />
          </h1>
          <p className="font-label text-xs text-[#718078] mt-0.5">
            <AzureTranslate text="Exchange local agronomic practices, crop price alerts, and pest remedies." />
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E3ECE6] shadow-sm">
          <span className="w-2 h-2 bg-[#087F5B] rounded-full animate-ping" />
          <span className="text-xs font-bold text-[#17251F]">
            {onlineCount} {t('community_online') || 'Active Farmers'}
          </span>
        </div>
      </div>

      {/* ── Messages Window ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-white border border-[#E3ECE6] rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
        {loading && (
          <div className="text-center py-12 font-label text-xs text-[#718078] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
            <span>{t('community_loading') || 'Loading community feed...'}</span>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#E7F0E8] text-[#087F5B] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl">chat</span>
            </div>
            <h3 className="font-headline font-bold text-base text-[#17251F]">{t('community_empty') || 'No messages yet'}</h3>
            <p className="font-label text-xs text-[#718078]">{t('community_emptyDesc') || 'Start the conversation with neighboring farmers!'}</p>
          </div>
        )}
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#E3ECE6]" />
              <span className="font-label text-[10px] font-bold text-[#718078] uppercase px-2 py-0.5 rounded-full bg-[#F7F4EB] border border-[#E8E4DA]">
                {date}
              </span>
              <div className="flex-1 h-px bg-[#E3ECE6]" />
            </div>
            {msgs.map(msg => {
              const isMe = user && msg.user_id === user.id
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 mb-3 max-w-[85%] md:max-w-[70%] animate-fade-in ${
                    isMe ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {!isMe && (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                      style={{ background: hashColor(msg.user_name) }}
                    >
                      {(msg.user_name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div
                    className={`px-4 py-3 max-w-full break-words shadow-sm ${
                      isMe
                        ? 'bg-[#063D2E] text-white rounded-2xl rounded-tr-sm border border-[#042F25]'
                        : 'bg-[#F7F9F7] text-[#17251F] rounded-2xl rounded-tl-sm border border-[#E3ECE6]'
                    }`}
                  >
                    {!isMe && (
                      <div className="text-[11px] font-bold mb-1" style={{ color: hashColor(msg.user_name) }}>
                        {msg.user_name}
                      </div>
                    )}
                    <div className="text-sm leading-relaxed">{msg.message}</div>
                    <div className={`text-[10px] text-right mt-1.5 ${isMe ? 'text-white/60' : 'text-[#718078]'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ────────────────────────────────────────────── */}
      <div className="pt-3">
        <form onSubmit={handleSend} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-[#E3ECE6] shadow-sm">
          <button
            type="button"
            disabled={!user || isProcessing}
            onClick={toggleListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              isListening
                ? 'bg-[#C94040] text-white shadow-md animate-pulse'
                : isProcessing
                ? 'bg-[#B7791F] text-white'
                : 'bg-[#F7F4EB] text-[#063D2E] hover:bg-[#E7F0E8]'
            } disabled:opacity-40 cursor-pointer`}
          >
            <span className="material-symbols-outlined text-xl">
              {isProcessing ? 'hourglass_empty' : isListening ? 'stop' : 'mic'}
            </span>
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={2000}
            disabled={!user}
            placeholder={isProcessing ? 'Processing voice...' : (t('community_placeholder') || 'Ask a farming question or share advice...')}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-[#17251F] placeholder:text-[#718078]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || !user}
            className="w-11 h-11 rounded-xl bg-[#087F5B] hover:bg-[#063D2E] text-white flex items-center justify-center transition-all disabled:opacity-40 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">
              {sending ? 'hourglass_empty' : 'send'}
            </span>
          </button>
        </form>
        {(isListening || isProcessing) && (
          <div className="flex items-center justify-center gap-2 py-1.5 font-label text-xs text-[#C94040] font-bold">
            <span className="w-2 h-2 bg-[#C94040] rounded-full animate-ping" />
            {isProcessing ? <AzureTranslate text="Processing speech..." /> : <AzureTranslate text="Recording... Speak now" />}
          </div>
        )}
        {!user && (
          <div className="text-center py-2 font-label text-xs text-[#718078]">
            {t('community_loginRequired') || 'Please log in to participate in community discussions.'}
          </div>
        )}
      </div>
    </div>
  )
}
