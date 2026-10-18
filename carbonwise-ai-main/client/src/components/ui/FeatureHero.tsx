import { ReactNode } from 'react';

interface FeatureHeroProps {
  title: string;
  description: string;
  label?: string;
  imageUrl: string;
  layout?: 'split' | 'overlay';
  actions?: ReactNode;
}

export function FeatureHero({
  title,
  description,
  label,
  imageUrl,
  layout = 'split',
  actions,
}: FeatureHeroProps) {
  if (layout === 'overlay') {
    return (
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden mb-8 shadow-sm group">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />

        <div className="relative h-full flex flex-col justify-center px-8 sm:px-12 w-full md:w-2/3 lg:w-1/2">
          {label && (
            <div className="text-emerald-400 font-bold text-xs uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <span className="w-4 h-0.5 bg-emerald-400 rounded-full" />
              {label}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-slate-200 text-sm sm:text-base font-medium mb-8 leading-relaxed max-w-md">
            {description}
          </p>
          {actions && (
            <div className="flex flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Split Layout
  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-8 shadow-sm border border-slate-200 flex flex-col md:flex-row transition-all duration-300 hover:shadow-md">
      <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white z-10 relative">
        {label && (
          <div className="text-emerald-700 font-bold text-[11px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-[3px] bg-emerald-600 rounded-full" />
            {label}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-5 leading-tight">
          {title}
        </h1>
        <p className="text-slate-500 text-[15px] sm:text-base font-medium leading-relaxed max-w-lg">
          {description}
        </p>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 mt-8">
            {actions}
          </div>
        )}
      </div>
      <div className="md:w-[45%] lg:w-[50%] h-[280px] md:h-auto relative overflow-hidden bg-slate-100 flex-shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        {/* Subtle gradient overlays to blend the image slightly */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent md:bg-gradient-to-l md:from-transparent md:to-white/20" />
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white to-transparent hidden md:block" />
      </div>
    </div>
  );
}
