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
      <div className="min-h-screen bg-gradient-to-br from-[#ebf3fa] via-[#f3f7fb] to-[#e8f1f8] flex flex-col selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
        {/* Background Image with soft blur for registration */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <img
            src="/assets/aistudio/image_582ca63d.png"
            alt="AquaFlow Logistics Background"
            className="w-full h-full object-cover object-center filter blur-xs brightness-[1.02] opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-white/50 to-sky-900/15" />
        </div>

        {/* Top bar for registration */}
        <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer bg-white/70 hover:bg-white px-3 py-1.5 rounded-xl border border-white/80 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{currentLanguage === 'mr' ? 'लॉगिन पृष्ठावर परत जा' : 'Back to Sign In'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-white/80 shadow-2xs text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
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
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-10 z-10">
          <RegisterWizard
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setActiveTab('login')}
          />
        </main>
      </div>
    );
  }

  // LOGIN MODE: Glassy login card centered over the immersive logistics globe background
  return (
    <div className="min-h-screen w-full flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* IMMERSIVE 3D WATER & LOGISTICS GLOBE BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img
          src="/assets/aistudio/image_582ca63d.png"
          alt="AquaFlow Global Logistics Background"
          className="w-full h-full object-cover sm:object-contain lg:object-cover object-center scale-100 sm:scale-105 transition-all duration-700 filter brightness-[1.03]"
        />
        {/* Frosted ambient gradient overlay for depth, rich color, and glass refraction */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-950/30 via-slate-900/15 to-blue-900/25 backdrop-blur-[1.5px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/40" />
      </div>

      {/* Top Utility Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between z-10 shrink-0">
        {/* Subtle Civic Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 hover:bg-white/85 backdrop-blur-xl border border-white/60 shadow-xs text-xs text-slate-800 transition-all">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-900">
            {currentLanguage === 'mr' ? 'पुणे मनपा अधिकृत जल नियंत्रण कक्ष' : 'PMC Water Supply & Logistics Command'}
          </span>
          <span className="hidden sm:inline text-slate-400">·</span>
          <span className="hidden sm:inline text-slate-600 font-medium">Strict Role Isolation</span>
        </div>

        {/* Right Utility Buttons: Language Switcher & Register */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1 p-1 bg-white/70 backdrop-blur-xl rounded-xl border border-white/60 shadow-xs text-xs">
            <Languages className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
            <button
              type="button"
              onClick={() => handleLanguageToggle('en')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                currentLanguage === 'en'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
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
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white/70 hover:bg-white/95 backdrop-blur-xl border border-white/60 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer hidden sm:block"
          >
            {currentLanguage === 'mr' ? 'नवीन नोंदणी' : 'Register Role'}
          </button>
        </div>
      </header>

      {/* Main Center Area: Glassy Login Console */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 flex items-center justify-center z-10">
        <div className="w-full flex items-center justify-center">
          {/* Frosted Glass Login Card with high translucency & refraction */}
          <div className="w-full max-w-[420px] sm:max-w-[450px] lg:max-w-[470px] bg-white/35 sm:bg-white/40 backdrop-blur-3xl rounded-3xl p-5 sm:p-8 shadow-2xl shadow-blue-950/35 border border-white/60 ring-1 ring-white/30 relative transition-all duration-300">
            {/* Specular glass edge highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none rounded-t-3xl" />

            {/* Login View Component */}
            <LoginView
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setActiveTab('register')}
            />
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-xs text-white/90 drop-shadow-sm z-10 shrink-0">
        <p className="font-medium tracking-wide">
          © 2026 AquaFlow Pune · PMC Water Logistics Command · All rights reserved
        </p>
      </footer>
    </div>
  );
};
