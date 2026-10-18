import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getWeather, getMarketPrices, healthCheck, getFields } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'
import { useLocation } from '../contexts/LocationContext'
import { useAuth } from '../contexts/AuthContext'
import AzureTranslate from '../components/AzureTranslate'

function getRotationQuarters(prevCrop) {
  const lower = (prevCrop || 'Rice').toLowerCase()
  const isCereal = ['rice', 'wheat', 'maize', 'barley', 'bajra', 'jowar'].some(c => lower.includes(c))
  const isLegume = ['chickpea', 'gram', 'lentil', 'moong', 'urad', 'soyabean'].some(c => lower.includes(c))

  if (isCereal) {
    return [
      { crop: 'Chickpea', icon: 'eco' },
      { crop: 'Moong', icon: 'grain' },
      { crop: 'Soyabean', icon: 'psychiatry' },
      { crop: 'Wheat', icon: 'eco' },
    ]
  } else if (isLegume) {
    return [
      { crop: 'Wheat', icon: 'grain' },
      { crop: 'Cucumber', icon: 'eco' },
      { crop: 'Rice', icon: 'psychiatry' },
      { crop: 'Mustard', icon: 'eco' },
    ]
  }
  return [
    { crop: 'Chickpea', icon: 'eco' },
    { crop: 'Moong', icon: 'grain' },
    { crop: 'Rice', icon: 'psychiatry' },
    { crop: 'Chickpea', icon: 'eco' },
  ]
}

