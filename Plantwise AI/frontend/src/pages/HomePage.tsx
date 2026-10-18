import React from 'react';
import {
  MapPin,
  Scale,
  Trees,
  Award,
  ArrowRight,
  Compass,
  FileCheck,
  Bot,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { ComplianceDisclaimer } from '../components/common/ComplianceDisclaimer';

interface HomePageProps {
  onNavigate: (tab: string, state?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const stats = [
    { label: 'Maharashtra Coverage', value: '36 Districts', desc: 'All 6 administrative divisions mapped with GIS profiles' },
    { label: 'Statutory Land Types', value: '13', desc: 'Codified legal rules from Tree Act to CRZ regulations' },
    { label: 'Native Tree Species', value: '20', desc: 'Taxonomy, soil compatibility, and APTI ratings' },
    { label: 'Indexed Gov Subsidies', value: '10', desc: 'State & Central free sapling and DBT programs' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Pinpoint Location & Land Use',
      description: 'Select across 36 Maharashtra districts or drop custom GPS coordinates to identify statutory zoning, CRZ status, and setback limits.',
      icon: MapPin,
    },
    {
      num: '02',
      title: 'Deterministic Legal Evaluation',
      description: 'The engine cross-checks the Maharashtra Tree Act 1975, FCA, and CRZ rules to generate a tailored document checklist and authority routing.',
      icon: Scale,
    },
    {
      num: '03',
      title: 'Ecological & Subsidy Matching',
      description: 'Receive multi-criteria rankings for indigenous tree species and match with active state/central afforestation subsidies.',
      icon: Trees,
    },
    {
      num: '04',
      title: 'Monitoring & Certification',
      description: 'Track multi-month satellite NDVI vegetation growth and issue tamper-proof Digital Plantation Certificates.',
      icon: FileCheck,
    },
  ];

  const features = [
    {
      title: 'Plantation Compliance Check',
      description: 'Evaluate any land parcel in Maharashtra for legal requirements, authority permissions, and a 0–100 suitability score.',
      action: () => onNavigate('new-check'),
      linkText: 'Start Check',
      icon: Scale,
    },
    {
      title: 'GIS Map & Zoning Explorer',
      description: 'Inspect multi-layer satellite maps, suitable planting zones, and buffer constraints across all 36 Maharashtra districts.',
      action: () => onNavigate('map-explorer'),
      linkText: 'Open Map',
      icon: Compass,
    },
    {
      title: 'Native Species Database',
      description: 'Explore 20 certified native species with soil preferences, canopy size, carbon absorption, and air pollution tolerance index (APTI).',
      action: () => onNavigate('species'),
      linkText: 'View Species',
      icon: Trees,
    },
    {
      title: 'Government Subsidies & Schemes',
      description: 'Search state and central government afforestation schemes, eligibility rules, and application procedures.',
      action: () => onNavigate('schemes'),
      linkText: 'Browse Schemes',
      icon: Award,
    },
  ];

  return (
    <div className="py-10 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-12">
      {/* Hero Section */}
      <section className="space-y-6 pt-2">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 text-xs font-medium border border-forest-200/80 dark:border-forest-800/60">
            <span>Maharashtra Smart Tree Plantation Planning & Legal Compliance</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee] leading-tight font-sans">
            GIS-Based Tree Plantation Planning & Regulatory Compliance
          </h1>

          <p className="text-sm sm:text-base text-[#506154] dark:text-[#97a69b] leading-relaxed">
            Automated statutory evaluation under the <strong>Maharashtra Tree Act 1975</strong>, <strong>Forest Conservation Act</strong>, and <strong>CRZ Regulations</strong>. Generate authority checklists, match indigenous flora across all 36 districts, and monitor vegetation growth.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('new-check')}
              className="px-4 py-2.5 rounded-lg bg-forest-700 hover:bg-forest-800 dark:bg-forest-600 dark:hover:bg-forest-500 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-subtle"
            >
              <span>Run Plantation Check</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('map-explorer')}
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-[#141a15] text-forest-900 dark:text-forest-100 border border-[#e2e8e2] dark:border-[#232f25] hover:bg-forest-50/50 dark:hover:bg-forest-950/30 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Explore 36 Districts Map
            </button>
          </div>
        </div>
      </section>

      {/* Regulatory Notice */}
      <ComplianceDisclaimer />

      {/* Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((st, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-1"
          >
            <span className="text-2xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee] font-sans block">
              {st.value}
            </span>
            <span className="text-xs font-semibold text-forest-800 dark:text-forest-300 block">
              {st.label}
            </span>
            <p className="text-[11px] text-[#506154] dark:text-[#97a69b] leading-normal">
              {st.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Process Section */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#131f16] dark:text-[#edf3ee]">
            How the System Works
          </h2>
          <p className="text-xs text-[#506154] dark:text-[#97a69b]">
            A structured workflow from spatial parcel selection to statutory checklists and verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-forest-700 dark:text-forest-400">
                      {s.num}
                    </span>
                    <Icon className="w-4 h-4 text-forest-700 dark:text-forest-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#131f16] dark:text-[#edf3ee]">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#506154] dark:text-[#97a69b] leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[#131f16] dark:text-[#edf3ee]">
            Core Modules
          </h2>
          <p className="text-xs text-[#506154] dark:text-[#97a69b]">
            Integrated tools for legal analysis, spatial mapping, and ecological assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] flex flex-col justify-between space-y-4 hover:border-forest-300 dark:hover:border-forest-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-forest-50 dark:bg-forest-950/60 flex items-center justify-center text-forest-700 dark:text-forest-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#131f16] dark:text-[#edf3ee]">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#506154] dark:text-[#97a69b] leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#e2e8e2] dark:border-[#232f25]">
                  <button
                    onClick={feat.action}
                    className="text-xs font-semibold text-forest-800 dark:text-forest-300 hover:text-forest-900 dark:hover:text-forest-100 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{feat.linkText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
