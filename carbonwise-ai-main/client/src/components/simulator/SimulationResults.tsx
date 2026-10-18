import { memo } from 'react';
import type { CarbonResult } from '../../types';
import { formatEmissions } from '../../utils/format';

interface SimulationResultsProps {
  currentResult: CarbonResult;
  savings: CarbonResult | null;
  savingsPercentage: number;
}

export const SimulationResults = memo(function SimulationResults({
  currentResult,
  savings,
  savingsPercentage,
}: SimulationResultsProps) {
  const originalTotal = currentResult.total + (savings?.total || 0);
  
  // Prevent division by zero
  const simPercentage = originalTotal > 0 ? Math.max(5, Math.min(100, (currentResult.total / originalTotal) * 100)) : 100;

  return (
    <div className="bg-[#0f172a] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-bold tracking-tight text-white">
            Your Impact
          </h3>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>

        <div className="space-y-8 mb-10">
          {/* CURRENT */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-slate-400 text-sm font-semibold tracking-wide uppercase">Current Footprint</span>
              <span className="text-slate-300 font-medium">{formatEmissions(originalTotal)}</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-4 overflow-hidden shadow-inner">
              <div className="bg-slate-500 h-full rounded-full w-full" />
            </div>
          </div>

          {/* SIMULATED */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <span className="text-white text-sm font-bold tracking-wide uppercase">Simulated</span>
              <span className={`font-bold ${savings && savings.total < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatEmissions(currentResult.total)}
              </span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${savings && savings.total < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                style={{ width: `${simPercentage}%` }} 
              />
            </div>
          </div>
        </div>

        {/* REDUCTION CARD */}
        {savings && savings.total > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm">
            <p className="text-emerald-400 font-bold text-sm mb-2 tracking-wide uppercase">Potential Reduction</p>
            <div className="text-5xl sm:text-6xl font-extrabold text-white mb-3 tracking-tighter">
              -{savingsPercentage}%
            </div>
            <p className="text-emerald-300/90 font-medium text-lg">{formatEmissions(savings.total)} CO₂ saved</p>
          </div>
        )}

        {savings && savings.total < 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm">
            <p className="text-rose-400 font-bold text-sm mb-2 tracking-wide uppercase">Emissions Increased</p>
            <div className="text-5xl sm:text-6xl font-extrabold text-white mb-3 tracking-tighter">
              +{Math.abs(savingsPercentage)}%
            </div>
            <p className="text-rose-300/90 font-medium text-lg">{formatEmissions(Math.abs(savings.total))} CO₂ added</p>
          </div>
        )}

        {(!savings || savings.total === 0) && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-sm">
            <p className="text-slate-400 font-bold text-sm mb-2 tracking-wide uppercase">Simulation Active</p>
            <div className="text-3xl font-bold text-slate-300 mb-2 tracking-tight">
              Adjust sliders
            </div>
            <p className="text-slate-500 font-medium">to see your impact</p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Transportation
            </span>
            <span className="text-sm font-bold text-slate-200">
              {formatEmissions(currentResult.transportation)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" /> Energy
            </span>
            <span className="text-sm font-bold text-slate-200">
              {formatEmissions(currentResult.energy)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> Food
            </span>
            <span className="text-sm font-bold text-slate-200">
              {formatEmissions(currentResult.food)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" /> Lifestyle
            </span>
            <span className="text-sm font-bold text-slate-200">
              {formatEmissions(currentResult.lifestyle)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
