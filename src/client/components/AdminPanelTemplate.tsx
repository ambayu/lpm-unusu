import React from 'react';

interface AdminPanelTemplateProps {
  title: string;
  description: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * AdminPanelTemplate: Container panel utama standar ONE UNUSU
 * Membungkus seluruh konten halaman dalam satu unified white panel card
 * dengan header bar terstruktur, border #CBD5E1, dan radius [16px].
 */
export const AdminPanelTemplate: React.FC<AdminPanelTemplateProps> = ({
  title,
  description,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <div
      className={`w-full min-w-0 bg-white border border-[#CBD5E1] rounded-[16px] shadow-xs overflow-hidden ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 border-b border-[#CBD5E1] bg-white">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-slate-900">{title}</h1>
            {badge}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal leading-relaxed">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2.5 flex-shrink-0">{actions}</div>}
      </div>

      {/* Panel Content Canvas */}
      <div className="w-full min-w-0 p-5 sm:p-6 space-y-6">{children}</div>
    </div>
  );
};
