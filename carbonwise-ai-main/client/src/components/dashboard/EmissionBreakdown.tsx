import { memo, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CarbonResult } from '../../types';

interface EmissionBreakdownProps {
  result: CarbonResult;
}

const COLORS = {
  transportation: '#2563eb', // blue
  energy: '#f59e0b', // orange
  food: '#10b981', // green
  lifestyle: '#8b5cf6', // purple
};

const CATEGORY_LABELS: Record<string, string> = {
  transportation: 'Transportation',
  energy: 'Energy',
  food: 'Food',
  lifestyle: 'Lifestyle',
};

export const EmissionBreakdown = memo(function EmissionBreakdown({ result }: EmissionBreakdownProps) {
  const data = useMemo(
    () =>
      Object.entries(result)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({
          key,
          name: CATEGORY_LABELS[key] || key,
          value: Math.round(value * 10) / 10,
          color: COLORS[key as keyof typeof COLORS],
        })),
    [result],
  );

  const total = result.total;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_2px_12px_rgb(0,0,0,0.02)] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-3">
          <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5fcf1] text-[#059669]">
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10C22 6.477 17.523 2 12 2zM9.5 16.5l-4-4 1.414-1.414L9.5 13.672l6.086-6.086L17 9l-7.5 7.5z" clipRule="evenodd"></path></svg>
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-slate-900 mb-0.5">
              Emission Breakdown
            </h3>
            <p className="text-[13px] text-slate-500 font-light">
              See how your emissions are distributed across different categories.
            </p>
          </div>
        </div>

        {/* Dropdown styling */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50">
          This Month
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-8 pt-4 pb-2">
        {/* Chart */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="75%"
                outerRadius="100%"
                paddingAngle={4}
                dataKey="value"
                stroke="none"
                animationBegin={0}
                animationDuration={300}
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} kg`, 'Emissions']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[22px] font-extrabold text-slate-900 leading-none mb-1">
              {total.toFixed(1)} <span className="text-[14px]">kg</span>
            </span>
            <span className="text-[12px] font-semibold text-slate-400 tracking-wider">
              CO₂e
            </span>
          </div>
        </div>

        {/* Legend / List */}
        <div className="flex-1 w-full space-y-4 pr-4">
          {data.map((item) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-[13px] font-bold text-slate-800 w-24">{item.name}</span>
                </div>
                <div className="flex items-center justify-between flex-1 ml-4">
                  <span className="text-[13px] font-extrabold text-slate-900 w-16 text-right">
                    {percentage}%
                  </span>
                  <span className="text-[13px] font-medium text-slate-500 text-right w-16">
                    {item.value.toFixed(1)} kg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
