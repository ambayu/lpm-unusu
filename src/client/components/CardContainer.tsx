import React from 'react';

interface CardContainerProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * CardContainer (Part 10.8): Card kontainer data & tabel standar ONE UNUSU
 * Menggunakan border #CBD5E1, border-radius [14px], header berlatar lembut #F8FAFC,
 * dan aksen font Quicksand bulat yang nyaman dibaca.
 */
export const CardContainer: React.FC<CardContainerProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  const hasHeader = title || subtitle || badge || actions;

  return (
    <div
      className={`bg-white rounded-[14px] border border-[#CBD5E1] shadow-2xs overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div className="px-5 py-3.5 border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
          <div>
            <div className="flex items-center space-x-2">
              {title && <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-normal">{title}</h3>}
              {badge}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-normal">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
