import React, { useState } from 'react';
import {
  ShieldCheck,
  Languages,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Droplets,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { LoginView } from './LoginView';
import { RegisterWizard } from './RegisterWizard';
import { Language } from '../../types';

interface AuthPortalProps {
  onLoginSuccess?: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLoginSuccess }) => {
  const { currentLanguage, setLanguage, t } = useAppStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const handleLanguageToggle = (lang: Language) => {
    setLanguage(lang);
  };

  const handleSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  // If in Registration Mode, show the Register Wizard with a clean return button
  if (activeTab === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#f3f7fb] to-[#e8f1f8] flex flex-col selection:bg-blue-500 selection:text-white">
        {/* Top bar for registration */}
        <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentLanguage === 'mr' ? 'लॉगिन पृष्ठावर परत जा' : 'Back to Sign In'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <button
                type="button"
                onClick={() => handleLanguageToggle('en')}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  currentLanguage === 'en'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLanguageToggle('mr')}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  currentLanguage === 'mr'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10">
          <RegisterWizard
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setActiveTab('login')}
          />
        </main>
      </div>
    );
  }

  // LOGIN MODE: 2-column aesthetic inspired directly by the reference image
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#f3f7fc] to-[#e8f1f8] flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient background soft light glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl" />

      {/* Top Utility Bar (Language Toggle & Verification Pill) */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between z-10">
        {/* Subtle Civic Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">
            {currentLanguage === 'mr' ? 'पुणे मनपा अधिकृत जल नियंत्रण कक्ष' : 'PMC Water Logistics Network'}
          </span>
          <span className="hidden sm:inline text-slate-400">·</span>
          <span className="hidden sm:inline text-slate-500">Strict Role Isolation</span>
        </div>

        {/* Right utility buttons: Language toggle & Register link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-2xs text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <button
              type="button"
              onClick={() => handleLanguageToggle('en')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageToggle('mr')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                currentLanguage === 'mr'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white/80 hover:bg-white border border-blue-200/80 px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer hidden sm:block"
          >
            {currentLanguage === 'mr' ? 'नवीन नोंदणी' : 'Register Role'}
          </button>
        </div>
      </header>

      {/* Main Split Layout: 3D Isometric City on Left, Clean Form on Right */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex items-center justify-center z-10">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: 3D Isometric Smart City Illustration with floating telemetry */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center text-center lg:text-left relative">
            <div className="w-full max-w-lg lg:max-w-xl mx-auto relative group">
              {/* Soft pedestal glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-300/30 via-transparent to-transparent rounded-3xl blur-2xl transform scale-95 pointer-events-none" />

              {/* 3D Smart City Isometric Image Asset from user inspiration */}
              <div className="relative rounded-3xl overflow-hidden flex items-center justify-center p-2 sm:p-4">
                <img
                  src="/assets/smart_city_illustration.png"
                  alt="AquaFlow Smart City Water Grid"
                  className="w-full max-w-[480px] lg:max-w-[560px] h-auto object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-[1.02] select-none pointer-events-none"
                />
              </div>

              {/* Bottom Civic Feature Pills */}
              <div className="mt-2 hidden sm:flex items-center justify-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">100% Escrow & Fair-Cap</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">Dynamic PoD QR Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sleek, Engaging Login Form Card */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/5 border border-blue-100/90 relative">
              <LoginView
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setActiveTab('register')}
              />
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER: Minimal, centered matching reference image */}
      <footer className="w-full py-4 text-center text-xs text-slate-400 z-10">
        <p className="font-normal tracking-wide">
          © 2026 AquaFlow Pune · PMC Water Logistics Command · All rights reserved
        </p>
      </footer>
    </div>
  );
};
