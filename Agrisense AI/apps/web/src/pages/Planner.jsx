import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getStates, getFields, getCropPlans } from '../services/api'
import { useLocation } from '../contexts/LocationContext'
import { useLanguage } from '../contexts/LanguageContext'
import AzureTranslate from '../components/AzureTranslate'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const SEASON_MONTHS = {
  rabi: { start: 10, end: 2, label: 'Rabi (Nov–Mar)', emoji: '❄', color: 'bg-blue-100 text-blue-700' },
  kharif: { start: 5, end: 9, label: 'Kharif (Jun–Oct)', emoji: '🌧', color: 'bg-emerald-100 text-emerald-700' },
  zaid: { start: 2, end: 5, label: 'Zaid (Mar–Jun)', emoji: '☀', color: 'bg-amber-100 text-amber-700' },
}

// Crop color mapping for visual consistency
const CROP_COLORS = {
  rice: '#006b47', wheat: '#a36a00', maize: '#825400', cotton: '#ba1a1a',
  chickpea: '#3c6842', lentil: '#643f00', mustard: '#825400', potato: '#6e7a71',
  sugarcane: '#005235', mungbean: '#006b47', barley: '#8a6c3e', soyabean: '#5a7a34',
  groundnut: '#8b6914', jowar: '#7a5c2e', bajra: '#6b5b3e', gram: '#4a7a42',
  rapeseed: '#7a8a22', sunflower: '#c49a00', onion: '#8a3a5c', banana: '#4a8a22',
  pea: '#3a8a5c', moong: '#006b47', urad: '#3c5a42', arhar: '#5c6a32',
  cucumber: '#2a7a4a', watermelon: '#c45a4a',
  fallow: '#bdcac0', default: '#6e7a71',
}

// Crop family classification for rotation rules
const CROP_FAMILIES = {
  cereals: ['rice', 'wheat', 'maize', 'barley', 'bajra', 'jowar', 'small millets', 'ragi'],
  legumes: ['chickpea', 'gram', 'lentil', 'mungbean', 'moong(green gram)', 'urad', 'arhar/tur', 'cowpea(lobia)', 'peas & beans (pulses)', 'soyabean', 'groundnut', 'horse-gram', 'khesari', 'moth'],
  oilseeds: ['mustard', 'rapeseed & mustard', 'sunflower', 'sesamum', 'linseed', 'castor seed', 'niger seed', 'safflower'],
  cash_crops: ['cotton(lint)', 'sugarcane', 'tobacco', 'jute', 'mesta'],
  vegetables: ['potato', 'onion', 'brinjal', 'cabbage', 'bhindi', 'bottle gourd', 'drum stick', 'sweet potato', 'tapioca'],
  fruits: ['banana', 'mango', 'lemon', 'coconut', 'arecanut', 'cashewnut'],
  spices: ['turmeric', 'ginger', 'garlic', 'coriander'],
}

function getCropFamily(cropName) {
  const lower = cropName.toLowerCase()
  for (const [family, crops] of Object.entries(CROP_FAMILIES)) {
    if (crops.some(c => lower.includes(c) || c.includes(lower))) return family
  }
  return 'other'
}

function getCropColor(cropName) {
  const lower = cropName.toLowerCase()
  for (const [key, color] of Object.entries(CROP_COLORS)) {
    if (lower.includes(key)) return color
  }
  return CROP_COLORS.default
}

// Season-specific crop mapping (common Indian crops)
const SEASON_CROPS = {
  rabi: ['Wheat', 'Mustard', 'Chickpea', 'Gram', 'Barley', 'Lentil', 'Rapeseed & Mustard', 'Peas & beans (Pulses)', 'Potato', 'Onion', 'Sunflower', 'Linseed', 'Safflower'],
  kharif: ['Rice', 'Maize', 'Cotton(lint)', 'Soyabean', 'Groundnut', 'Bajra', 'Jowar', 'Sugarcane', 'Arhar/Tur', 'Moong(Green Gram)', 'Urad', 'Sesamum', 'Jute'],
  zaid: ['Moong(Green Gram)', 'Cucumber', 'Watermelon', 'Sunflower', 'Groundnut'],
}

