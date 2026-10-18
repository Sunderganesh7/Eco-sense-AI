import { useState, useEffect } from 'react'
import { predictYield, getMarketPrices, getYieldDistricts, getStates } from '../services/api'
import { useLocation } from '../contexts/LocationContext'
import AzureTranslate from '../components/AzureTranslate'

const CROPS = [
  'Rice', 'Wheat', 'Maize', 'Cotton(lint)', 'Sugarcane', 'Soyabean',
  'Potato', 'Groundnut', 'Gram', 'Bajra', 'Jowar', 'Barley',
  'Onion', 'Banana', 'Coconut', 'Urad', 'Moong(Green Gram)',
  'Rapeseed & Mustard', 'Sunflower', 'Sesamum',
]

const SEASONS = ['Kharif', 'Rabi', 'Whole Year', 'Summer', 'Autumn', 'Winter']

// Estimated cost per hectare in INR — simplified reference
const COST_PER_HA = {
  'rice': 45000, 'wheat': 35000, 'maize': 30000, 'cotton(lint)': 55000,
  'sugarcane': 80000, 'soyabean': 28000, 'potato': 90000, 'groundnut': 40000,
  'gram': 25000, 'bajra': 22000, 'jowar': 22000, 'barley': 28000,
  'onion': 75000, 'banana': 120000, 'coconut': 60000, 'urad': 25000,
  'moong(green gram)': 25000, 'rapeseed & mustard': 30000, 'sunflower': 32000,
  'sesamum': 28000,
}

function getCostPerHa(crop) {
  return COST_PER_HA[crop.toLowerCase()] || 35000
}

