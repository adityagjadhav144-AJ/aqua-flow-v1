import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Role, Language } from '../../types';
import {
  Droplets,
  Bell,
  Sparkles,
  Sliders,
  Globe,
  UserCheck,
  WifiOff,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onOpenDemoPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemoPanel }) => {
  const {
    currentRole,
    setRole,
    currentLanguage,
    setLanguage,
    unreadCount,
    toggleNotifCenter,
    toggleAquaBot,
    isOffline,
    t,
  } = useAppStore();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const rolesList: { id: Role; label: string; icon: string }[] = [
    { id: 'resident', label: 'Resident (Neha)', icon: '🏡' },
    { id: 'driver', label: 'Driver (Santosh)', icon: '🚚' },
    { id: 'society', label: 'Society Admin (Rajesh)', icon: '🏢' },
    { id: 'vendor', label: 'Vendor Fleet (Meena)', icon: '💼' },
    { id: 'municipal', label: 'Municipal Officer (PMC)', icon: '🏛️' },
    { id: 'ops', label: 'Platform Ops', icon: '📊' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-cyan-100 shadow-xs">
      {/* Offline banner if simulating offline */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-xs font-medium py-1 px-3 text-center flex items-center justify-center gap-1.5 animate-pulse">
          <WifiOff size={14} />
          <span>{t('offline_banner')}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Droplets size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">
                AquaFlow
              </span>
              <span className="text-[11px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-cyan-100 text-cyan-800">
                Pune
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Smart Water Logistics & Fair-Cap
            </p>
          </div>
        </div>

        {/* Central Role Selector */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors border border-slate-200/80 cursor-pointer"
            title="Switch demo persona"
          >
            <UserCheck size={14} className="text-cyan-600" />
            <span className="hidden sm:inline text-slate-500 font-normal">Role:</span>
            <span className="capitalize font-medium">
              {rolesList.find((r) => r.id === currentRole)?.label.split(' ')[0]}
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Select Demo Role Experience
              </div>
              {rolesList.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setRole(r.id);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                    currentRole === r.id
                      ? 'bg-cyan-50 text-cyan-900 font-semibold border border-cyan-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2">
          {/* Dedicated English / Marathi Language Switcher for Pune Accessibility */}
          <div
            className="flex items-center bg-slate-100 hover:bg-slate-200/70 p-1 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            role="group"
            aria-label="Language selection: English or Marathi (पुणे)"
          >
            <div className="flex items-center pl-1.5 pr-1 text-slate-500 hidden md:flex" title="Language / भाषा">
              <Globe size={14} className="text-cyan-600" />
            </div>
            
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                currentLanguage === 'en'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              aria-pressed={currentLanguage === 'en'}
              title="Switch to English"
            >
              <span>English</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 font-['Noto_Sans_Devanagari',sans-serif] ${
                currentLanguage === 'mr'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 font-medium'
              }`}
              aria-pressed={currentLanguage === 'mr'}
              title="मराठीत बदला (पुणे महानगर क्षेत्र)"
            >
              <span>मराठी</span>
            </button>

            {/* Optional Hindi pill */}
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer hidden sm:block ${
                currentLanguage === 'hi'
                  ? 'bg-white text-cyan-900 shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              aria-pressed={currentLanguage === 'hi'}
              title="हिंदी में बदलें"
            >
              <span>हिंदी</span>
            </button>
          </div>

          {/* AquaBot Assistant Toggle (Resident only or quick access) */}
          <button
            onClick={toggleAquaBot}
            className="p-2 rounded-xl text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors relative cursor-pointer"
            title="Open AquaBot AI Assistant"
            aria-label="AquaBot AI Assistant"
          >
            <Sparkles size={18} />
          </button>

          {/* Notification Center */}
          <button
            onClick={toggleNotifCenter}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notification Center (Push & WhatsApp)"
            aria-label="Notification Center"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Demo Control Drawer Button */}
          <button
            onClick={onOpenDemoPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Open Demo Control Panel"
          >
            <Sliders size={14} />
            <span className="hidden sm:inline">Demo Controls</span>
          </button>
        </div>
      </div>
    </header>
  );
};