export default function Dashboard() {
  const [weather, setWeather] = useState(null)
  const [prices, setPrices] = useState(null)
  const [status, setStatus] = useState(null)
  const [weatherAlerts, setWeatherAlerts] = useState([])
  const [selectedYear, setSelectedYear] = useState(2026)
  const [fields, setFields] = useState([])
  const [fieldsLoading, setFieldsLoading] = useState(true)
  const { t } = useLanguage()
  const { latitude, longitude, city, state: locState } = useLocation()
  const { user } = useAuth()

  const loadUserFields = useCallback(async () => {
    try {
      const data = await getFields()
      setFields(data?.fields || [])
    } catch (err) {
      console.error('Failed to load fields on dashboard:', err)
      setFields([])
    } finally {
      setFieldsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUserFields()
    const handleUpdate = () => loadUserFields()
    window.addEventListener('fields-updated', handleUpdate)
    window.addEventListener('focus', handleUpdate)
    return () => {
      window.removeEventListener('fields-updated', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
    }
  }, [loadUserFields])

  useEffect(() => {
    healthCheck().then(setStatus).catch(() => setStatus({ status: 'offline' }))
  }, [])

  useEffect(() => {
    const lat = latitude || 25.3176
    const lon = longitude || 82.9739
    getWeather(lat, lon).then(data => {
      setWeather(data)
      setWeatherAlerts(data?.alerts || [])
    }).catch(console.error)
    const commodity = 'Wheat'
    const st = locState || ''
    getMarketPrices(commodity, st, '', '', 30).then(setPrices).catch(console.error)
  }, [latitude, longitude, locState])

  const userName = user?.name || user?.phone || 'Sunderganesh'
  const currentTemp = weather?.current?.temperature != null ? Math.round(weather.current.temperature) : 30
  const currentHumidity = weather?.current?.humidity != null ? weather.current.humidity : 74
  const currentWind = weather?.current?.wind_speed != null ? `${weather.current.wind_speed} km/h` : '7.3 km/h'
  const currentCondition = weather?.current?.description || 'Clear Sky'
  const activeFieldsCount = fields.filter(f => (f.status || 'active').toLowerCase() === 'active').length

  return (
    <div className="space-y-6 animate-fade-in text-[#17251F]">
      {/* Weather Alert Banner if severe */}
      {weatherAlerts.length > 0 && (
        <div className="bg-[#B7791F]/10 border border-[#B7791F]/30 text-[#8C5209] p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <span className="material-symbols-outlined text-xl flex-shrink-0 text-[#B7791F]">warning</span>
          <div className="text-xs">
            <strong className="font-bold"><AzureTranslate text="Weather Advisory"/>:</strong>{' '}
            <span><AzureTranslate text={weatherAlerts[0].message}/></span>
          </div>
        </div>
      )}

      {/* ── Flagship Welcome Banner Matching Reference ──────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white min-h-[260px] md:min-h-[300px] flex flex-col justify-center p-6 sm:p-8 md:p-12 shadow-sm border border-[#0A4D3D]">
        {/* Background Image: Panoramic Terraced Sunrise */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Lush Agricultural Terraces Sunrise"
            className="w-full h-full object-cover object-[75%_center] md:object-right transition-opacity duration-300"
            src="/dashboard-banner.jpg"
            loading="eager"
          />
        </div>

        {/* Emerald Left-to-Right Gradient Overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#042F25] via-[#042F25]/85 45% via-[#042F25]/35 75% to-transparent hidden sm:block" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#042F25] via-[#042F25]/85 60% to-transparent sm:hidden" />

        {/* Left Banner Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063D2E]/80 backdrop-blur-md border border-[#9DEBC1]/30 text-[10px] sm:text-[11px] font-bold tracking-widest text-[#9DEBC1] uppercase mb-3 shadow-xs">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            <span><AzureTranslate text="CURRENT CYCLE: WHEAT V.24" /></span>
          </div>

          <h2 className="font-headline text-3xl sm:text-4xl md:text-[44px] font-extrabold mb-2 leading-[1.15] tracking-tight text-white">
            <AzureTranslate text="Welcome back," /><br />
            <span className="text-[#9DEBC1]">{userName}!</span>
          </h2>

          <p className="font-body text-[#D4E8DC] text-xs sm:text-sm mb-6 max-w-lg leading-relaxed">
            <AzureTranslate text={`Your fields are thriving. Optimal harvest window predicted in 14 days. Soil moisture levels are steady at ${currentHumidity}%.`} />
          </p>

          <div>
            <Link
              to="/yield"
              className="inline-flex items-center gap-2 bg-[#087F5B] hover:bg-[#066C4C] px-6 py-2.5 rounded-full font-bold text-white text-xs sm:text-sm shadow-xs transition-all hover:translate-x-0.5"
            >
              <span><AzureTranslate text="View Report" /></span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bento Grid: Row 2 (4 Key Metric Cards) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Weather Today */}
        <div className="bg-white rounded-2xl border border-[#E3ECE6] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#087F5B]/30 transition-all">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                wb_sunny
              </span>
              <div>
                <p className="text-[11px] font-bold text-[#718078] uppercase tracking-wider leading-none">
                  <AzureTranslate text="Weather Today" />
                </p>
              </div>
            </div>
            <div className="mt-1">
              <h3 className="font-headline text-3xl font-extrabold text-[#17251F] tracking-tight">
                {currentTemp}°C
              </h3>
              <p className="text-xs font-medium text-[#718078] mt-0.5">
                <AzureTranslate text={currentCondition} />
              </p>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-[#F0F5F2] flex items-center justify-between text-xs text-[#718078] relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-500 text-sm">water_drop</span>
              <div>
                <span className="font-bold text-[#17251F]">{currentHumidity}%</span>
                <span className="block text-[10px] text-[#8C9B93]"><AzureTranslate text="Humidity" /></span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#087F5B] text-sm">air</span>
              <div>
                <span className="font-bold text-[#17251F]">{currentWind}</span>
                <span className="block text-[10px] text-[#8C9B93]"><AzureTranslate text="Wind Speed" /></span>
              </div>
            </div>
          </div>

          {/* Subtle sunny graphic background overlay */}
          <div className="absolute right-0 bottom-0 w-32 h-20 opacity-15 pointer-events-none overflow-hidden rounded-br-2xl">
            <img src="/weather-sunny.jpg" alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* 2. Pest Risk Index */}
        <div className="bg-white rounded-2xl border border-[#E3ECE6] p-5 shadow-xs flex flex-col justify-between group hover:border-[#087F5B]/30 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#087F5B] text-lg">pest_control</span>
                <span className="text-xs font-bold text-[#17251F]">
                  <AzureTranslate text="Pest Risk Index" />
                </span>
              </div>
              <Link
                to="/pests"
                className="w-7 h-7 rounded-full border border-[#D5E2D9] flex items-center justify-center text-[#17251F] hover:bg-[#F4F6F4] hover:text-[#087F5B] transition-colors"
                title="View Pest Details"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </Link>
            </div>

            <h3 className="font-headline text-3xl font-extrabold text-[#087F5B] mt-2">
              <AzureTranslate text="Low" />
            </h3>
            <p className="text-xs text-[#718078] mt-1 leading-relaxed">
              <AzureTranslate text="Aphid population stable. No immediate treatment required." />
            </p>
          </div>

          <div className="mt-4">
            <div className="w-full bg-[#E7F0E8] h-2 rounded-full overflow-hidden">
              <div className="bg-[#087F5B] h-full rounded-full w-[28%] transition-all duration-700" />
            </div>
          </div>
        </div>

        {/* 3. Soil Conditions */}
        <div className="bg-white rounded-2xl border border-[#E3ECE6] p-5 shadow-xs flex flex-col justify-between group hover:border-[#087F5B]/30 transition-all">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-[#B7791F] text-lg">potted_plant</span>
              <span className="text-xs font-bold text-[#17251F]">
                <AzureTranslate text="Soil Conditions" />
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              {/* pH */}
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-blue-500 text-lg mb-1">water_drop</span>
                <span className="font-headline text-xl font-extrabold text-[#17251F]">6.5</span>
                <span className="text-[11px] text-[#718078] font-medium">pH</span>
              </div>
              {/* N */}
              <div className="flex flex-col items-center border-x border-[#F0F5F2]">
                <span className="material-symbols-outlined text-[#087F5B] text-lg mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  eco
                </span>
                <span className="font-headline text-xl font-extrabold text-[#17251F]">90</span>
                <span className="text-[10px] text-[#718078] font-medium leading-tight">N (kg/ha)</span>
              </div>
              {/* P */}
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-[#10B981] text-lg mb-1">psychology</span>
                <span className="font-headline text-xl font-extrabold text-[#17251F]">42</span>
                <span className="text-[10px] text-[#718078] font-medium leading-tight">P (kg/ha)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-[#8C9B93]">
            <AzureTranslate text="Optimal nutrient balance for Wheat cycle" />
          </div>
        </div>

        {/* 4. Your Fields */}
        <div className="bg-white rounded-2xl border border-[#E3ECE6] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#087F5B]/30 transition-all">
          {/* Aerial Field background image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/field-aerial.jpg"
              alt="Aerial farm fields"
              className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/60" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#087F5B] text-lg">grid_view</span>
              <span className="text-xs font-bold text-[#17251F]">
                <AzureTranslate text="Your Fields" />
              </span>
            </div>
            <div className="mt-2">
              <h3 className="font-headline text-3xl font-extrabold text-[#17251F]">
                {fieldsLoading ? '—' : activeFieldsCount}
              </h3>
              <p className="text-xs text-[#718078] font-medium">
                <AzureTranslate text="Active Fields" />
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-3 flex justify-end">
            <Link
              to="/fields"
              className="px-4 py-1.5 bg-white border border-[#D5E2D9] hover:border-[#087F5B] text-[#17251F] text-xs font-bold rounded-full shadow-xs hover:shadow transition-all flex items-center gap-1"
            >
              <span><AzureTranslate text="Manage Fields" /></span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Section: Rotation Calendar (Left 8 cols) + Actions & Alerts (Right 4 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Field Rotation Calendar (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E3ECE6] p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F5F2]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E7F0E8] flex items-center justify-center text-[#087F5B]">
                <span className="material-symbols-outlined text-xl">calendar_month</span>
              </div>
              <div>
                <h3 className="font-headline text-base font-bold text-[#17251F]">
                  <AzureTranslate text="Field Rotation Calendar" />
                </h3>
                <p className="text-xs text-[#718078]">
                  <AzureTranslate text={`Planned crop rotation schedule for ${selectedYear}`} />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Year Switcher */}
              <div className="flex items-center bg-[#F4F6F4] border border-[#E3ECE6] rounded-xl px-2 py-1">
                <button
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="p-1 hover:text-[#087F5B] text-[#718078] transition-colors"
                  aria-label="Previous year"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="font-headline font-bold text-xs px-2 text-[#17251F]">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="p-1 hover:text-[#087F5B] text-[#718078] transition-colors"
                  aria-label="Next year"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>

              {/* View Full Plan Action */}
              <Link
                to="/planner"
                className="px-4 py-2 bg-[#087F5B] hover:bg-[#066C4C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span><AzureTranslate text="View Full Plan" /></span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Timeline Table matching Reference */}
          <div className="overflow-x-auto hide-scrollbar">
            <div className="min-w-[620px]">
              {/* Month Header Row */}
              <div className="grid grid-cols-12 gap-1 text-[11px] font-bold text-[#718078] uppercase pb-2 px-1">
                <div className="col-span-3 text-left pl-2">Field</div>
                <div className="col-span-9 grid grid-cols-12 text-center text-[10px] text-[#8C9B93]">
                  <span>JAN</span>
                  <span>FEB</span>
                  <span>MAR</span>
                  <span>APR</span>
                  <span>MAY</span>
                  <span>JUN</span>
                  <span>JUL</span>
                  <span>AUG</span>
                  <span>SEP</span>
                  <span>OCT</span>
                  <span>NOV</span>
                  <span>DEC</span>
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-3 pt-1">
                {fieldsLoading ? (
                  <div className="py-8 text-center text-xs text-[#718078]">
                    <AzureTranslate text="Loading fields..." />
                  </div>
                ) : fields.length === 0 ? (
                  <div className="p-6 text-center bg-[#FAFBF9] rounded-xl border border-[#EAF0EC]">
                    <span className="material-symbols-outlined text-2xl text-[#087F5B] mb-1">grid_view</span>
                    <p className="font-bold text-xs text-[#17251F]"><AzureTranslate text="No Fields Added Yet" /></p>
                    <p className="text-[11px] text-[#718078] mt-0.5"><AzureTranslate text="Register your farm plots to view rotation schedules." /></p>
                    <Link to="/fields" className="inline-flex items-center gap-1 text-xs font-bold text-[#087F5B] mt-2 hover:underline">
                      <span><AzureTranslate text="Add Your First Field" /></span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>
                ) : (
                  fields.map(plot => {
                    const quarters = getRotationQuarters(plot.previous_crop || plot.current_crop)
                    return (
                      <div key={plot.id} className="grid grid-cols-12 gap-2 items-center bg-[#FAFBF9] rounded-xl p-2 border border-[#EAF0EC]">
                        <div className="col-span-3 pl-2">
                          <p className="font-bold text-xs text-[#17251F] truncate">{plot.label}</p>
                          <p className="text-[10px] text-[#718078] truncate">
                            <AzureTranslate text="Previous" />: {plot.previous_crop || plot.current_crop || 'Rice'}
                          </p>
                        </div>
                        <div className="col-span-9 grid grid-cols-12 gap-1.5">
                          {/* Jan-Mar: Q1 */}
                          <div className="col-span-3 bg-[#D4F4E2] text-[#042F25] rounded-xl p-1.5 flex items-center gap-1 shadow-xs border border-[#BBEAD0]">
                            <span className="material-symbols-outlined text-sm text-[#087F5B]">{quarters[0].icon}</span>
                            <div className="truncate">
                              <span className="font-bold text-[10px] block leading-tight">{quarters[0].crop}</span>
                              <span className="text-[8px] text-[#5A7E6E]">(Jan – Mar)</span>
                            </div>
                          </div>
                          {/* Apr-Jun: Q2 */}
                          <div className="col-span-3 bg-[#FEE9CE] text-[#8C5209] rounded-xl p-1.5 flex items-center gap-1 shadow-xs border border-[#FADBB0]">
                            <span className="material-symbols-outlined text-sm text-[#B7791F]">{quarters[1].icon}</span>
                            <div className="truncate">
                              <span className="font-bold text-[10px] block leading-tight">{quarters[1].crop}</span>
                              <span className="text-[8px] text-[#9A6A2C]">(Apr – Jun)</span>
                            </div>
                          </div>
                          {/* Jul-Sep: Q3 */}
                          <div className="col-span-3 bg-[#E0F3DC] text-[#1E5622] rounded-xl p-1.5 flex items-center gap-1 shadow-xs border border-[#CBEACA]">
                            <span className="material-symbols-outlined text-sm text-[#2E7D32]">{quarters[2].icon}</span>
                            <div className="truncate">
                              <span className="font-bold text-[10px] block leading-tight">{quarters[2].crop}</span>
                              <span className="text-[8px] text-[#477C4B]">(Jul – Sep)</span>
                            </div>
                          </div>
                          {/* Oct-Dec: Q4 */}
                          <div className="col-span-3 bg-[#D4F4E2] text-[#042F25] rounded-xl p-1.5 flex items-center gap-1 shadow-xs border border-[#BBEAD0]">
                            <span className="material-symbols-outlined text-sm text-[#087F5B]">{quarters[3].icon}</span>
                            <div className="truncate">
                              <span className="font-bold text-[10px] block leading-tight">{quarters[3].crop}</span>
                              <span className="text-[8px] text-[#5A7E6E]">(Oct – Dec)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions + Recent Alerts (col-span-4) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-[#E3ECE6] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#087F5B] text-lg">bolt</span>
              <h3 className="font-headline text-sm font-bold text-[#17251F]">
                <AzureTranslate text="Quick Actions" />
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Get Crop Advice */}
              <Link
                to="/recommend"
                className="p-3 rounded-xl bg-[#EAF8F0] hover:bg-[#DCF3E6] border border-[#CFEEDC] transition-all flex items-center gap-2 text-[#087F5B] group"
              >
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">eco</span>
                <span className="text-xs font-bold leading-tight"><AzureTranslate text="Get Crop Advice" /></span>
              </Link>

              {/* 2. Scan Plant Disease */}
              <Link
                to="/disease"
                className="p-3 rounded-xl bg-[#E8F3FA] hover:bg-[#D7EBF6] border border-[#CCE3F2] transition-all flex items-center gap-2 text-[#0284C7] group"
              >
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">photo_camera</span>
                <span className="text-xs font-bold leading-tight"><AzureTranslate text="Scan Plant Disease" /></span>
              </Link>

              {/* 3. Check Market Prices */}
              <Link
                to="/market"
                className="p-3 rounded-xl bg-[#FFF6EB] hover:bg-[#FEEDD6] border border-[#FDE0BA] transition-all flex items-center gap-2 text-[#D97706] group"
              >
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">bar_chart</span>
                <span className="text-xs font-bold leading-tight"><AzureTranslate text="Check Market Prices" /></span>
              </Link>

              {/* 4. View Weather Forecast */}
              <Link
                to="/weather"
                className="p-3 rounded-xl bg-[#EFF6FF] hover:bg-[#DFEDFE] border border-[#CCE0FC] transition-all flex items-center gap-2 text-[#2563EB] group"
              >
                <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">cloud</span>
                <span className="text-xs font-bold leading-tight"><AzureTranslate text="View Weather Forecast" /></span>
              </Link>
            </div>
          </div>

          {/* Recent Alerts Panel */}
          <div className="bg-white rounded-2xl border border-[#E3ECE6] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0F5F2]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg">notifications</span>
                <h3 className="font-headline text-sm font-bold text-[#17251F]">
                  <AzureTranslate text="Recent Alerts" />
                </h3>
              </div>
              <Link
                to="/smart-alerts"
                className="text-xs text-[#718078] hover:text-[#087F5B] font-semibold flex items-center gap-0.5"
              >
                <span><AzureTranslate text="View All" /></span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B7791F] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-[#17251F] leading-tight">
                      <AzureTranslate text="Moderate pest risk" />
                    </p>
                    <p className="text-[11px] text-[#718078] mt-0.5">
                      <AzureTranslate text="Aphid activity detected in Sector 4" />
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">2 hours ago</span>
              </div>

              {/* Alert 2 */}
              <div className="flex items-start justify-between gap-3 text-xs pt-2 border-t border-[#F8FAF9]">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-[#17251F] leading-tight">
                      <AzureTranslate text="Irrigation reminder" />
                    </p>
                    <p className="text-[11px] text-[#718078] mt-0.5">
                      <AzureTranslate text="Field A – recommended in 3 days" />
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">5 hours ago</span>
              </div>

              {/* Alert 3 */}
              <div className="flex items-start justify-between gap-3 text-xs pt-2 border-t border-[#F8FAF9]">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#087F5B] shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-[#17251F] leading-tight">
                      <AzureTranslate text="Favourable weather" />
                    </p>
                    <p className="text-[11px] text-[#718078] mt-0.5">
                      <AzureTranslate text="Good conditions for sowing this week" />
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
