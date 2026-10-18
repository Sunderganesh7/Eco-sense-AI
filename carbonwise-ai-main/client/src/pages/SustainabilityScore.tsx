import { useMemo } from 'react';
import { useCarbonData } from '../hooks/useCarbonData';
import { PageLayout } from '../components/layout/PageLayout';
import { FeatureHero } from '../components/ui/FeatureHero';
import { SustainabilityScoreCard } from '../components/dashboard/SustainabilityScoreCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatEmissions } from '../utils/format';

export function SustainabilityScore() {
  const { latestEntry } = useCarbonData();
  const score = useMemo(() => latestEntry?.sustainabilityScore ?? 0, [latestEntry]);
  const result = latestEntry?.result;

  return (
    <PageLayout>
      <FeatureHero
        label="Global Impact"
        title="Measure Your Sustainability Impact"
        description="Get a clear 0-100 sustainability score with actionable improvement tips and see how you rank."
        imageUrl="/sustainable_city_impact.jpg"
        layout="split"
        actions={
          <Button variant="outline" className="bg-white" onClick={() => window.location.href = '/calculator'}>
            Recalculate
          </Button>
        }
      />

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 sticky top-6">
          <SustainabilityScoreCard score={score} />
        </div>

        {result && (
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Footprint Breakdown
              </h3>

              <div className="space-y-5">
                {[
                  { label: 'Transportation', value: result.transportation, color: 'bg-blue-500', max: Math.max(result.total * 0.5, result.transportation) },
                  { label: 'Energy', value: result.energy, color: 'bg-amber-500', max: Math.max(result.total * 0.5, result.energy) },
                  { label: 'Food', value: result.food, color: 'bg-emerald-500', max: Math.max(result.total * 0.5, result.food) },
                  { label: 'Lifestyle', value: result.lifestyle, color: 'bg-purple-500', max: Math.max(result.total * 0.5, result.lifestyle) }
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900">{formatEmissions(item.value)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-emerald-50/50 border-emerald-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Key Recommendations
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">1</span></div>
                  <p className="text-sm text-slate-600">Consider taking the Reduction Simulator to identify exactly which lifestyle changes will have the highest impact.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">2</span></div>
                  <p className="text-sm text-slate-600">Review your highest emission category above and chat with the AI Sustainability Coach for a personalized action plan.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><span className="text-xs font-bold">3</span></div>
                  <p className="text-sm text-slate-600">Start an Eco Challenge today to begin forming new green habits.</p>
                </li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
