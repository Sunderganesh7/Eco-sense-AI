import { useState, useEffect } from 'react'
import { getMarketPrices, predictPrice, getMarketMetadata } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from '../contexts/LanguageContext'
import { useLocation } from '../contexts/LocationContext'
import AzureTranslate from '../components/AzureTranslate'

export default function Market() {
  const { t } = useLanguage()
  const { state: detectedState, city: detectedCity } = useLocation()
  const [commodity, setCommodity] = useState('Wheat')
  const [state, setState] = useState(detectedState || '')
  const [days, setDays] = useState(90)
  const [priceData, setPriceData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState(null)

  const [predForm, setPredForm] = useState({
    state: detectedState || 'Uttar Pradesh',
    district: detectedCity || '',
    market: detectedCity || '',
    commodity: 'Wheat', variety: 'Other', grade: 'FAQ',
    min_price: 2200, max_price: 2500, month: new Date().getMonth() + 1, year: 2026
  })
  const [prediction, setPrediction] = useState(null)
  const [predLoading, setPredLoading] = useState(false)

  useEffect(() => { getMarketMetadata().then(d => setMetadata(d)).catch(() => {}) }, [])
  useEffect(() => { if (detectedState && !state) setState(detectedState) }, [detectedState])
  useEffect(() => {
    if (detectedCity) setPredForm(f => ({ ...f, district: f.district || detectedCity, market: f.market || detectedCity }))
    if (detectedState) setPredForm(f => ({ ...f, state: f.state || detectedState }))
  }, [detectedCity, detectedState])

  const commodities = metadata?.commodities || ['Wheat', 'Rice', 'Maize', 'Cotton', 'Onion', 'Potato', 'Tomato', 'Sugarcane']
  const availableStates = metadata?.states ? Object.keys(metadata.states).sort() : []

  const fetchPrices = async () => {
    setLoading(true)
    try { const data = await getMarketPrices(commodity, state, '', '', days); setPriceData(data) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchPrices() }, [commodity, state, days])

  const handlePredict = async (e) => {
    e.preventDefault(); setPredLoading(true)
    try { const data = await predictPrice(predForm); setPrediction(data) }
    catch (err) { console.error(err) }
    finally { setPredLoading(false) }
  }

  const chartData = (priceData?.prices || []).map((p, i) => ({
    date: p.date ? p.date.slice(5) : `#${i + 1}`,
    price: p.price_per_quintal || 0,
  })).filter(d => d.price > 0)

  const inputClass = "w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-[#17251F]">
      {/* ── Feature Hero Banner with Generated Asset ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white p-6 sm:p-10 md:p-12 shadow-sm border border-[#0A4D3D] min-h-[250px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/market-produce.jpg"
            alt="Agricultural Mandi Produce and Grains"
            className="w-full h-full object-cover object-center md:object-[center_35%]"
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
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <span><AzureTranslate text="Mandi Intelligence & Rates" /></span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              <AzureTranslate text="Agricultural Commodity Market Intelligence" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-lg">
              <AzureTranslate text="Track historical Agmarknet mandi auction prices, trend shifts, and run multi-regression price forecasts for your upcoming harvest." />
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {priceData?.source === 'agmarknet' && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#087F5B] text-white text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span><AzureTranslate text="Live Mandi Feed" /></span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Price Chart ── */}
      <div className="bg-white rounded-2xl border border-[#E3ECE6] shadow-xs overflow-hidden">
        <div className="p-5 md:p-6 bg-[#FAFBF9] border-b border-[#F0F5F2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-headline font-bold text-[#17251F] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#087F5B]">show_chart</span>
            {t('market_priceTrends')}
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select className={inputClass + " !w-auto !py-2 bg-white border border-[#E3ECE6]"} value={commodity} onChange={e => setCommodity(e.target.value)}>
              {commodities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={inputClass + " !w-auto !py-2 bg-white border border-[#E3ECE6]"} value={state} onChange={e => setState(e.target.value)}>
              <option value="">All States</option>
              {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={inputClass + " !w-auto !py-2 bg-white border border-[#E3ECE6]"} value={days} onChange={e => setDays(+e.target.value)}>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>
        <div className="p-5 md:p-6">
          {/* Stats banner */}
          {priceData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
              {[
                { label: t('market_latestPrice'), value: `₹${priceData.latest_price?.toLocaleString() || '—'}`, big: true },
                { label: t('market_trend'), value: priceData.trend, isTrend: true },
                { label: t('market_crop'), value: priceData.commodity || priceData.crop },
                { label: 'Data Points', value: priceData.data_points || chartData.length },
                { label: 'State', value: priceData.state || 'All' },
              ].map((s, i) => (
                <div key={i} className={`${i === 0 ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className="font-label text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">{s.label}</div>
                  {s.big ? (
                    <div className="font-headline font-extrabold text-2xl text-on-surface">{s.value}</div>
                  ) : s.isTrend ? (
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-label text-xs font-bold mt-1 ${
                      s.value === 'up' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                    }`}>{s.value === 'up' ? '↑' : '↓'} {s.value}</span>
                  ) : (
                    <div className="font-headline font-bold text-sm text-on-surface capitalize">{s.value}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="spinner" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006b47" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#006b47" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9e8" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                <YAxis tick={{ fontSize: 11, fontFamily: 'Inter' }} tickFormatter={v => `₹${v}`} />
                <Tooltip
                  formatter={v => [`₹${v.toFixed(0)}`, 'Price/Quintal']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontFamily: 'Inter' }}
                />
                <Area type="monotone" dataKey="price" stroke="#006b47" strokeWidth={2.5} fill="url(#priceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Price Prediction ── */}
      <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
        <div className="p-5 md:p-6 bg-surface-container-low flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">query_stats</span>
            {t('market_pricePrediction')}
          </h3>
          <div className="flex gap-2">
            <span className="smart-chip bg-secondary-container text-on-secondary-container"><AzureTranslate text="XGBoost Model" /></span>
            {detectedCity && (
              <span className="smart-chip bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-xs">location_on</span> {detectedCity}
              </span>
            )}
          </div>
        </div>
        <div className="p-5 md:p-6">
          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider">{t('market_commodity')}</label>
                <select className={inputClass}
                  value={predForm.commodity} onChange={e => setPredForm(f => ({...f, commodity: e.target.value}))}>
                  {commodities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider">{t('market_state')}</label>
                <select className={inputClass}
                  value={predForm.state} onChange={e => setPredForm(f => ({...f, state: e.target.value}))}>
                  {availableStates.length > 0
                    ? availableStates.map(s => <option key={s} value={s}>{s}</option>)
                    : <option value={predForm.state}>{predForm.state}</option>}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider"><AzureTranslate text="District" /></label>
                <div className="bg-secondary-container/20 rounded-xl px-4 py-3 flex items-center gap-2 font-medium text-sm text-primary">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {predForm.district || detectedCity || 'Detecting...'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider"><AzureTranslate text="Min Price (₹)" /></label>
                <input type="number" className={inputClass}
                  value={predForm.min_price} onChange={e => setPredForm(f => ({...f, min_price: +e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider"><AzureTranslate text="Max Price (₹)" /></label>
                <input type="number" className={inputClass}
                  value={predForm.max_price} onChange={e => setPredForm(f => ({...f, max_price: +e.target.value}))} />
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-wider"><AzureTranslate text="Month" /></label>
                <select className={inputClass}
                  value={predForm.month} onChange={e => setPredForm(f => ({...f, month: +e.target.value}))}>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month:'long'})}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={predLoading}
              className="w-full sm:w-auto py-3.5 px-8 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-60">
              <span className="material-symbols-outlined">{predLoading ? 'hourglass_empty' : 'query_stats'}</span>
              {predLoading ? t('market_predicting') : t('market_predictPrice')}
            </button>
          </form>

          {prediction && (
            <div className="mt-6 p-6 md:p-8 bg-gradient-to-br from-primary/5 to-secondary-container/20 rounded-2xl text-center animate-fade-in-up">
              <div className="font-label text-xs text-on-surface-variant mb-1">{t('market_predictedPrice')}</div>
              <div className="font-headline font-extrabold text-5xl text-primary">₹{prediction.predicted_modal_price.toLocaleString()}</div>
              <div className="font-label text-sm text-on-surface-variant/60 mt-2">{prediction.unit} | {prediction.commodity} | {prediction.market}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
