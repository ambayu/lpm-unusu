import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = status.toUpperCase().replace(/[\s/]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (norm) {
    case 'TERLAMPAUI':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      label = 'Terlampaui';
      break;
    case 'SESUAI':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200/80';
      label = 'Sesuai Standar';
      break;
    case 'KTS_MINOR':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200/80';
      label = 'KTS Minor';
      break;
    case 'KTS_MAYOR':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200/80';
      label = 'KTS Mayor';
      break;
    case 'OBSERVASI':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      label = 'Observasi';
      break;
    case 'PENDIDIKAN':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
      label = 'Pendidikan';
      break;
    case 'PENELITIAN':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200/80';
      label = 'Penelitian';
      break;
    case 'PENGABDIAN':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      label = 'Pengabdian';
      break;
    case 'TATA_KELOLA':
      colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
      label = 'Tata Kelola';
      break;
    case 'KEBIJAKAN':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Kebijakan SPMI';
      break;
    case 'MANUAL':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Manual Mutu';
      break;
    case 'STANDAR':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Standar Mutu';
      break;
    case 'SOP':
    case 'FORMULIR':
    case 'FORMULIR_SOP':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'SOP / Formulir';
      break;
    // Status periode AMI
    case 'DRAFT':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Draft';
      break;
    case 'BERJALAN':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200/80';
      label = 'Berjalan';
      break;
    case 'SELESAI':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      label = 'Selesai';
      break;
    default:
      label = status;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      role="status"
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${colorClasses}`}
    >
      {label}
    </span>
  );
};
