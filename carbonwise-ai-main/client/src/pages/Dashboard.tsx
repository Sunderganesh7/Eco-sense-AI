import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarbonData } from '../hooks/useCarbonData';
import { EmissionBreakdown } from '../components/dashboard/EmissionBreakdown';
import { MonthlyTrend } from '../components/dashboard/MonthlyTrend';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../components/layout/PageLayout';
import { FeatureHero } from '../components/ui/FeatureHero';
import type { MonthlyData, CarbonResult } from '../types';
import { formatEmissions } from '../utils/format';


function EmptyDashboardState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100">
          <svg className="h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 className="mb-3 text-3xl font-bold text-slate-800">Your Dashboard Awaits</h1>
        <p className="mb-8 max-w-lg text-slate-500">
          Calculate your carbon footprint first to unlock personalized charts, track weekly trends, monitor your sustainability score, and get AI-powered recommendations.
        </p>
        <Button size="lg" onClick={onNavigate} aria-label="Go to calculator to calculate your carbon footprint">
          Calculate Your Footprint
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const {
    latestEntry,
    monthlyData,
  } = useCarbonData();

  const memoResult = useMemo((): CarbonResult | null =>
    latestEntry?.result ?? null, [latestEntry]);
  const memoMonthly = useMemo((): MonthlyData[] => monthlyData, [monthlyData]);

  if (!latestEntry) {
    return <EmptyDashboardState onNavigate={() => navigate('/calculator')} />;
  }

  return (
    <PageLayout>
      <FeatureHero
        label="Analytics & Progress"
        title="Track Your Sustainability Journey"
        description="Monitor your emissions, identify monthly trends, and make smarter, data-driven choices for a greener tomorrow."
        imageUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop"
        layout="split"
      />

      {/* MAIN DASHBOARD CONTENT */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key Metrics Row */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Footprint</p>
              <div className="text-3xl font-bold text-slate-800">
                {formatEmissions(memoResult!.total)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            </div>
          </div>

          <div className="bg-emerald-600 rounded-2xl border border-emerald-500 p-6 shadow-sm flex items-center justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-emerald-100 uppercase tracking-wider mb-1">Status</p>
              <div className="text-3xl font-bold text-white">
                Tracking Active
              </div>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <EmissionBreakdown result={memoResult!} />
          <MonthlyTrend data={memoMonthly} />
        </div>
      </div>
    </PageLayout>
  );
}
