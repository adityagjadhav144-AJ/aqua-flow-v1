import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const Footer: React.FC = () => {
  const { t } = useAppStore();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-4 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-medium text-slate-600">
          {t('disclaimer_footer')}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Timezone: Asia/Kolkata (IST)</span>
          <span>•</span>
          <span>Currency: INR (₹)</span>
          <span>•</span>
          <span>Pune & PCMC Zones 1–8</span>
        </div>
      </div>
    </footer>
  );
};
