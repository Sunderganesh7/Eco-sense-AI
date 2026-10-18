import { useState, useEffect } from 'react'
import { recommendCrop, getStates, getCropsByState, getWeather, getCrops } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useLocation } from '../contexts/LocationContext'
import AzureTranslate from '../components/AzureTranslate'

const PRESETS = {
  rice_kharif: { nitrogen: 80, phosphorus: 48, potassium: 40, temperature: 27, humidity: 80, ph: 6.5, rainfall: 250, season: 'kharif', label: 'Rice Belt (Kharif)' },
  wheat_rabi: { nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 18, humidity: 65, ph: 7.0, rainfall: 50, season: 'rabi', label: 'Wheat Belt (Rabi)' },
  cotton: { nitrogen: 120, phosphorus: 50, potassium: 30, temperature: 32, humidity: 55, ph: 7.5, rainfall: 100, season: 'kharif', label: 'Cotton Region' },
  default: { nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 20.8, humidity: 82, ph: 6.5, rainfall: 202.9, season: 'kharif', label: 'Default' },
}

const SOIL_TYPES_FALLBACK = [
  'Alluvial soil', 'Black soil', 'Clayey soils', 'Desert soil', 'Desert soils',
  'Laterite soil', 'Red soil', 'Regur soil', 'Sandy Clay loam', 'Sandy loam', 'Sandy soil',
]

