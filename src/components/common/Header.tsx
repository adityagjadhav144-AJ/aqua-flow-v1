import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Role, Language } from '../../types';
import {
  Bell,
  Sparkles,
  Sliders,
  Globe,
  UserCheck,
  WifiOff,
  ChevronDown,
  BadgeCheck,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onOpenDemoPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemoPanel }) => {
  const {
    currentRole,
    currentUser,
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

      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-white border border-cyan-200/90 p-0.5 flex items-center justify-center shadow-md shadow-cyan-500/15 shrink-0">
            <img
              src="/assets/aistudio/image_a469dbfe.png"
              alt="AquaFlow Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                AquaFlow
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wide uppercase px-1 sm:px-1.5 py-0.2 rounded-md bg-cyan-100 text-cyan-800">
                Pune
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden md:block">
              Smart Water Logistics & Fair-Cap
            </p>
          </div>
        </div>

        {/* Authenticated User Identity Capsule & Profile Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors border border-slate-200/80 cursor-pointer shadow-2xs"
            title="User Profile & Roles"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-left">
              <span className="font-semibold text-slate-900 truncate max-w-[65px] sm:max-w-[120px] md:max-w-[150px]">
                {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
              </span>
              <span className="hidden md:inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800">
                <BadgeCheck size={11} className="text-emerald-700" />
                <span>PMC Verified</span>
              </span>
            </div>
            <ChevronDown size={12} className="text-slate-400 shrink-0" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
              {/* Profile Card Header */}
              <div className="pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{currentUser?.name}</span>
                  <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                    {currentUser?.verification?.verificationBadgeId || 'PMC-VERIFIED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>{currentUser?.phone}</span>
                  <span className="capitalize text-slate-600 font-medium">Role: {currentRole}</span>
                </div>
                {currentUser?.verification?.roleBadgeTitle && (
                  <div className="mt-1 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <BadgeCheck size={12} />
                    <span className="truncate">{currentUser.verification.roleBadgeTitle}</span>
                  </div>
                )}
              </div>

              {/* Fast Persona Switch for Evaluators */}
              <div className="px-1 py-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Switch Operational Persona
              </div>
              <div className="space-y-1 mb-2 max-h-48 overflow-y-auto">
                {rolesList.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setRole(r.id);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                      currentRole === r.id
                        ? 'bg-sky-50 text-sky-900 font-semibold border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">{r.icon}</span>
                    <span className="truncate">{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Sign Out CTA */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen(false);
                    useAppStore.getState().logout();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                >
                  <LogOut size={14} />
                  <span>{t('sign_out')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Single Tap Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(currentLanguage === 'en' ? 'mr' : 'en')}
            className="md:hidden px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
            title="भाषा बदला / Toggle Language"
          >
            {currentLanguage === 'mr' ? 'मराठी' : 'EN'}
          </button>

          {/* Desktop Full 3-Language Selector */}
          <div
            className="hidden md:flex items-center bg-slate-100 hover:bg-slate-200/70 p-1 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            role="group"
            aria-label="Language selection: English or Marathi (पुणे)"
          >
            <div className="flex items-center pl-1.5 pr-1 text-slate-500" title="Language / भाषा">
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
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
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

          {/* AquaBot Assistant Toggle */}
          <button
            onClick={toggleAquaBot}
            className="p-1.5 sm:p-2 rounded-xl text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors relative cursor-pointer shrink-0"
            title="Open AquaBot AI Assistant"
            aria-label="AquaBot AI Assistant"
          >
            <Sparkles size={16} className="sm:hidden" />
            <Sparkles size={18} className="hidden sm:block" />
          </button>

          {/* Notification Center */}
          <button
            onClick={toggleNotifCenter}
            className="p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors relative cursor-pointer shrink-0"
            title="Notification Center (Push & WhatsApp)"
            aria-label="Notification Center"
          >
            <Bell size={16} className="sm:hidden" />
            <Bell size={18} className="hidden sm:block" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white rounded-full text-[8px] sm:text-[9px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Demo Control Drawer Button */}
          <button
            onClick={onOpenDemoPanel}
            className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
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
