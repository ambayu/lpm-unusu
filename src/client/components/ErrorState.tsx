import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal Memuat Data',
  description = 'Terjadi kesalahan saat mengambil data. Silakan coba beberapa saat lagi.',
  onRetry,
}) => {
  return (
    <div className="py-12 px-4 text-center" role="alert">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
        <ExclamationTriangleIcon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{description}</p>
      {onRetry && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-bold text-lpm-green-700 hover:text-lpm-green-800 hover:underline"
          >
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
};
