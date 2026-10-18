import AzureTranslate from '../components/AzureTranslate'

const FEATURES = [
  { icon: 'money_off', title: '0% Interest', desc: 'No interest charged to farmers', color: 'bg-emerald-100 text-emerald-700' },
  { icon: 'smartphone', title: 'Easy Apply', desc: 'Simple mobile-first application', color: 'bg-blue-100 text-blue-700' },
  { icon: 'grass', title: 'Farm Essentials', desc: 'Seeds, fertilizer, sprays & tools', color: 'bg-amber-100 text-amber-700' },
  { icon: 'bolt', title: 'Quick Processing', desc: 'Fast approval, minimal paperwork', color: 'bg-purple-100 text-purple-700' },
]

const PURPOSES = [
  { emoji: '🌾', label: 'Seeds', amount: '₹1,000–₹5,000' },
  { emoji: '🧪', label: 'Fertilizer', amount: '₹2,000–₹10,000' },
  { emoji: '💊', label: 'Pesticides', amount: '₹1,000–₹8,000' },
  { emoji: '🔧', label: 'Small Equipment', amount: '₹5,000–₹25,000' },
]

export default function Loans() {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* ── Forest Green Hero Card ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#087F5B]/20 bg-[#042F25] text-white p-8 md:p-10 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#042F25] via-[#063D2E] to-[#087F5B]/85" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9DEBC1]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#9DEBC1]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#9DEBC1]/20 border border-[#9DEBC1]/30 backdrop-blur-md text-xs font-bold text-[#9DEBC1] mb-4">
            <span className="material-symbols-outlined text-xs">schedule</span>
            <AzureTranslate text="PILOT PROGRAM · COMING SOON" />
          </div>

          <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight mb-2">
            <AzureTranslate text="0% Interest Farmer Micro-Loans" />
          </h1>
          <p className="text-white/80 text-xs md:text-sm leading-relaxed mb-6 max-w-lg mx-auto">
            <AzureTranslate text="Emergency micro-credit directly to verified farmer bank accounts for essential agricultural inputs. Zero hidden fees, zero compound interest." />
          </p>

          <div className="flex items-center justify-center gap-6 max-w-md mx-auto bg-white/10 backdrop-blur-md border border-white/15 px-6 py-4 rounded-2xl">
            <div className="text-left">
              <div className="font-headline font-extrabold text-2xl text-white">₹1,000</div>
              <div className="text-[#9DEBC1] text-[10px] uppercase font-bold tracking-wider"><AzureTranslate text="Minimum" /></div>
            </div>
            <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-4/5 bg-gradient-to-r from-[#9DEBC1] to-[#087F5B] rounded-full" />
            </div>
            <div className="text-right">
              <div className="font-headline font-extrabold text-2xl text-white">₹25,000</div>
              <div className="text-[#9DEBC1] text-[10px] uppercase font-bold tracking-wider"><AzureTranslate text="Maximum" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feature Highlights Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#E3ECE6] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-start gap-2.5"
          >
            <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
              <span className="material-symbols-outlined text-lg">{f.icon}</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-[#17251F]"><AzureTranslate text={f.title} /></h4>
              <p className="font-label text-xs text-[#718078] mt-0.5 leading-relaxed"><AzureTranslate text={f.desc} /></p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Eligible Micro-Credit Purposes ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 bg-[#F7F4EB] border-b border-[#E3ECE6] flex items-center justify-between">
          <h3 className="font-headline font-bold text-sm text-[#17251F] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#087F5B] text-base">category</span>
            <AzureTranslate text="Eligible Input Categories" />
          </h3>
          <span className="text-[10px] font-bold text-[#718078] uppercase">Direct Merchant Disbursal</span>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PURPOSES.map((p, i) => (
            <div
              key={i}
              className="bg-[#F7F9F7] border border-[#E3ECE6] rounded-2xl p-4 text-center hover:border-[#087F5B]/30 transition-all"
            >
              <span className="text-3xl block mb-2">{p.emoji}</span>
              <div className="font-headline font-bold text-sm text-[#17251F]">
                <AzureTranslate text={p.label} />
              </div>
              <div className="font-label text-xs text-[#087F5B] font-bold mt-1.5 px-2 py-0.5 rounded-full bg-[#E7F0E8] inline-block">
                {p.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4-Step Application Flow ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 bg-[#042F25] text-white">
          <h3 className="font-headline font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[#9DEBC1] text-base">route</span>
            <AzureTranslate text="Streamlined 4-Step Disbursal Process" />
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {[
              { step: '01', icon: 'badge', title: 'Aadhaar e-KYC', desc: 'Instant farmer verification via digital UIDAI check' },
              { step: '02', icon: 'currency_rupee', title: 'Input Amount', desc: 'Select exact micro-credit needed (₹1K–₹25K)' },
              { step: '03', icon: 'verified', title: 'Instant Score', desc: 'Automated agro-telemetry approval engine' },
              { step: '04', icon: 'account_balance', title: 'Direct DBT', desc: 'Transferred immediately to verified bank account' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-start gap-2 relative">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E7F0E8] text-[#087F5B] font-bold flex items-center justify-center text-xs">
                    {s.step}
                  </div>
                  <span className="material-symbols-outlined text-[#718078] text-lg">{s.icon}</span>
                </div>
                <h4 className="font-headline font-bold text-sm text-[#17251F] mt-1">
                  <AzureTranslate text={s.title} />
                </h4>
                <p className="font-label text-xs text-[#718078] leading-relaxed">
                  <AzureTranslate text={s.desc} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Launching Soon Banner ────────────────────────────────────────────── */}
      <div className="bg-[#F7F4EB] border border-[#E8E4DA] rounded-3xl p-6 md:p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#E7F0E8] text-[#087F5B] flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-2xl">notifications_active</span>
        </div>
        <h3 className="font-headline font-extrabold text-lg md:text-xl text-[#17251F] mb-1.5">
          <AzureTranslate text="Micro-Credit System in Pilot Testing" />
        </h3>
        <p className="text-xs md:text-sm text-[#718078] max-w-md mx-auto mb-5 leading-relaxed">
          <AzureTranslate text="We are actively integrating with partner cooperative rural banks and NABARD-certified financial intermediaries. Notification registration is open." />
        </p>
        <button
          disabled
          className="px-6 py-3 bg-[#087F5B]/30 text-white font-bold rounded-xl flex items-center justify-center gap-2 mx-auto cursor-not-allowed text-xs"
        >
          <span className="material-symbols-outlined text-sm">lock</span>
          <AzureTranslate text="Apply for Pilot Access — Opening Soon" />
        </button>
        <p className="font-label text-[10px] text-[#718078]/60 mt-2.5">
          <AzureTranslate text="Complies with RBI Master Directions on digital lending and farmer protection standards." />
        </p>
      </div>

      {/* ── Trust & Security Section ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E3ECE6] shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#E7F0E8] text-[#087F5B] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-xl">shield</span>
        </div>
        <div>
          <h4 className="font-headline font-bold text-sm text-[#17251F] mb-1">
            <AzureTranslate text="Zero-Exploitation Guarantee" />
          </h4>
          <ul className="space-y-1 font-label text-xs text-[#718078] leading-relaxed list-disc pl-4">
            <li><AzureTranslate text="Zero compound interest — the farmer never pays back more than the principal amount." /></li>
            <li><AzureTranslate text="Financing costs subsidized via state agricultural partner programs and CSR green-credit pools." /></li>
            <li><AzureTranslate text="Transparent terms with zero hidden processing charges or late fee escalations." /></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