function formatINR(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${Math.round(amount)}`
}

export default function ProfitPlanner() {
  const { state: detectedState, city: detectedCity } = useLocation()
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [form, setForm] = useState({
    crop: 'Wheat', state: '', district: '', season: 'Rabi', area_ha: 5, year: 2026,
  })
  const [result, setResult] = useState(null)
  const [comparison, setComparison] = useState([])
  const [loading, setLoading] = useState(false)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStates().then(d => setStates(d.states || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (detectedState && !form.state) setForm(f => ({ ...f, state: detectedState }))
  }, [detectedState])

  useEffect(() => {
    if (!form.state) { setDistricts([]); return }
    getYieldDistricts(form.state).then(d => {
      const dists = d.districts || []
      setDistricts(dists)
      if (dists.length > 0) {
        const cityUpper = (detectedCity || '').toUpperCase()
        const match = dists.find(x => x.toUpperCase() === cityUpper)
        setForm(f => ({ ...f, district: match || dists[0] }))
      }
    }).catch(() => setDistricts([]))
  }, [form.state, detectedCity])

  async function calculateProfit() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const [yieldData, priceData] = await Promise.all([
        predictYield({
          state: form.state, district: form.district, crop: form.crop,
          season: form.season, area_ha: form.area_ha, year: form.year,
        }),
        getMarketPrices(form.crop, form.state, '', '', 90),
      ])

      const yieldPerHa = yieldData.predicted_yield_tonnes_per_ha || 0
      const totalProduction = yieldData.predicted_total_tonnes || 0
      const pricePerQuintal = priceData.latest_price || priceData.average_price || 2000

      // 1 tonne = 10 quintals
      const totalQuintals = totalProduction * 10
      const revenue = totalQuintals * pricePerQuintal
      const costPerHa = getCostPerHa(form.crop)
      const totalCost = costPerHa * form.area_ha
      const profit = revenue - totalCost
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0

      setResult({
        crop: form.crop,
        yieldPerHa: yieldPerHa.toFixed(2),
        totalProduction: totalProduction.toFixed(2),
        totalQuintals: totalQuintals.toFixed(1),
        pricePerQuintal: Math.round(pricePerQuintal),
        priceTrend: priceData.trend || 'stable',
        revenue: Math.round(revenue),
        totalCost: Math.round(totalCost),
        costPerHa,
        profit: Math.round(profit),
        margin: margin.toFixed(1),
        area: form.area_ha,
        state: form.state,
        district: form.district,
        season: form.season,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function compareTopCrops() {
    if (!result) return
    setComparisonLoading(true)
    const otherCrops = ['Rice', 'Wheat', 'Maize', 'Soyabean', 'Gram', 'Groundnut']
      .filter(c => c !== form.crop)
      .slice(0, 3)

    const results = []
    for (const crop of otherCrops) {
      try {
        const [y, p] = await Promise.all([
          predictYield({ state: form.state, district: form.district, crop, season: form.season, area_ha: form.area_ha, year: form.year }),
          getMarketPrices(crop, form.state, '', '', 90),
        ])
        const totalProd = y.predicted_total_tonnes || 0
        const price = p.latest_price || p.average_price || 2000
        const rev = totalProd * 10 * price
        const cost = getCostPerHa(crop) * form.area_ha
        results.push({
          crop, yield: (y.predicted_yield_tonnes_per_ha || 0).toFixed(2),
          price: Math.round(price), revenue: Math.round(rev), cost: Math.round(cost),
          profit: Math.round(rev - cost), margin: rev > 0 ? ((rev - cost) / rev * 100).toFixed(1) : '0',
        })
      } catch {
        // skip failed crops
      }
    }
    // Add current crop
    results.unshift({
      crop: result.crop, yield: result.yieldPerHa, price: result.pricePerQuintal,
      revenue: result.revenue, cost: result.totalCost, profit: result.profit,
      margin: result.margin, isCurrent: true,
    })
    results.sort((a, b) => b.profit - a.profit)
    setComparison(results)
    setComparisonLoading(false)
  }

  const inputClass = "w-full bg-[#F7F9F7] border border-[#DDE7E1] rounded-xl px-4 py-3 text-sm font-medium text-[#17251F] focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] focus:outline-none transition-all placeholder:text-[#718078]/50"
  const profitPositive = result && result.profit >= 0

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Forest Green Hero Banner ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#087F5B]/20 min-h-[160px] sm:min-h-[175px] flex items-center bg-[#042F25]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/profit-planner-banner.jpg"
            alt="Agricultural harvest and profit planning"
            className="w-full h-full object-cover object-center md:object-[center_35%]"
            loading="eager"
          />
          {/* Dual gradient overlay: horizontal on desktop, vertical on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042F25] via-[#042F25]/90 45% via-[#042F25]/60 75% to-[#042F25]/30 hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042F25] via-[#042F25]/95 70% to-[#042F25]/40 sm:hidden" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 w-full">
          <div className="flex-1 min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063D2E]/80 border border-[#9DEBC1]/30 backdrop-blur-md mb-2.5">
              <span className="material-symbols-outlined text-[#9DEBC1] text-xs">payments</span>
              <span className="font-label text-[10px] font-bold text-[#9DEBC1] tracking-wider uppercase">
                <AzureTranslate text="Agro-Economic Intelligence" />
              </span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              <AzureTranslate text="Profit & Revenue Planner" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-xl">
              <AzureTranslate text="Calculate net profit margins, projected gross revenue, and operational cultivation costs across crops based on live Agmarknet mandi trends and ML yield forecasts." />
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#063D2E]/80 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl shrink-0 self-start md:self-auto shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#087F5B]/50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#9DEBC1] text-xl">trending_up</span>
            </div>
            <div className="text-left md:text-right">
              <div className="font-headline font-black text-sm text-white">ROI Optimization</div>
              <div className="font-label text-[10px] text-[#9DEBC1]/90 font-medium">Yield × Mandi - Cultivation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Input Form (5 cols) ──────────────────────────────────────────────── */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 bg-[#F7F4EB] border-b border-[#E3ECE6] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#042F25] text-[#9DEBC1] flex items-center justify-center">
                <span className="material-symbols-outlined text-base">calculate</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-sm text-[#17251F]">
                  <AzureTranslate text="Plan Parameters" />
                </h3>
                <p className="text-[11px] text-[#718078]">Enter parcel and crop metrics</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E7F0E8] text-[#063D2E] border border-[#087F5B]/20">
              <AzureTranslate text="Live Mandi + ML" />
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="Crop" />
                </label>
                <select
                  className={inputClass}
                  value={form.crop}
                  onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}
                >
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="Season" />
                </label>
                <select
                  className={inputClass}
                  value={form.season}
                  onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
                >
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="State" />
                </label>
                <select
                  className={inputClass}
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                >
                  <option value="">Select State</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="District" />
                </label>
                <select
                  className={inputClass}
                  value={form.district}
                  onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                >
                  {districts.length > 0 ? (
                    districts.map(d => <option key={d} value={d}>{d}</option>)
                  ) : (
                    <option value="">Select state first</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="Area (Hectares)" />
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.area_ha}
                  step="0.5"
                  min="0.1"
                  onChange={e => setForm(f => ({ ...f, area_ha: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-label text-[11px] font-bold text-[#17251F] uppercase tracking-wider">
                  <AzureTranslate text="Harvest Year" />
                </label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.year}
                  min="2020"
                  max="2030"
                  onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2026 }))}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={calculateProfit}
                disabled={loading || !form.state || !form.district}
                className="w-full py-3.5 bg-[#087F5B] hover:bg-[#063D2E] text-white font-bold rounded-2xl shadow-md shadow-[#087F5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">{loading ? 'hourglass_empty' : 'payments'}</span>
                <span>{loading ? <AzureTranslate text="Analyzing Economics..." /> : <AzureTranslate text="Calculate Profit & Revenue" />}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Results (7 cols) ──────────────────────────────────────────────── */}
        <div className="lg:col-span-7">
          {error && (
            <div className="bg-[#C94040]/10 border border-[#C94040]/20 text-[#C94040] p-4 rounded-2xl flex items-center gap-2.5 mb-4 animate-fade-in text-sm font-medium">
              <span className="material-symbols-outlined text-lg">error</span>
              <AzureTranslate text={error} />
            </div>
          )}

          {!result && !loading && (
            <div className="bg-white rounded-3xl border border-[#E3ECE6] p-10 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="w-16 h-16 rounded-2xl bg-[#E7F0E8] text-[#087F5B] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">currency_rupee</span>
              </div>
              <h3 className="font-headline font-bold text-lg text-[#17251F] mb-1.5">
                <AzureTranslate text="Agricultural Economic Projection" />
              </h3>
              <p className="text-sm text-[#718078] max-w-md leading-relaxed">
                <AzureTranslate text="Select your target crop, parcel acreage, and location to estimate net profit, expected production quintals, and comparative returns." />
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-3xl border border-[#E3ECE6] p-12 flex flex-col items-center justify-center gap-3 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="w-10 h-10 border-3 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
              <span className="font-label text-sm text-[#17251F] font-semibold">
                <AzureTranslate text="Fetching Agmarknet prices & computing yield models..." />
              </span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 animate-fade-in-up">
              {/* Profit Hero Card */}
              <div
                className={`rounded-3xl p-6 text-white shadow-lg border relative overflow-hidden ${
                  profitPositive
                    ? 'bg-gradient-to-br from-[#042F25] via-[#063D2E] to-[#087F5B] border-[#9DEBC1]/30'
                    : 'bg-gradient-to-br from-[#8A2424] to-[#C94040] border-red-300/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="font-label text-xs uppercase tracking-widest text-[#9DEBC1] font-bold mb-1">
                      <AzureTranslate text="Estimated Net Profit" />
                    </div>
                    <div className="font-headline font-extrabold text-4xl md:text-5xl tracking-tight">
                      {profitPositive ? '' : '-'}{formatINR(Math.abs(result.profit))}
                    </div>
                    <div className="mt-2 font-label text-xs text-white/80">
                      <AzureTranslate text={`${result.crop} · ${result.area} ha · ${result.season} · ${result.district}, ${result.state}`} />
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20">
                      <span className="material-symbols-outlined text-xs">
                        {profitPositive ? 'trending_up' : 'trending_down'}
                      </span>
                      {result.margin}% <AzureTranslate text="Net Margin" />
                    </span>
                    <span className="text-[11px] text-white/70">
                      Est. Total Production: {result.totalProduction} Tonnes
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl border border-[#E3ECE6] p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="font-label text-[10px] font-bold uppercase text-[#718078] mb-1">
                    <AzureTranslate text="Gross Revenue" />
                  </div>
                  <div className="font-headline font-black text-lg text-[#087F5B]">
                    {formatINR(result.revenue)}
                  </div>
                  <div className="font-label text-[10px] text-[#718078] mt-0.5">
                    {result.totalQuintals}Q × ₹{result.pricePerQuintal}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E3ECE6] p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="font-label text-[10px] font-bold uppercase text-[#718078] mb-1">
                    <AzureTranslate text="Total Cost" />
                  </div>
                  <div className="font-headline font-black text-lg text-[#C94040]">
                    {formatINR(result.totalCost)}
                  </div>
                  <div className="font-label text-[10px] text-[#718078] mt-0.5">
                    ₹{result.costPerHa.toLocaleString()}/ha
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E3ECE6] p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="font-label text-[10px] font-bold uppercase text-[#718078] mb-1">
                    <AzureTranslate text="Yield Output" />
                  </div>
                  <div className="font-headline font-black text-lg text-[#17251F]">
                    {result.yieldPerHa} <span className="text-xs font-normal">T/ha</span>
                  </div>
                  <div className="font-label text-[10px] text-[#718078] mt-0.5">
                    {result.totalProduction}T total
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E3ECE6] p-4 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                  <div className="font-label text-[10px] font-bold uppercase text-[#718078] mb-1">
                    <AzureTranslate text="Market Price" />
                  </div>
                  <div className="font-headline font-black text-lg text-[#17251F]">
                    ₹{result.pricePerQuintal.toLocaleString()}
                  </div>
                  <div className="font-label text-[10px] text-[#718078] mt-0.5 flex items-center justify-center gap-1">
                    <span className={`material-symbols-outlined text-[11px] ${result.priceTrend === 'up' ? 'text-[#087F5B]' : 'text-[#C94040]'}`}>
                      {result.priceTrend === 'up' ? 'trending_up' : 'trending_down'}
                    </span>
                    <span className="capitalize">{result.priceTrend}</span>
                  </div>
                </div>
              </div>

              {/* Compare Button */}
              <button
                onClick={compareTopCrops}
                disabled={comparisonLoading}
                className="w-full py-3 bg-[#F7F4EB] hover:bg-[#E7F0E8] text-[#063D2E] border border-[#DDE7E1] font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer text-sm"
              >
                <span className="material-symbols-outlined text-base">{comparisonLoading ? 'hourglass_empty' : 'compare_arrows'}</span>
                <span>{comparisonLoading ? <AzureTranslate text="Simulating alternatives..." /> : <AzureTranslate text="Compare ROI with Other Regional Crops" />}</span>
              </button>

              {/* Comparison Table */}
              {comparison.length > 0 && (
                <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-in-up">
                  <div className="px-5 py-3.5 bg-[#042F25] text-white flex items-center justify-between">
                    <h3 className="font-headline font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#9DEBC1] text-base">leaderboard</span>
                      <AzureTranslate text="Regional Crop Profit Comparison" />
                    </h3>
                    <span className="text-[10px] text-[#9DEBC1]">Sorted by Net Margin</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#E3ECE6] bg-[#F7F9F7] text-[#718078] font-label uppercase tracking-wider text-[10px]">
                          <th className="text-left py-2.5 px-4"><AzureTranslate text="Crop" /></th>
                          <th className="text-right py-2.5 px-4"><AzureTranslate text="Yield" /></th>
                          <th className="text-right py-2.5 px-4"><AzureTranslate text="Mandi Price" /></th>
                          <th className="text-right py-2.5 px-4"><AzureTranslate text="Net Profit" /></th>
                          <th className="text-right py-2.5 px-4"><AzureTranslate text="Margin" /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3ECE6]">
                        {comparison.map((c, i) => (
                          <tr
                            key={i}
                            className={`transition-colors ${
                              c.isCurrent ? 'bg-[#9DEBC1]/10 font-bold' : 'hover:bg-[#F7F9F7]'
                            }`}
                          >
                            <td className="py-3 px-4 font-headline font-bold text-[#17251F] flex items-center gap-2">
                              {i === 0 && <span className="material-symbols-outlined text-[#B7791F] text-sm">emoji_events</span>}
                              <AzureTranslate text={c.crop} />
                              {c.isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#087F5B] text-white">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-[#718078]">{c.yield} T/ha</td>
                            <td className="py-3 px-4 text-right text-[#718078]">₹{c.price.toLocaleString()}</td>
                            <td className={`py-3 px-4 text-right font-black ${c.profit >= 0 ? 'text-[#087F5B]' : 'text-[#C94040]'}`}>
                              {formatINR(c.profit)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#17251F]">{c.margin}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Visual Bars */}
                  <div className="p-5 space-y-2.5 bg-[#F7F9F7] border-t border-[#E3ECE6]">
                    <div className="text-[10px] font-bold text-[#718078] uppercase tracking-wider mb-1">
                      Relative Profit Breakdown
                    </div>
                    {comparison.map((c, i) => {
                      const maxProfit = Math.max(...comparison.map(x => Math.abs(x.profit)), 1)
                      const pct = Math.abs(c.profit) / maxProfit * 100
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="font-label text-xs w-24 truncate font-semibold text-[#17251F]">
                            <AzureTranslate text={c.crop} />
                          </span>
                          <div className="flex-1 h-3.5 bg-[#E3ECE6] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                c.profit >= 0 ? 'bg-gradient-to-r from-[#087F5B] to-[#9DEBC1]' : 'bg-[#C94040]'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`font-label text-xs w-20 text-right font-bold ${c.profit >= 0 ? 'text-[#087F5B]' : 'text-[#C94040]'}`}>
                            {formatINR(c.profit)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-[#F7F4EB] border border-[#E8E4DA] rounded-2xl p-4 font-label text-xs text-[#718078] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#B7791F] text-base flex-shrink-0 mt-0.5">info</span>
                <div>
                  <strong className="text-[#17251F]"><AzureTranslate text="Economic Advisory Notice" />:</strong>{' '}
                  <AzureTranslate text="Profit estimations utilize ML yield predictions cross-referenced with Agmarknet historical mandi spot prices. Operational inputs and cultivation costs reflect standard ICAR regional benchmarks." />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
