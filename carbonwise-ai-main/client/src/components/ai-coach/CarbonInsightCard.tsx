import React from 'react';
import type { CarbonInput, CarbonData } from '../../types';
import { formatEmissions } from '../../utils/format';

interface CarbonInsightCardProps {
  carbonData: CarbonInput;
  carbonResult: CarbonData['result'];
}

export const CarbonInsightCard: React.FC<CarbonInsightCardProps> = ({ carbonResult }) => {
  const total = carbonResult.total;
  const breakdown = [
    { label: 'Energy', value: carbonResult.energy },
    { label: 'Transportation', value: carbonResult.transportation },
    { label: 'Food', value: carbonResult.food },
    { label: 'Lifestyle', value: carbonResult.lifestyle },
  ].sort((a, b) => b.value - a.value);

  const highest = breakdown[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgb(0,0,0,0.02)] p-5">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Your Carbon Snapshot</h4>

      <div className="mb-5 pb-5 border-b border-slate-100">
        <div className="text-3xl font-extrabold text-slate-800 mb-1">
          {formatEmissions(total)}
        </div>
        <p className="text-[13px] font-medium text-slate-500">CO₂e / month</p>
      </div>

      <div className="mb-4">
        <p className="text-[12px] font-semibold text-slate-500 mb-1">Highest impact:</p>
        <p className="text-sm font-bold text-emerald-600">
          {highest.label} — {total > 0 ? ((highest.value / total) * 100).toFixed(0) : 0}%
        </p>
      </div>

      <div className="space-y-2.5">
        {breakdown.map((item) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-[13px] text-slate-600">{item.label}</span>
              <span className="text-[13px] font-medium text-slate-800">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
