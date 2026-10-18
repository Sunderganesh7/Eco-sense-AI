import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  rightContent?: ReactNode;
}

export function PageHeader({ title, description, rightContent }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
          {title}
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          {description}
        </p>
      </div>
      
      {rightContent && (
        <div className="flex items-center gap-3">
          {rightContent}
        </div>
      )}
    </div>
  );
}
