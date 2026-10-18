import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, X } from 'lucide-react';
import { api } from '../services/api';
import type { SchemeItem } from '../types';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';

export const SchemesPage: React.FC = () => {
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [applicantFilter, setApplicantFilter] = useState<string>('All');
  const [purposeFilter, setPurposeFilter] = useState<string>('All');
  const [sponsorFilter, setSponsorFilter] = useState<string>('All');
  const [selectedScheme, setSelectedScheme] = useState<SchemeItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const data = await api.getSchemes({
          search: search || undefined,
          applicant_type: applicantFilter !== 'All' ? applicantFilter : undefined,
          purpose: purposeFilter !== 'All' ? purposeFilter : undefined,
          sponsor_level: sponsorFilter !== 'All' ? sponsorFilter : undefined,
        });
        setSchemes(data);
      } catch (err) {
        console.error('Failed to fetch schemes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, [search, applicantFilter, purposeFilter, sponsorFilter]);

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee]">
          Government Afforestation Schemes & Subsidies
        </h1>
        <p className="text-xs text-[#506154] dark:text-[#97a69b] mt-0.5">
          Directory of Central, State (Maharashtra), and Municipal sapling subsidy programs.
        </p>
      </div>

      <ComplianceDisclaimer compact />

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#728477] dark:text-[#6e7d72]" />
            <input
              type="text"
              placeholder="Search scheme name, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg pl-8 pr-3 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={applicantFilter}
              onChange={(e) => setApplicantFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">All Applicants</option>
              <option value="Farmer">Farmer / Individual</option>
              <option value="NGO">NGO / Society</option>
              <option value="School">School / Campus</option>
              <option value="Gram Panchayat">Gram Panchayat</option>
              <option value="Corporate">Corporate / CSR</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={purposeFilter}
              onChange={(e) => setPurposeFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">All Purposes</option>
              <option value="Agroforestry">Agroforestry & Farm</option>
              <option value="Urban Greening">Urban Greening</option>
              <option value="Reforestation">Reforestation</option>
              <option value="Coastal">Coastal & Mangrove</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={sponsorFilter}
              onChange={(e) => setSponsorFilter(e.target.value)}
              className="w-full bg-stone-50 dark:bg-[#19221b] border border-[#e2e8e2] dark:border-[#232f25] rounded-lg px-2.5 py-2 text-xs text-[#131f16] dark:text-[#edf3ee] focus:outline-none focus:border-forest-600 cursor-pointer"
            >
              <option value="All">All Sponsors</option>
              <option value="Central">Central Govt</option>
              <option value="State">State (Maha)</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schemes.map((sc) => (
          <div
            key={sc.id}
            onClick={() => setSelectedScheme(sc)}
            className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] flex flex-col justify-between hover:border-forest-300 dark:hover:border-forest-700 cursor-pointer transition-colors space-y-3"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-forest-50 dark:bg-forest-950 text-forest-800 dark:text-forest-300 border border-forest-200/60">
                  {sc.sponsor_level}
                </span>
                {sc.free_saplings_provided && (
                  <span className="text-[10px] font-semibold text-forest-700 dark:text-forest-400 bg-forest-50/80 dark:bg-forest-950/80 px-2 py-0.5 rounded border border-forest-200/60">
                    Free Saplings
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-sm text-[#131f16] dark:text-[#edf3ee] leading-tight">
                {sc.name}
              </h3>

              <p className="text-xs text-[#506154] dark:text-[#97a69b] line-clamp-2 leading-relaxed">
                {sc.summary}
              </p>

              <div className="p-3 rounded-lg bg-stone-50 dark:bg-[#19221b] text-xs">
                <span className="text-[11px] text-forest-800 dark:text-forest-400 block mb-0.5 font-medium">Incentive:</span>
                <p className="text-[#131f16] dark:text-[#edf3ee] line-clamp-2 leading-normal">
                  {sc.financial_incentive}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e2e8e2] dark:border-[#232f25] flex items-center justify-between text-xs text-[#728477] dark:text-[#6e7d72]">
              <span>Verified: {sc.last_verified}</span>
              <span className="font-medium text-forest-700 dark:text-forest-400 hover:text-forest-900">
                View Details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141a15] max-w-xl w-full rounded-2xl p-6 shadow-xl border border-[#e2e8e2] dark:border-[#232f25] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs text-forest-700 dark:text-forest-400 font-medium">
                  {selectedScheme.sponsor_level} • {selectedScheme.category}
                </span>
                <h2 className="text-lg font-bold text-[#131f16] dark:text-[#edf3ee] mt-0.5">
                  {selectedScheme.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedScheme(null)}
                className="p-1 rounded-lg text-[#728477] hover:text-[#131f16] dark:hover:text-[#edf3ee] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#19221b] text-xs text-[#131f16] dark:text-[#edf3ee] leading-relaxed">
              <strong className="block mb-0.5 text-forest-800 dark:text-forest-300 font-semibold">Benefit Summary</strong>
              {selectedScheme.financial_incentive}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-semibold text-[#131f16] dark:text-[#edf3ee] mb-0.5">Eligibility Criteria</h4>
                <p className="text-[#506154] dark:text-[#97a69b] leading-relaxed">
                  {selectedScheme.eligibility_criteria}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#131f16] dark:text-[#edf3ee] mb-1">Required Documents</h4>
                <ul className="list-disc list-inside space-y-0.5 text-[#506154] dark:text-[#97a69b]">
                  {selectedScheme.required_documents.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[#131f16] dark:text-[#edf3ee] mb-0.5">Nodal Authority</h4>
                <p className="text-[#506154] dark:text-[#97a69b]">{selectedScheme.application_authority}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e2e8e2] dark:border-[#232f25] flex items-center justify-between">
              <span className="text-[11px] text-[#728477] dark:text-[#6e7d72]">Verified: {selectedScheme.last_verified}</span>
              <a
                href={selectedScheme.application_portal_url}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-subtle"
              >
                <span>Official Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
