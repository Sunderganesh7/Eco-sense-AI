import { useState, useMemo } from 'react'
import AzureTranslate from '../components/AzureTranslate'
import schemesData from '../data/schemes.json'

const CATEGORIES = ['All', 'Income Support', 'Insurance', 'Credit', 'Infrastructure', 'Solar', 'Market', 'Soil', 'Organic', 'Equipment', 'Sustainability']

const CATEGORY_COLORS = {
  'Income Support': 'bg-emerald-100 text-emerald-700',
  'Insurance': 'bg-blue-100 text-blue-700',
  'Credit': 'bg-amber-100 text-amber-700',
  'Infrastructure': 'bg-purple-100 text-purple-700',
  'Solar': 'bg-yellow-100 text-yellow-700',
  'Market': 'bg-cyan-100 text-cyan-700',
  'Soil': 'bg-orange-100 text-orange-700',
  'Organic': 'bg-green-100 text-green-700',
  'Equipment': 'bg-red-100 text-red-700',
  'Sustainability': 'bg-teal-100 text-teal-700',
}

export default function Schemes() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(() => {
    return schemesData.filter(s => {
      const matchCategory = selectedCategory === 'All' || s.category === selectedCategory
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [search, selectedCategory])

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* ── Forest Green Hero Banner ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#087F5B]/20 min-h-[160px] sm:min-h-[175px] flex items-center bg-[#042F25]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/hero-landscape.jpg"
            alt="Agricultural schemes background"
            className="w-full h-full object-cover object-center md:object-[center_35%]"
            loading="eager"
          />
          {/* Dual gradient overlay: horizontal on desktop, vertical on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#042F25] via-[#042F25]/90 45% via-[#042F25]/60 75% to-[#042F25]/30 hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#042F25] via-[#042F25]/95 70% to-[#042F25]/40 sm:hidden" />
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-[#9DEBC1]/10 blur-2xl pointer-events-none" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 w-full">
          <div className="flex-1 min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#063D2E]/80 border border-[#9DEBC1]/30 backdrop-blur-md mb-2.5">
              <span className="material-symbols-outlined text-[#9DEBC1] text-xs">account_balance</span>
              <span className="font-label text-[10px] font-bold text-[#9DEBC1] tracking-wider uppercase">
                <AzureTranslate text="Direct Government Portals" />
              </span>
            </div>
            <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              <AzureTranslate text="Central & State Agricultural Schemes" />
            </h1>
            <p className="font-label text-xs sm:text-sm text-[#D4E8DC] mt-2 leading-relaxed max-w-xl">
              <AzureTranslate text="Discover verified agricultural subsidies, PM-KISAN income support, crop insurance coverage, and soil health incentives with direct official portal links." />
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#063D2E]/80 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl shrink-0 self-start md:self-auto shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-[#087F5B]/50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#9DEBC1] text-xl">verified_user</span>
            </div>
            <div className="text-left md:text-right">
              <div className="font-headline font-black text-sm text-white">100% Official Links</div>
              <div className="font-label text-[10px] text-[#9DEBC1]/90 font-medium">Zero intermediary fee</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Panel ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 md:p-6 space-y-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#718078] text-xl">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search schemes by name, keyword, or subsidy type..."
            className="w-full bg-[#F7F9F7] border border-[#DDE7E1] rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium text-[#17251F] placeholder:text-[#718078]/50 focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORIES.filter(c => c === 'All' || schemesData.some(s => s.category === c)).map(cat => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#087F5B] text-white shadow-sm shadow-[#087F5B]/30'
                    : 'bg-[#F7F4EB] text-[#17251F] hover:bg-[#E7F0E8] border border-[#E3ECE6]'
                }`}
              >
                {cat === 'All' ? '🏛️ All Categories' : cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Verified Sourcing Banner ────────────────────────────────────────────── */}
      <div className="bg-[#E7F0E8]/70 border border-[#087F5B]/20 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#087F5B] text-xl mt-0.5 flex-shrink-0">
          verified
        </span>
        <div>
          <p className="font-headline font-bold text-xs md:text-sm text-[#063D2E]">
            <AzureTranslate text="Direct Official Government Portals" />
          </p>
          <p className="font-label text-xs text-[#718078] mt-0.5 leading-relaxed">
            <AzureTranslate text="All redirection buttons lead directly to verified Union and State Ministry portals (.gov.in / .nic.in). AgriSense AI never collects payment or intermediary charges." />
          </p>
        </div>
      </div>

      {/* ── Scheme Cards Grid ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E3ECE6] p-12 flex flex-col items-center justify-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <span className="material-symbols-outlined text-[#718078]/30 text-5xl mb-3">search_off</span>
          <h3 className="font-headline font-bold text-lg text-[#17251F] mb-1">
            <AzureTranslate text="No matching schemes found" />
          </h3>
          <p className="text-sm text-[#718078]">
            <AzureTranslate text="Try clearing search keywords or switching category filters" />
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(scheme => {
            const isExpanded = expandedId === scheme.id
            return (
              <div
                key={scheme.id}
                className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200"
              >
                {/* Card Header & Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F7F4EB] border border-[#E3ECE6] flex items-center justify-center text-2xl flex-shrink-0">
                        {scheme.emoji}
                      </div>
                      <div>
                        <h3 className="font-headline font-extrabold text-base text-[#17251F] leading-snug">
                          {scheme.name}
                        </h3>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_COLORS[scheme.category] || 'bg-gray-100 text-gray-700'}`}>
                          {scheme.category}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F0E8] text-[#087F5B] text-[10px] font-bold border border-[#087F5B]/20 flex-shrink-0">
                      <span className="material-symbols-outlined text-[10px]">verified</span> Official
                    </span>
                  </div>

                  <p className="text-xs text-[#718078] leading-relaxed mb-4 flex-1">
                    <AzureTranslate text={scheme.description} />
                  </p>

                  {/* Eligibility Box */}
                  <div className="bg-[#F7F4EB] border border-[#E8E4DA] rounded-2xl p-3.5 mb-3.5">
                    <div className="font-label text-[10px] font-bold text-[#063D2E] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">how_to_reg</span>
                      <AzureTranslate text="Eligibility Criteria" />
                    </div>
                    <p className="text-xs text-[#17251F]/80 leading-relaxed">
                      <AzureTranslate text={scheme.eligibility} />
                    </p>
                  </div>

                  {/* Expandable details */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : scheme.id)}
                    className="text-[#087F5B] hover:text-[#063D2E] text-xs font-bold flex items-center gap-1 transition-colors mb-3 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                    <AzureTranslate text={isExpanded ? 'Hide Details' : 'View Benefits & Required Documents'} />
                  </button>

                  {isExpanded && (
                    <div className="space-y-3.5 pt-2 border-t border-[#E3ECE6] animate-fade-in mb-4">
                      {/* Benefits */}
                      <div>
                        <div className="font-label text-[10px] font-bold text-[#718078] uppercase tracking-wider mb-1.5">
                          <AzureTranslate text="Program Benefits" />
                        </div>
                        <ul className="space-y-1">
                          {scheme.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-[#17251F]/80">
                              <span className="material-symbols-outlined text-[#087F5B] text-xs mt-0.5">
                                check_circle
                              </span>
                              <AzureTranslate text={b} />
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Documents */}
                      <div>
                        <div className="font-label text-[10px] font-bold text-[#718078] uppercase tracking-wider mb-1.5">
                          <AzureTranslate text="Required Documentation" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {scheme.documents.map((d, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F7F9F7] text-[#17251F] text-[10px] font-semibold border border-[#DDE7E1]"
                            >
                              <span className="material-symbols-outlined text-[11px] text-[#718078]">
                                description
                              </span>
                              <AzureTranslate text={d} />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 pt-0 flex gap-2 border-t border-[#E3ECE6]/50 bg-[#F7F9F7]/50 mt-auto">
                  <a
                    href={scheme.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#087F5B] hover:bg-[#063D2E] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs shadow-sm shadow-[#087F5B]/20"
                  >
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                    <AzureTranslate text="Apply on Official Portal" />
                  </a>
                  {scheme.check_status && (
                    <a
                      href={scheme.check_status}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-white hover:bg-[#E7F0E8] text-[#063D2E] border border-[#DDE7E1] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors text-xs"
                    >
                      <span className="material-symbols-outlined text-xs">fact_check</span>
                      <AzureTranslate text="Status" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="bg-[#F7F4EB] border border-[#E8E4DA] rounded-2xl p-4 font-label text-xs text-[#718078] text-center">
        <AzureTranslate text="Information sourced from official Ministry of Agriculture & Farmers Welfare repositories. Scheme terms are subject to government revision — verify details on respective official portals before application." />
      </div>
    </div>
  )
}