// Rotation rules engine
function generateRotationPlan(state, previousCrop, year) {
  const seasons = ['rabi', 'zaid', 'kharif', 'rabi']
  const plan = []
  let lastCrop = previousCrop || ''
  let lastFamily = getCropFamily(lastCrop)

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const seasonInfo = SEASON_MONTHS[season]
    const availableCrops = SEASON_CROPS[season] || []

    // Filter out same crop and prefer different family
    let candidates = availableCrops.filter(c => c.toLowerCase() !== lastCrop.toLowerCase())

    // Prefer legumes after cereals (nitrogen restoration)
    if (lastFamily === 'cereals') {
      const legumes = candidates.filter(c => getCropFamily(c) === 'legumes')
      if (legumes.length > 0) {
        candidates = [...legumes, ...candidates.filter(c => getCropFamily(c) !== 'legumes')]
      }
    }
    // Prefer cereals after legumes
    else if (lastFamily === 'legumes') {
      const cereals = candidates.filter(c => getCropFamily(c) === 'cereals')
      if (cereals.length > 0) {
        candidates = [...cereals, ...candidates.filter(c => getCropFamily(c) !== 'cereals')]
      }
    }
    // Avoid same family consecutively
    else {
      const diffFamily = candidates.filter(c => getCropFamily(c) !== lastFamily)
      if (diffFamily.length > 0) candidates = diffFamily
    }

    const chosen = candidates[0] || availableCrops[0] || 'Fallow'
    const family = getCropFamily(chosen)
    let reason = ''

    if (lastFamily === 'cereals' && family === 'legumes') {
      reason = 'Legume after cereal restores soil nitrogen'
    } else if (lastFamily === 'legumes' && family === 'cereals') {
      reason = 'Cereal benefits from nitrogen-enriched soil'
    } else if (chosen.toLowerCase() !== lastCrop.toLowerCase()) {
      reason = 'Crop diversification prevents pest buildup'
    } else if (chosen === 'Fallow') {
      reason = 'Rest period to restore soil health'
    } else {
      reason = `Suitable for ${season} season`
    }

    // Determine actual year for this entry (handle rabi spanning years)
    const entryYear = (i === 0 && season === 'rabi') ? year - 1 : year
    const startMonth = seasonInfo.start
    const endMonth = seasonInfo.end

    plan.push({
      season,
      seasonLabel: seasonInfo.label,
      crop: chosen,
      family,
      familyLabel: family.replace(/_/g, ' '),
      reason,
      startMonth,
      endMonth,
      year: entryYear,
      color: getCropColor(chosen),
      risk: chosen === 'Fallow' ? 'none' : (lastCrop.toLowerCase() === chosen.toLowerCase() ? 'high' : 'low'),
    })

    lastCrop = chosen
    lastFamily = family
  }

  return plan
}

