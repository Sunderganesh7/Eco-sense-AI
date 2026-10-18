import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  verdict: string;
  badge: 'green' | 'amber' | 'red';
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  verdict,
  badge,
  size = 140
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  const getStyle = () => {
    if (badge === 'green') {
      return {
        stroke: '#245e37',
        badgeClass: 'bg-forest-50 text-forest-800 dark:bg-forest-950 dark:text-forest-200 border-forest-300 dark:border-forest-700',
        Icon: Check
      };
    }
    if (badge === 'amber') {
      return {
        stroke: '#bd8958',
        badgeClass: 'bg-earth-50 text-earth-800 dark:bg-earth-950 dark:text-earth-200 border-earth-300 dark:border-earth-700',
        Icon: AlertTriangle
      };
    }
    return {
      stroke: '#dc2626',
      badgeClass: 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700',
      Icon: X
    };
  };

  const { stroke, badgeClass, Icon } = getStyle();

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-stone-100 dark:text-stone-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-[#131f16] dark:text-[#edf3ee] font-sans">
            {score}
          </span>
          <span className="text-[11px] text-[#728477] dark:text-[#97a69b] font-medium">
            / 100
          </span>
        </div>
      </div>

      <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeClass}`}>
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{verdict}</span>
      </div>
    </div>
  );
};
