import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { MonitoringPlotItem } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const MonitoringPage: React.FC = () => {
  const [plots, setPlots] = useState<MonitoringPlotItem[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<MonitoringPlotItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Live Simulator state
  const [simTrees, setSimTrees] = useState<number>(100);
  const [simArea, setSimArea] = useState<number>(2500);
  const [simMonths, setSimMonths] = useState<number>(24);
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const data = await api.getMonitoringPlots();
        setPlots(data);
        if (data.length > 0) {
          setSelectedPlot(data[0]);
        }
      } catch (err) {
        console.error('Failed to load monitoring plots:', err);
      }
    };
    fetchPlots();
  }, []);

  useEffect(() => {
    const runSim = async () => {
      try {
        const res = await api.simulateNDVI({
          target_trees: simTrees,
          area_sqm: simArea,
          months_elapsed: simMonths
        });
        setSimResult(res);
      } catch (err) {
        console.error(err);
      }
    };
    runSim();
  }, [simTrees, simArea, simMonths]);

  return (
    <div className="py-8 px-6 sm:px-10 lg:px-12 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-forest-100 text-forest-800 dark:bg-forest-900/60 dark:text-forest-300 border border-forest-200 dark:border-forest-800">
              NDVI & Spectral Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            NDVI & Canopy Growth Monitoring
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Multi-spectral vegetation index comparison, drone audits, and carbon offset tracking.
          </p>
        </div>

        {plots.length > 0 && (
          <select
            value={selectedPlot?.id || ''}
            onChange={(e) => {
              const found = plots.find(p => p.id === Number(e.target.value));
              if (found) setSelectedPlot(found);
            }}
            className="bg-white dark:bg-zinc-800 border border-border dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 cursor-pointer shadow-subtle self-start sm:self-auto"
          >
            {plots.map(p => (
              <option key={p.id} value={p.id}>
                {p.project_name} ({p.district})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedPlot && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Before / After Split Slider (7 Cols) */}
          <div className="lg:col-span-7 p-6 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  Baseline vs Current NDVI
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Drag the slider to compare barren baseline vs canopy gain
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-forest-100 text-forest-800 dark:bg-forest-900/60 dark:text-forest-300 border border-forest-200 dark:border-forest-800">
                +{selectedPlot.ndvi_growth_pct}% NDVI Gain
              </span>
            </div>

            {/* Split Comparison Canvas */}
            <div className="relative h-64 sm:h-72 rounded-xl overflow-hidden border border-border dark:border-zinc-700 select-none shadow-inner">
              {/* After Layer (Green) */}
              <div
                className="absolute inset-0 flex items-end p-4"
                style={{
                  background: 'linear-gradient(135deg, #194327 0%, #245e37 50%, #2d7744 100%)',
                }}
              >
                <div className="p-2.5 rounded-lg bg-zinc-950/85 backdrop-blur-xs text-white text-xs border border-forest-500/30">
                  <span className="font-semibold text-forest-300 block text-xs">Current NDVI: {selectedPlot.current_ndvi}</span>
                  <span className="text-[10px] text-zinc-300">Dense Native Canopy Cover</span>
                </div>
              </div>

              {/* Before Layer (Brown/Barren) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden flex items-end p-4 border-r-2 border-white transition-none"
                style={{
                  width: `${sliderPosition}%`,
                  background: 'linear-gradient(135deg, #58331d 0%, #835234 50%, #bd8958 100%)',
                }}
              >
                <div className="p-2.5 rounded-lg bg-zinc-950/85 backdrop-blur-xs text-white text-xs border border-earth-500/30">
                  <span className="font-semibold text-earth-300 block text-xs">Baseline NDVI: {selectedPlot.baseline_ndvi}</span>
                  <span className="text-[10px] text-zinc-300">Pre-Planting Baseline</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
              />

              <div
                className="absolute inset-y-0 w-0.5 bg-white pointer-events-none z-10 flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-forest-900 text-white flex items-center justify-center text-[10px] font-bold border border-white shadow-md">
                  ⟷
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg bg-surface-elevated dark:bg-zinc-800/80 border border-border dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] block mb-0.5">Planted</span>
                <strong className="text-zinc-900 dark:text-white font-semibold text-sm">{selectedPlot.total_saplings_planted}</strong>
              </div>
              <div className="p-3 rounded-lg bg-forest-50/70 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-900">
                <span className="text-forest-700 dark:text-forest-400 text-[10px] block mb-0.5">Survival Rate</span>
                <strong className="text-forest-800 dark:text-forest-300 font-semibold text-sm">{selectedPlot.survival_rate_pct}%</strong>
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated dark:bg-zinc-800/80 border border-border dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] block mb-0.5">Carbon Offset</span>
                <strong className="text-zinc-900 dark:text-white font-semibold text-sm">{selectedPlot.estimated_carbon_offset_tons} Tons</strong>
              </div>
            </div>
          </div>

          {/* Growth Trajectory (5 Cols) */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-4">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                Multi-Month NDVI Trajectory
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                24-month quarterly spectral survey records
              </p>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedPlot.timeline_records}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                  <YAxis domain={[0, 1.0]} tick={{ fontSize: 10 }} stroke="#a1a1aa" />
                  <Tooltip />
                  <Area type="monotone" dataKey="ndvi" stroke="#245e37" strokeWidth={2.5} fillOpacity={0.2} fill="#245e37" name="NDVI Index" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Species breakdown */}
            <div className="space-y-1.5 text-xs pt-3 border-t border-border dark:border-zinc-800">
              <span className="font-medium text-zinc-800 dark:text-zinc-200 block">
                Species-wise Survival
              </span>
              {selectedPlot.species_distribution.slice(0, 3).map((sp, idx) => (
                <div key={idx} className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-xs">
                  <span>{sp.species}</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 font-medium">
                    {sp.count} trees ({sp.survival_pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estimator */}
      <div className="p-6 rounded-xl bg-card dark:bg-zinc-900 border border-border dark:border-zinc-800 shadow-card space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-earth-100 text-earth-800 dark:bg-earth-950/60 dark:text-earth-300 border border-earth-200 dark:border-earth-800">
              Predictive Yield
            </span>
          </div>
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
            NDVI & Carbon Yield Estimator
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Simulate expected ecological gain for a prospective plot
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300 block">
              Saplings: <strong className="text-forest-700 dark:text-forest-400">{simTrees}</strong>
            </label>
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={simTrees}
              onChange={(e) => setSimTrees(Number(e.target.value))}
              className="w-full accent-forest-700 dark:accent-forest-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300 block">
              Area: <strong className="text-forest-700 dark:text-forest-400">{simArea} sq.m</strong>
            </label>
            <input
              type="range"
              min="200"
              max="20000"
              step="100"
              value={simArea}
              onChange={(e) => setSimArea(Number(e.target.value))}
              className="w-full accent-forest-700 dark:accent-forest-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-zinc-700 dark:text-zinc-300 block">
              Horizon: <strong className="text-forest-700 dark:text-forest-400">{simMonths} Months</strong>
            </label>
            <input
              type="range"
              min="6"
              max="60"
              step="6"
              value={simMonths}
              onChange={(e) => setSimMonths(Number(e.target.value))}
              className="w-full accent-forest-700 dark:accent-forest-500 cursor-pointer"
            />
          </div>
        </div>

        {simResult && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-surface-elevated dark:bg-zinc-800/80 border border-border dark:border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Projected NDVI</span>
              <strong className="text-xl font-bold text-zinc-900 dark:text-white font-sans">{simResult.current_ndvi}</strong>
            </div>

            <div className="p-3.5 rounded-lg bg-forest-50/80 dark:bg-forest-950/40 border border-forest-200 dark:border-forest-900 text-center">
              <span className="text-[11px] text-forest-700 dark:text-forest-400 block font-medium">Green Cover Gain</span>
              <strong className="text-xl font-bold text-forest-800 dark:text-forest-300 font-sans">+{simResult.green_cover_change_pct}%</strong>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated dark:bg-zinc-800/80 border border-border dark:border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">CO₂ Sequestered</span>
              <strong className="text-xl font-bold text-earth-800 dark:text-earth-300 font-sans">{simResult.accumulated_carbon_tons} T</strong>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated dark:bg-zinc-800/80 border border-border dark:border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-medium">Oxygen Output</span>
              <strong className="text-xl font-bold text-forest-800 dark:text-forest-300 font-sans">{simResult.oxygen_production_kg_day} kg/d</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
