import React from 'react';

interface QuickPromptChipProps {
  label: string;
  onClick: (label: string) => void;
  disabled?: boolean;
}

const QuickPromptChip: React.FC<QuickPromptChipProps> = ({ label, onClick, disabled }) => (
  <button
    type="button"
    className={`rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) onClick(label);
    }}
    disabled={disabled}
    aria-label={`Quick prompt: ${label}`}
  >
    {label}
  </button>
);

interface WelcomeAreaProps {
  prompts: string[];
  onPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const WelcomeArea: React.FC<WelcomeAreaProps> = ({ prompts, onPrompt, disabled }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgb(0,0,0,0.02)] p-5">
    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h4>
    <div className="flex flex-wrap gap-2">
      {prompts.map((p) => (
        <QuickPromptChip key={p} label={p} onClick={onPrompt} disabled={disabled} />
      ))}
    </div>
  </div>
);