export default function Recommend() {
  const [form, setForm] = useState({ ...PRESETS.default, state: '', soil_type: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalCrops, setTotalCrops] = useState(149)
  const { t } = useLanguage()
  const { state: detectedState, latitude, longitude } = useLocation()

  const [states, setStates] = useState([])
  const [stateCrops, setStateCrops] = useState(null)
  const [stateLoading, setStateLoading] = useState(false)
  const [weatherLoading, setWeatherLoading] = useState(false)

  useEffect(() => {
    getStates().then(data => setStates(data.states || [])).catch(() => setStates([]))
    getCrops().then(data => {
      if (data?.total_crops) setTotalCrops(data.total_crops)
      else if (data?.recommendation_crops?.length) setTotalCrops(data.recommendation_crops.length)
    }).catch(() => {})
  }, [])


  useEffect(() => {
    if (detectedState && !form.state) setForm(prev => ({ ...prev, state: detectedState }))
  }, [detectedState])

  async function fillCurrentWeather() {
    const lat = latitude || 25.3176
    const lon = longitude || 82.9739
    setWeatherLoading(true)
    try {
      const data = await getWeather(lat, lon)
      const current = data?.current || {}
      if (current.temperature) {
        setForm(prev => ({
          ...prev,
          temperature: Math.round(current.temperature * 10) / 10,
          humidity: current.humidity || prev.humidity,
          rainfall: current.rain_1h ? current.rain_1h * 24 * 30 : prev.rainfall,
        }))
      }
    } catch (err) { console.error(err) }
    setWeatherLoading(false)
  }

  useEffect(() => {
    if (!form.state) { setStateCrops(null); return }
    setStateLoading(true)
    getCropsByState(form.state)
      .then(data => {
        setStateCrops(data)
        if (data.soil_types?.length > 0 && !form.soil_type) setForm(prev => ({ ...prev, soil_type: data.soil_types[0] }))
      })
      .catch(() => setStateCrops(null))
      .finally(() => setStateLoading(false))
  }, [form.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: ['season', 'previous_crop', 'state', 'soil_type'].includes(name) ? value : parseFloat(value) || 0 }))
  }

  const handlePreset = (key) => setForm(prev => ({ ...prev, ...PRESETS[key] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const data = await recommendCrop({
        nitrogen: form.nitrogen, phosphorus: form.phosphorus, potassium: form.potassium,
        temperature: form.temperature, humidity: form.humidity, ph: form.ph, rainfall: form.rainfall,
        season: form.season, previous_crop: form.previous_crop || null,
        state: form.state || null, soil_type: form.soil_type || null,
      })
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const soilTypes = stateCrops?.soil_types?.length > 0 ? stateCrops.soil_types : SOIL_TYPES_FALLBACK

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-[#17251F]">
      {/* ── Feature Hero Banner with Generated Asset ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white p-6 sm:p-10 md:p-12 shadow-sm border border-[#0A4D3D] min-h-[250px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/crop-advisory-banner.jpg"
            alt="Young crop seedlings in fertile soil"
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
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <span><AzureTranslate text="AI Precision Crop Advisory" /></span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              <AzureTranslate text="Smart Crop Recommendation Workspace" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-lg">
              <AzureTranslate text="Scientific multi-crop ranking powered by regional agro-climatic intelligence, soil chemistry, and real-time Open-Meteo forecasts." />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#087F5B] text-white text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>{totalCrops} <AzureTranslate text="Supported Varieties" /></span>
            </span>

            <button
              type="button"
              onClick={fillCurrentWeather}
              disabled={weatherLoading}
              className="px-4 py-2 rounded-full bg-white border border-[#D5E2D9] hover:border-[#087F5B] text-[#17251F] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-[#087F5B]">my_location</span>
              <span>{weatherLoading ? <AzureTranslate text="Loading..." /> : <AzureTranslate text="Auto-fill Weather" />}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Input Form ─────────────────────── */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-[#E3ECE6] shadow-xs overflow-hidden">
            <div className="p-5 bg-[#FAFBF9] border-b border-[#F0F5F2]">
              <h3 className="font-headline font-bold text-[#17251F] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F5B]">science</span>
                <AzureTranslate text="Soil & Agro-Climatic Telemetry" />
              </h3>
              <p className="font-label text-xs text-[#718078] mt-0.5">
                <AzureTranslate text="Specify field coordinates, soil nutrients, and season" />
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Location */}
              <div className="space-y-2">
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-[#718078] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-[#087F5B]">location_on</span> <AzureTranslate text="Location & Soil Type" />
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <select name="state" value={form.state} onChange={handleChange}
                    className="w-full bg-[#F4F6F4] border border-[#E3ECE6] rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#087F5B]/20 focus:outline-none">
                    <option value="">{t('rec_selectState') || 'Select State'}</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select name="soil_type" value={form.soil_type} onChange={handleChange}
                    className="w-full bg-[#F4F6F4] border border-[#E3ECE6] rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-[#087F5B]/20 focus:outline-none">
                    <option value="">{t('rec_selectSoil') || 'Select Soil'}</option>
                    {soilTypes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50"><AzureTranslate text="Quick Presets" /></label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button key={key} onClick={() => handlePreset(key)}
                      className="px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-bold hover:bg-surface-container-high transition-colors">
                      <AzureTranslate text={preset.label} />
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Soil NPK */}
                <div className="space-y-3">
                  <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">science</span> <AzureTranslate text="Soil Nutrients" />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'nitrogen', label: 'N', value: form.nitrogen },
                      { name: 'phosphorus', label: 'P', value: form.phosphorus },
                      { name: 'potassium', label: 'K', value: form.potassium },
                    ].map(f => (
                      <div key={f.name} className="bg-surface-container-low rounded-2xl p-3 text-center">
                        <span className="block text-[10px] font-bold text-on-surface-variant/40 mb-1 uppercase">{f.label}</span>
                        <input type="number" name={f.name} value={f.value} onChange={handleChange} step="0.1"
                          className="w-full bg-transparent text-center font-headline font-bold text-primary p-0 focus:ring-0 focus:outline-none text-lg" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <label className="font-label text-xs font-semibold text-on-surface-variant/60"><AzureTranslate text="Soil pH" /></label>
                    <input type="number" name="ph" value={form.ph} onChange={handleChange} step="0.1" min="0" max="14"
                      className="w-full bg-surface-container-highest rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                  </div>
                </div>

                {/* Weather */}
                <div className="space-y-3">
                  <label className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-primary">wb_sunny</span> <AzureTranslate text="Weather Conditions" />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'temperature', label: 'Temperature', val: form.temperature, unit: '°C' },
                      { name: 'humidity', label: 'Humidity', val: form.humidity, unit: '%' },
                      { name: 'rainfall', label: 'Rainfall', val: form.rainfall, unit: 'mm' },
                    ].map(f => (
                      <div key={f.name} className="space-y-1">
                        <label className="font-label text-[10px] font-semibold text-on-surface-variant/50"><AzureTranslate text={f.label} /></label>
                        <input type="number" name={f.name} value={f.val} onChange={handleChange} step="0.1"
                          className="w-full bg-surface-container-highest rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-label text-[10px] font-semibold text-on-surface-variant/50"><AzureTranslate text="Season" /></label>
                      <select name="season" value={form.season} onChange={handleChange}
                        className="w-full bg-surface-container-highest rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none">
                        <option value="kharif">Kharif (Jun-Oct)</option>
                        <option value="rabi">Rabi (Nov-Mar)</option>
                        <option value="zaid">Zaid (Mar-Jun)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-label text-[10px] font-semibold text-on-surface-variant/50"><AzureTranslate text="Previous Crop" /></label>
                      <select name="previous_crop" value={form.previous_crop || ''} onChange={handleChange}
                        className="w-full bg-surface-container-highest rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none">
                        <option value="">None</option>
                        {['rice','wheat','maize','cotton','chickpea','mungbean','sugarcane','potato'].map(c =>
                          <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-60">
                  <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'auto_awesome'}</span>
                  {loading ? <AzureTranslate text="Analyzing..." /> : <AzureTranslate text="Get Recommendations" />}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Results ─────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* State crops */}
          {stateCrops?.crops?.length > 0 && !result && (
            <div className="bg-white rounded-2xl editorial-shadow overflow-hidden animate-fade-in">
              <div className="p-5 bg-surface-container-low flex items-center justify-between">
                <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">public</span> <AzureTranslate text={`Best Crops for ${form.state}`} />
                </h3>
                {stateCrops.climate && <span className="smart-chip bg-primary/10 text-primary"><AzureTranslate text={stateCrops.climate.split(',')[0]} /></span>}
              </div>
              <div className="p-5">
                <p className="text-sm text-on-surface-variant/60 mb-4"><AzureTranslate text="Based on your state's climate and soil. Enter soil details for more accurate AI-powered results." /></p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {stateCrops.crops.slice(0, 12).map((crop, i) => (
                    <div key={i} className="bg-secondary-container/20 rounded-2xl p-3 hover:bg-secondary-container/35 transition-colors">
                      <div className="font-headline font-bold text-sm text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-sm">eco</span>
                        <AzureTranslate text={crop.name || crop} />
                      </div>
                      {crop.season && <div className="font-label text-[10px] text-on-surface-variant/60 mt-1"><AzureTranslate text={crop.season} /></div>}
                      {crop.reason && <div className="font-label text-[10px] text-secondary mt-0.5"><AzureTranslate text={crop.reason} /></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stateLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="spinner" /><span className="font-label text-sm text-on-surface-variant/60"><AzureTranslate text="Loading state recommendations..." /></span>
            </div>
          )}

          {error && (
            <div className="bg-error-container/30 text-on-error-container p-4 rounded-2xl flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-error">error</span> <AzureTranslate text={error} />
            </div>
          )}

          {!result && !loading && !stateCrops && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">eco</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-2"><AzureTranslate text="Enter Your Data" /></h3>
              <p className="text-sm text-on-surface-variant/60 max-w-sm"><AzureTranslate text="Fill in your soil nutrient levels and weather conditions to get AI-powered crop recommendations." /></p>
              <p className="text-xs text-on-surface-variant/40 mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-tertiary">lightbulb</span>
                <AzureTranslate text="Select your state first to see location-based crop suggestions!" />
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="spinner" /><span className="font-label text-sm text-on-surface-variant"><AzureTranslate text="Running AI model..." /></span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-fade-in-up stagger-children">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-headline text-xl font-extrabold text-on-surface"><AzureTranslate text="Top Recommendations" /></h2>
                <div className="flex gap-2">
                  <span className="smart-chip bg-primary/10 text-primary">{result.inference_ms}ms</span>
                  {result.dataset_version === 'v2_state_aware' && (
                    <span className="smart-chip bg-secondary-container text-on-secondary-container"><AzureTranslate text="State-Aware" /></span>
                  )}
                </div>
              </div>

              {result.recommendations.map((rec, i) => (
                <div key={rec.crop} className={`bg-white rounded-2xl p-5 md:p-6 editorial-shadow transition-all hover:-translate-y-1 duration-300 ${
                  rec.rank === 1 ? 'ring-2 ring-primary/20 bg-gradient-to-br from-white to-primary/[0.03]' : ''
                }`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 items-start">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        rec.rank === 1 ? 'bg-primary text-white' : rec.rank === 2 ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                      }`}>#{rec.rank}</div>
                      <div>
                        <div className="font-headline font-extrabold text-xl text-on-surface capitalize"><AzureTranslate text={rec.crop} /></div>
                        <span className="smart-chip bg-secondary-container/50 text-on-secondary-container mt-1"><AzureTranslate text={rec.crop_family} /></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-headline font-extrabold text-2xl text-primary">{rec.confidence_pct}%</div>
                      <div className="font-label text-[10px] text-on-surface-variant/50"><AzureTranslate text="confidence" /></div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-700" style={{ width: `${rec.confidence_pct}%` }} />
                  </div>

                  <p className="mt-3 text-sm text-on-surface-variant/70 leading-relaxed flex items-start gap-2">
                    <span className="material-symbols-outlined text-tertiary text-sm mt-0.5 flex-shrink-0">lightbulb</span>
                    <AzureTranslate text={rec.reason} />
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-surface-container-low p-3 rounded-xl text-center">
                      <div className="font-label text-[10px] text-on-surface-variant/40 font-bold uppercase mb-1"><AzureTranslate text="Sowing" /></div>
                      <div className="font-headline font-bold text-xs"><AzureTranslate text={`${rec.sowing_window.start} — ${rec.sowing_window.end}`} /></div>
                    </div>
                    <div className="bg-tertiary-fixed/20 p-3 rounded-xl text-center">
                      <div className="font-label text-[10px] text-on-surface-variant/40 font-bold uppercase mb-1">N-P-K</div>
                      <div className="font-headline font-bold text-xs">{rec.fertilizer.nitrogen_kg_ha}-{rec.fertilizer.phosphorus_kg_ha}-{rec.fertilizer.potassium_kg_ha}</div>
                    </div>
                    <div className="bg-secondary-container/20 p-3 rounded-xl text-center">
                      <div className="font-label text-[10px] text-on-surface-variant/40 font-bold uppercase mb-1"><AzureTranslate text="Base Score" /></div>
                      <div className="font-headline font-bold text-xs">{(rec.base_score * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  {rec.adjustments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rec.adjustments.map((adj, j) => (
                        <span key={j} className={`smart-chip ${adj.value > 0 ? 'bg-primary/10 text-primary' : 'bg-tertiary-fixed/30 text-on-tertiary-fixed-variant'}`}>
                          <AzureTranslate text={adj.rule.replace(/_/g, ' ')} />: {adj.value > 0 ? '+' : ''}{adj.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-surface-container-low rounded-2xl p-4 font-label text-xs text-on-surface-variant/50">
                <strong><AzureTranslate text="Model" />:</strong> {result.model_version} | <strong><AzureTranslate text="Inference" />:</strong> {result.inference_ms}ms |
                <strong> <AzureTranslate text="Input" />:</strong> N={result.input_summary.soil.N}, P={result.input_summary.soil.P}, K={result.input_summary.soil.K}, pH={result.input_summary.soil['pH']}
                {result.input_summary.state && <> | <strong><AzureTranslate text="State" />:</strong> <AzureTranslate text={result.input_summary.state} /></>}
                {result.input_summary.soil_type && <> | <strong><AzureTranslate text="Soil" />:</strong> <AzureTranslate text={result.input_summary.soil_type} /></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
