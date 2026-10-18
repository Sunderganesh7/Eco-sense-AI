import React from 'react';
import { Scale } from 'lucide-react';

interface ComplianceDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export const ComplianceDisclaimer: React.FC<ComplianceDisclaimerProps> = ({ compact = false, className = '' }) => {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100/90 dark:bg-stone-900/90 text-[#506154] dark:text-[#97a69b] text-xs font-medium border border-[#e2e8e2] dark:border-[#232f25] ${className}`}>
        <Scale className="w-3.5 h-3.5 text-forest-700 dark:text-forest-400 shrink-0" />
        <span>Preliminary advisory • Final statutory clearance rests with designated Tree Officer / MCZMA</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-stone-50 dark:bg-[#141a15] border border-[#e2e8e2] dark:border-[#232f25] text-[#506154] dark:text-[#97a69b] text-xs flex items-start gap-3 ${className}`}>
      <Scale className="w-4 h-4 text-forest-700 dark:text-forest-400 shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-semibold text-[#131f16] dark:text-[#edf3ee]">
          Statutory Compliance Notice
        </p>
        <p className="leading-relaxed">
          This system provides preliminary regulatory guidance based on codified state and municipal guidelines under the Maharashtra (Urban Areas) Protection and Preservation of Trees Act, 1975, Forest Conservation Act, and CRZ Notifications. Official permissions must be formally submitted to the competent authority.
        </p>
      </div>
    </div>
  );
};