export default function Planner() {
  const { state: detectedState } = useLocation()
  const { t } = useLanguage()
  const [selectedState, setSelectedState] = useState(detectedState || 'Uttar Pradesh')
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedSeason, setSelectedSeason] = useState('all')
  const [states, setStates] = useState([])
  const [userFields, setUserFields] = useState([])
  const [savedPlans, setSavedPlans] = useState([])
  const [loadingFields, setLoadingFields] = useState(true)
  const [fieldPlans, setFieldPlans] = useState([])
  const [previousCrop, setPreviousCrop] = useState('Rice')
  const [customPlan, setCustomPlan] = useState(null)
  const [showCustom, setShowCustom] = useState(false)

  useEffect(() => {
    getStates().then(d => setStates(d.states || [])).catch(() => {})
    const loadData = () => {
      return Promise.all([
        getFields().catch(() => ({ fields: [] })),
        getCropPlans(selectedYear, false).catch(() => ({ plans: [] })),
      ]).then(([fieldsData, plansData]) => {
        setUserFields(fieldsData?.fields || [])
        setSavedPlans(plansData?.plans || [])
      }).finally(() => {
        setLoadingFields(false)
      })
    }
    loadData()

    window.addEventListener('fields-updated', loadData)
    window.addEventListener('focus', loadData)
    return () => {
      window.removeEventListener('fields-updated', loadData)
      window.removeEventListener('focus', loadData)
    }
  }, [selectedYear])

  useEffect(() => {
    if (detectedState) setSelectedState(detectedState)
  }, [detectedState])

  useEffect(() => {
    const currentState = selectedState || detectedState || 'Uttar Pradesh'
    if (userFields.length > 0) {
      const plans = userFields.map(field => {
        const fieldName = field.label || field.name || 'Plot'
        const prevCrop = field.previous_crop || field.current_crop || 'Rice'
        const soil = field.soil_type || 'Alluvial'

        // Check for saved rotation plan entries for this field
        const matchingSaved = (savedPlans || []).filter(p =>
          (p.field_id && p.field_id === field.id) ||
          (p.plot_label && p.plot_label.toLowerCase() === fieldName.toLowerCase())
        )

        let rotation
        if (matchingSaved.length > 0) {
          rotation = matchingSaved.map(sp => {
            const crop = sp.crop || 'Fallow'
            const family = getCropFamily(crop)
            return {
              season: sp.season || 'kharif',
              seasonLabel: SEASON_MONTHS[sp.season]?.label || sp.season,
              crop: crop,
              family: family,
              familyLabel: family.replace(/_/g, ' '),
              reason: 'Saved rotation plan',
              startMonth: Math.max(0, (sp.start_month || 1) - 1),
              endMonth: Math.min(11, (sp.end_month || 3) - 1),
              year: sp.year || selectedYear,
              color: getCropColor(crop),
              risk: 'low',
            }
          })
        } else {
          rotation = generateRotationPlan(currentState, prevCrop, selectedYear)
        }

        return {
          name: fieldName,
          previousCrop: prevCrop,
          soil: soil,
          plan: rotation,
        }
      })
      setFieldPlans(plans)
    } else {
      setFieldPlans([])
    }
  }, [selectedState, detectedState, selectedYear, userFields, savedPlans])

  function handleGenerateCustom() {
    const plan = generateRotationPlan(selectedState, previousCrop, selectedYear)
    setCustomPlan(plan)
    setShowCustom(true)
  }

  // Helper to check if a month index falls in a season range
  function isInSeasonRange(monthIdx, start, end) {
    if (start <= end) return monthIdx >= start && monthIdx <= end
    return monthIdx >= start || monthIdx <= end  // wraps around Dec→Jan
  }

  // Build gantt rows from field plans
  function buildGanttRow(plan) {
    const cells = new Array(12).fill(null)
    plan.forEach(entry => {
      const s = entry.startMonth
      const e = entry.endMonth
      // Fill cells
      for (let m = 0; m < 12; m++) {
        if (isInSeasonRange(m, s, e)) {
          cells[m] = entry
        }
      }
    })
    return cells
  }

  const filteredPlans = selectedSeason === 'all'
    ? fieldPlans
    : fieldPlans.map(fp => ({
        ...fp,
        plan: fp.plan.filter(p => p.season === selectedSeason),
      }))

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto text-[#17251F]">
      {/* ── Feature Hero Header Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#042F25] text-white p-6 sm:p-10 md:p-12 shadow-sm border border-[#0A4D3D] min-h-[250px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/field-rotation-banner.jpg"
            alt="Field rotation agricultural plots"
            className="w-full h-full object-cover object-center md:object-[center_40%]"
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
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
              <span><AzureTranslate text="Multi-Season Agro-Planning" /></span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight">
              <AzureTranslate text="Field Rotation Timeline & Soil Renewal" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-lg">
              <AzureTranslate text="Optimize rotational planting to fix atmospheric nitrogen, disrupt pest life cycles, and maximize annual crop yields across your farm plots." />
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Year Navigator */}
            <div className="flex items-center bg-[#063D2E]/90 border border-white/15 rounded-xl px-2 py-1 shadow-xs">
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                className="p-1 hover:text-[#9DEBC1] text-white/70 transition-colors"
                aria-label="Previous year"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="font-headline font-bold text-xs px-2.5 text-white">{selectedYear}</span>
              <button
                onClick={() => setSelectedYear(y => y + 1)}
                className="p-1 hover:text-[#9DEBC1] text-white/70 transition-colors"
                aria-label="Next year"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>

            <button
              onClick={() => handleGenerateCustom()}
              className="px-4 py-2 bg-[#087F5B] hover:bg-[#066C4C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span><AzureTranslate text="Re-calculate Plan" /></span>
            </button>
          </div>
        </div>
      </section>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-[#E3ECE6] p-4 sm:p-5 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* State selector */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#087F5B]">location_on</span>
            <select
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
              className="bg-[#F4F6F4] border border-[#E3ECE6] rounded-xl px-3 py-2 text-xs font-semibold text-[#17251F] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20"
            >
              <option value="">{t('rec_selectState') || 'Select State'}</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Previous crop selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#718078] font-semibold"><AzureTranslate text="Previous Crop" />:</span>
            <select
              value={previousCrop}
              onChange={e => setPreviousCrop(e.target.value)}
              className="bg-[#F4F6F4] border border-[#E3ECE6] rounded-xl px-3 py-2 text-xs font-semibold text-[#17251F] focus:outline-none focus:ring-2 focus:ring-[#087F5B]/20"
            >
              {['Rice', 'Wheat', 'Maize', 'Cotton', 'Chickpea', 'Sugarcane', 'Soyabean', 'Groundnut', 'Potato'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Season filters & legend */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="font-label text-[10px] font-bold text-[#718078] uppercase tracking-wider mr-1"><AzureTranslate text="Filter Season" />:</span>
          {['all', 'rabi', 'kharif', 'zaid'].map(s => (
            <button key={s} onClick={() => setSelectedSeason(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                selectedSeason === s
                  ? 'bg-[#087F5B] text-white shadow-xs'
                  : 'bg-[#F4F6F4] text-[#17251F] hover:bg-[#E7F0E8]'
              }`}>
              {s === 'all' ? 'All Seasons' : SEASON_MONTHS[s]?.emoji + ' ' + s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Generated Plan */}
      {showCustom && customPlan && (
        <div className="bg-white rounded-2xl editorial-shadow overflow-hidden animate-fade-in-up">
          <div className="p-5 bg-gradient-to-r from-primary to-primary-container text-white">
            <h3 className="font-headline font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">auto_awesome</span>
              <AzureTranslate text="Your Rotation Plan" />
            </h3>
            <p className="font-label text-sm text-white/70 mt-1">
              {selectedState} · {selectedYear} · <AzureTranslate text="Previous" />: {previousCrop}
            </p>
          </div>
          <div className="p-5 space-y-3">
            {/* Timeline cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {customPlan.map((entry, i) => (
                <div key={i} className={`rounded-2xl p-4 border-2 transition-all hover:-translate-y-0.5 ${
                  selectedSeason !== 'all' && entry.season !== selectedSeason ? 'opacity-30' : ''
                }`} style={{
                  borderColor: `${entry.color}40`,
                  background: `${entry.color}08`,
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`smart-chip ${SEASON_MONTHS[entry.season]?.color}`}>
                      {SEASON_MONTHS[entry.season]?.emoji} {entry.season}
                    </span>
                    {entry.risk === 'high' && (
                      <span className="smart-chip bg-error/10 text-error">
                        <span className="material-symbols-outlined text-[10px]">warning</span> <AzureTranslate text="Risk" />
                      </span>
                    )}
                  </div>
                  <h4 className="font-headline font-extrabold text-lg capitalize" style={{ color: entry.color }}>
                    <AzureTranslate text={entry.crop} />
                  </h4>
                  <div className="font-label text-[10px] text-on-surface-variant/50 uppercase mt-0.5">
                    {entry.familyLabel} · {MONTHS[entry.startMonth]}–{MONTHS[entry.endMonth]}
                  </div>
                  <p className="text-xs text-on-surface-variant/70 mt-2 leading-relaxed flex items-start gap-1">
                    <span className="material-symbols-outlined text-primary text-xs mt-0.5 flex-shrink-0">lightbulb</span>
                    <AzureTranslate text={entry.reason} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visual Gantt Calendar */}
      {fieldPlans.length > 0 && (
        <div className="bg-white rounded-2xl editorial-shadow overflow-hidden">
          <div className="p-5 bg-surface-container-low flex items-center justify-between">
            <h3 className="font-headline font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <AzureTranslate text="Field Rotation Calendar" />
            </h3>
            <span className="smart-chip bg-primary/10 text-primary">{selectedYear}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="text-left p-3 md:p-4 font-label text-xs uppercase tracking-wider text-on-surface-variant/50 bg-surface-container-low w-36">
                    <AzureTranslate text="Field" />
                  </th>
                  {MONTHS.map(m => (
                    <th key={m} className="text-center p-2 md:p-3 font-label text-[10px] uppercase tracking-wider text-on-surface-variant/50 bg-surface-container-low">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((field, fi) => {
                  const cells = buildGanttRow(field.plan)
                  const rendered = []
                  let i = 0
                  while (i < 12) {
                    const entry = cells[i]
                    if (!entry) {
                      rendered.push(<td key={i} className="p-1"><div className="h-[50px]" /></td>)
                      i++
                    } else {
                      // Count span
                      let span = 0
                      let j = i
                      while (j < 12 && cells[j] === entry) { span++; j++ }
                      const color = entry.color
                      rendered.push(
                        <td key={i} colSpan={span} className="p-1">
                          <div className="gantt-bar cursor-default min-h-[50px] flex-col" style={{
                            background: entry.crop === 'Fallow' ? '#f2f4f3' : `${color}15`,
                            color: entry.crop === 'Fallow' ? '#6e7a71' : color,
                            border: `2px solid ${entry.crop === 'Fallow' ? '#e6e9e8' : `${color}40`}`,
                          }}>
                            <div className="font-headline font-bold text-xs capitalize"><AzureTranslate text={entry.crop} /></div>
                            <div className="font-label text-[9px] opacity-60 mt-0.5">{entry.season}</div>
                          </div>
                        </td>
                      )
                      i = j
                    }
                  }
                  return (
                    <tr key={fi} className="border-b border-surface-container-high/40 last:border-0">
                      <td className="p-3 md:p-4">
                        <div className="font-headline font-bold text-sm text-on-surface"><AzureTranslate text={field.name} /></div>
                        <div className="font-label text-[10px] text-on-surface-variant/50 mt-0.5">
                          <AzureTranslate text="Previous" />: <span className="capitalize">{field.previousCrop}</span>
                        </div>
                      </td>
                      {rendered}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile-friendly season cards view */}
      {fieldPlans.length > 0 && (
        <div className="lg:hidden space-y-4">
          <h3 className="font-headline font-bold text-on-surface px-1"><AzureTranslate text="Season-by-Season View" /></h3>
          {fieldPlans.map((field, fi) => (
            <div key={fi} className="bg-white rounded-2xl editorial-shadow overflow-hidden">
              <div className="p-4 bg-surface-container-low">
                <h4 className="font-headline font-bold text-sm">{field.name}</h4>
                <p className="font-label text-[10px] text-on-surface-variant/50"><AzureTranslate text="Previous" />: {field.previousCrop} · {field.soil}</p>
              </div>
              <div className="p-3 space-y-2">
                {field.plan
                  .filter(p => selectedSeason === 'all' || p.season === selectedSeason)
                  .map((entry, ei) => (
                  <div key={ei} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `${entry.color}08`, border: `1px solid ${entry.color}20` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${entry.color}20` }}>
                      <span className="text-lg">{SEASON_MONTHS[entry.season]?.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-headline font-bold text-sm capitalize" style={{ color: entry.color }}>
                        <AzureTranslate text={entry.crop} />
                      </div>
                      <div className="font-label text-[10px] text-on-surface-variant/50">
                        {entry.season} · {MONTHS[entry.startMonth]}–{MONTHS[entry.endMonth]}
                      </div>
                    </div>
                    <span className={`smart-chip ${SEASON_MONTHS[entry.season]?.color} text-[9px]`}>
                      {entry.familyLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state when no state selected */}
      {!selectedState && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">agriculture</span>
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2"><AzureTranslate text="Select Your State" /></h3>
          <p className="text-sm text-on-surface-variant/60 max-w-sm">
            <AzureTranslate text="Choose your state above to generate a personalized crop rotation plan based on local seasons and soil conditions." />
          </p>
        </div>
      )}

      {/* Empty fields state when state is selected but user has no fields */}
      {selectedState && userFields.length === 0 && !loadingFields && (
        <div className="bg-white rounded-2xl editorial-shadow p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
            <span className="material-symbols-outlined text-3xl">grid_view</span>
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
            <AzureTranslate text="No Registered Fields Found" />
          </h3>
          <p className="font-label text-xs sm:text-sm text-on-surface-variant/60 max-w-md mx-auto mb-5 leading-relaxed">
            <AzureTranslate text="To view tailored rotation schedules for your actual farm plots, register them in My Fields. You can also generate a single custom scenario above." />
          </p>
          <Link
            to="/fields"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#087F5B] hover:bg-[#066C4C] text-white text-xs sm:text-sm font-bold shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span><AzureTranslate text="Manage Fields" /></span>
          </Link>
        </div>
      )}

      {/* Rotation Tips */}
      <div className="bg-white rounded-2xl editorial-shadow p-5 md:p-6 flex gap-4 items-start">
        <div className="w-11 h-11 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-tertiary">lightbulb</span>
        </div>
        <div>
          <h4 className="font-headline font-bold text-on-surface mb-2"><AzureTranslate text="Rotation Tips" /></h4>
          <ul className="space-y-1.5 font-label text-sm text-on-surface-variant/60 leading-relaxed list-disc pl-5">
            <li><AzureTranslate text="Rotate cereals (rice, wheat) with legumes (gram, lentil) to restore soil nitrogen naturally" /></li>
            <li><AzureTranslate text="Avoid growing the same crop family in consecutive seasons to break pest and disease cycles" /></li>
            <li><AzureTranslate text="Include a short fallow period if your soil health indicators are declining" /></li>
            <li><AzureTranslate text="Deep-rooted crops after shallow-rooted ones help access different soil nutrient layers" /></li>
          </ul>
        </div>
      </div>

      {/* Crop color legend */}
      <div className="bg-surface-container-low rounded-2xl p-4 flex flex-wrap gap-3 items-center font-label text-xs">
        <span className="font-bold text-on-surface-variant/50 uppercase tracking-widest text-[10px]"><AzureTranslate text="Crop Colors" />:</span>
        {['Rice', 'Wheat', 'Maize', 'Cotton(lint)', 'Chickpea', 'Mustard', 'Sugarcane', 'Soyabean', 'Groundnut'].map(crop => (
          <span key={crop} className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: getCropColor(crop) }} />
            <AzureTranslate text={crop.replace('(lint)', '')} />
          </span>
        ))}
      </div>
    </div>
  )
}
