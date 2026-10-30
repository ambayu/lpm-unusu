import React from 'react';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="py-12 px-4 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
        <DocumentMagnifyingGlassIcon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
