import React, { useState } from 'react';
import {
  Droplets,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Lock,
  Building,
  Truck,
  Users,
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Civic Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand lockup */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-700 to-cyan-500 flex items-center justify-center text-white shadow-sm">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">AquaFlow</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-sky-100 text-sky-800">
                  {currentLanguage === 'mr' ? 'पुणे मनपा' : 'PMC Pune'}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 hidden sm:block">
                {currentLanguage === 'mr'
                  ? 'पुणे महानगरपालिका अधिकृत जल व टँकर वितरण नियंत्रण कक्ष'
                  : 'PMC Water Supply & Authorized Tanker Logistics Command'}
              </p>
            </div>
          </div>

          {/* Right Actions: Language Switcher & Security Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-600 ml-1.5" />
              <button
                type="button"
                onClick={() => handleLanguageToggle('en')}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  currentLanguage === 'en'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleLanguageToggle('mr')}
                className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                  currentLanguage === 'mr'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 font-medium">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Strict Role Isolation</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Auth Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Civic Gateway Headline */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>{currentLanguage === 'mr' ? 'प्रमाणित मनपा जल सुरक्षा' : 'PMC Water Quality & Rate Regulation'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('auth_portal_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            {currentLanguage === 'mr'
              ? 'टँकर ऑर्डर्समधील गैरव्यवहार टाळण्यासाठी व पाणी वाटपात पारदर्शकता राखण्यासाठी नागरिक, चालक, गृहनिर्माण संस्था व मनपा अधिकाऱ्यांसाठी सुरक्षित प्रवेशद्वार.'
              : 'Authorized authentication gateway ensuring tamper-proof water orders, fair price capping, and verified GPS dispatches across Pune wards.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              {t('sign_in')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              {t('register_account')}
            </button>
          </div>

          {/* Form Viewport */}
          <div className="p-6 sm:p-8">
            {activeTab === 'login' ? (
              <LoginView onSuccess={handleSuccess} onSwitchToRegister={() => setActiveTab('register')} />
            ) : (
              <RegisterWizard onSuccess={handleSuccess} onSwitchToLogin={() => setActiveTab('login')} />
            )}
          </div>
        </div>

        {/* Civic Trust Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full mt-6 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">
                {currentLanguage === 'mr' ? '१००% एस्क्रो सुरक्षा' : '100% Escrow Protection'}
              </span>
              <span className="text-[10px] text-slate-500">
                {currentLanguage === 'mr' ? 'डिलिव्हरी पडताळणीनंतरच पैसे' : 'Released only on QR PoD scan'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <Truck className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">
                {currentLanguage === 'mr' ? 'प्रमाणित मनपा स्त्रोत' : 'Certified Water Sources'}
              </span>
              <span className="text-[10px] text-slate-500">
                {currentLanguage === 'mr' ? 'पार्वती, वारजे व वडगाव केंद्र' : 'Parvati, Warje & RO testing'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <Building className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 block">
                {currentLanguage === 'mr' ? 'वाजवी दर संरक्षण' : 'Fair Price Capping'}
              </span>
              <span className="text-[10px] text-slate-500">
                {currentLanguage === 'mr' ? 'मनपा नियंत्रित कमाल दर' : 'Algorithmically regulated rates'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-600">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AquaFlow Pune · Smart Water & Tanker Infrastructure Initiative</span>
          <span className="text-[11px] text-slate-500">
            {currentLanguage === 'mr'
              ? 'पुणे व पिंपरी चिंचवड महानगरपालिका कार्यक्षेत्र'
              : 'Pune Municipal Corporation & PCMC Operational Zones'}
          </span>
        </div>
      </footer>
    </div>
  );
};
