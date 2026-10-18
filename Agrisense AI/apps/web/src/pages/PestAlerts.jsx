import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useLocation } from '../contexts/LocationContext'
import { getPestAlerts, getPestStates } from '../services/api'
import AzureTranslate from '../components/AzureTranslate'

export default function PestAlerts() {
  const { t } = useLanguage()
  const { state: detectedState } = useLocation()
  const [state, setState] = useState(detectedState || '')
  const [season, setSeason] = useState('')
  const [pestData, setPestData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [availableStates, setAvailableStates] = useState([])
  const [expandedCrop, setExpandedCrop] = useState(null)

  useEffect(() => { getPestStates().then(d => setAvailableStates(d.states || [])).catch(() => {}) }, [])
  useEffect(() => { if (detectedState && !state) setState(detectedState) }, [detectedState])
  useEffect(() => { if (state) fetchPestAlerts() }, [state, season])

  async function fetchPestAlerts() {
    setLoading(true)
    try { const data = await getPestAlerts(state, season); setPestData(data) }
    catch (err) { console.error('Pest fetch error:', err) }
    setLoading(false)
  }

  const seasonInfo = pestData?.season_info || {}
  const crops = pestData?.crops || []

  const inputClass = "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto text-[#17251F]">
      {/* ── Feature Hero Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white p-6 sm:p-10 md:p-12 shadow-sm border border-[#0A4D3D] min-h-[250px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/pest-alerts-banner.jpg"
            alt="Crop foliage and plant protection"
            className="w-full h-full object-cover object-center md:object-[center_30%]"
            style={{ opacity: 1 }}
            loading="eager"
          />
          {/* Subtle left-side gradient overlay behind text only, rest of image fully visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042F25]/90 via-[#042F25]/60 35% via-[#042F25]/10 55% to-transparent hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042F25]/95 via-[#042F25]/60 55% to-transparent sm:hidden" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063D2E]/80 border border-[#9DEBC1]/30 text-[10px] font-bold text-[#9DEBC1] uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>pest_control</span>
              <span><AzureTranslate text="Bio-Security & Crop Protection" /></span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              <AzureTranslate text="Seasonal Pest & Infestation Alerts" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-lg">
              <AzureTranslate text="Monitor outbreak risks, symptom indicators, and verified chemical and biological first-response treatments across your crops." />
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#063D2E]/90 border border-white/15 rounded-2xl p-4 shrink-0 shadow-sm backdrop-blur-sm">
            <span className="text-3xl">
              {seasonInfo.icon === 'rain' ? '🌧' : seasonInfo.icon === 'snow' ? '❄' : '☀'}
            </span>
            <div>
              <div className="font-headline font-bold text-sm text-white"><AzureTranslate text={seasonInfo.name || 'Current Season'} /></div>
              <div className="text-[11px] text-[#9DEBC1] font-medium">{seasonInfo.period || 'Agro-climatic period'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{t('pest_selectState') || 'State'}</label>
          <select className={inputClass} value={state} onChange={e => setState(e.target.value)}>
            <option value="">{t('pest_chooseState') || '-- Select State --'}</option>
            {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{t('pest_selectSeason') || 'Season'}</label>
          <select className={inputClass} value={season} onChange={e => setSeason(e.target.value)}>
            <option value="">{t('pest_autoSeason') || 'Auto (Current)'}</option>
            <option value="kharif">🌧 Kharif (Jun-Oct)</option>
            <option value="rabi">❄ Rabi (Nov-Mar)</option>
            <option value="zaid">☀ Zaid (Mar-Jun)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="spinner" /><span className="font-label text-sm text-on-surface-variant"><AzureTranslate text="Loading pest alerts..." /></span>
        </div>
      )}

      {!loading && crops.length === 0 && state && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-tertiary-fixed/30 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-tertiary text-4xl">pest_control</span>
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2">{t('pest_noData') || 'No pest data available'}</h3>
          <p className="text-sm text-on-surface-variant/60">{t('pest_noDataDesc') || 'No pest alerts found for this state and season combination.'}</p>
        </div>
      )}

      {!loading && crops.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <span className="smart-chip bg-error/10 text-error">{crops.length} {t('pest_cropsAt') || 'crops at risk'}</span>
            <span className="font-label text-sm text-on-surface-variant/60">{state} · {seasonInfo.name}</span>
          </div>
          <div className="space-y-3 stagger-children">
            {crops.map((crop, idx) => (
              <div key={idx}
                className="bg-white rounded-2xl editorial-shadow overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all"
                onClick={() => setExpandedCrop(expandedCrop === idx ? null : idx)}>
                <div className="p-4 md:p-5 bg-surface-container-low/50 flex justify-between items-center">
                  <div>
                    <div className="font-headline font-bold text-on-surface"><AzureTranslate text={crop.common_name || crop.crop} /></div>
                    {crop.note && <div className="font-label text-xs text-on-surface-variant/60 mt-0.5"><AzureTranslate text={crop.note} /></div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="smart-chip bg-error/10 text-error">{crop.pest_count} {t('pest_pests') || 'pests'}</span>
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-sm transition-transform" style={{ transform: expandedCrop === idx ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                  </div>
                </div>

                {(expandedCrop === idx || crop.top_pests.length <= 3) && (
                  <div className="p-4 md:px-5 md:pb-5 space-y-3">
                    {crop.top_pests.map((pest, pidx) => (
                      <div key={pidx} className="pb-3 last:pb-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pidx === 0 ? '#ba1a1a' : pidx === 1 ? '#a36a00' : '#825400' }} />
                          <span className="font-headline font-bold text-sm text-on-surface"><AzureTranslate text={pest.pest} /></span>
                        </div>
                        <div className="font-label text-xs text-on-surface-variant/60 leading-relaxed">
                          <span className="font-semibold text-on-surface"><AzureTranslate text="Symptoms" />:</span> <AzureTranslate text={pest.symptoms} />
                        </div>
                        <div className="font-label text-xs text-on-surface-variant/60 leading-relaxed mt-1">
                          <span className="font-semibold text-primary"><AzureTranslate text="Action" />:</span> <AzureTranslate text={pest.first_response} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {crop.top_pests.length > 3 && expandedCrop !== idx && (
                  <div className="px-5 pb-3 font-label text-xs text-primary font-bold">{t('pest_clickExpand') || 'Click to see all pests →'}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
