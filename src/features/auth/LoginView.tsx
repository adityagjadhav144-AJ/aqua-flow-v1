import React, { useState } from 'react';
import {
  LogIn,
  KeyRound,
  ShieldCheck,
  Building,
  Building2,
  Truck,
  Landmark,
  Sliders,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { Role } from '../../types';

interface LoginViewProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { t, login, currentLanguage } = useAppStore();
  const [accountQuery, setAccountQuery] = useState('');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts: {
    id: string;
    role: Role;
    name: string;
    phone: string;
    subtext: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'user-resident-1',
      role: 'resident',
      name: 'Neha Deshpande',
      phone: '+91 98220 12345',
      subtext: currentLanguage === 'mr' ? 'बाणेर प्रभाग · घरगुती ग्राहक' : 'Baner Ward · Resident Customer',
      icon: Building,
    },
    {
      id: 'user-society-1',
      role: 'society',
      name: 'Rajesh Patil',
      phone: '+91 98230 54321',
      subtext: currentLanguage === 'mr' ? 'सनराईज हाइट्स · १२० फ्लॅट्स संप' : 'Sunrise Heights CHS · 120 Flats',
      icon: Building2,
    },
    {
      id: 'user-driver-1',
      role: 'driver',
      name: 'Santosh Jadhav',
      phone: '+91 98901 67890',
      subtext: currentLanguage === 'mr' ? 'MH-12 RN 8842 · शिवनेरी ट्रान्सपोर्ट' : 'MH-12 RN 8842 · Shivneri Fleet',
      icon: Truck,
    },
    {
      id: 'user-vendor-1',
      role: 'vendor',
      name: 'Meena Shinde',
      phone: '+91 94220 98765',
      subtext: currentLanguage === 'mr' ? 'शिवनेरी वॉटर कॅरियर्स · १२ टँकर्स' : 'Shivneri Water · 12 Tankers Fleet',
      icon: Landmark,
    },
    {
      id: 'user-municipal-1',
      role: 'municipal',
      name: 'Anil Gokhale (PMC)',
      phone: '+91 20 2550 1000',
      subtext: currentLanguage === 'mr' ? 'कार्यकारी अभियंता · मनपा पाणी पुरवठा' : 'Executive Engineer · PMC Water Dept',
      icon: ShieldCheck,
    },
    {
      id: 'user-ops-1',
      role: 'ops',
      name: 'AquaFlow Operations',
      phone: '+91 80000 00000',
      subtext: currentLanguage === 'mr' ? 'ग्रीड कंट्रोल · सेंट्रल मॉनिटरिंग' : 'Grid Control · Central Monitoring',
      icon: Sliders,
    },
  ];

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (!accountQuery.trim()) {
      setErrorMessage(t('invalid_credentials'));
      setIsSubmitting(false);
      return;
    }

    // Try finding user by id, phone, or email in db
    const users = db.getData().users;
    const clean = accountQuery.trim().toLowerCase();
    const found = users.find(
      (u) =>
        u.id === clean ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '')) ||
        (u.name && u.name.toLowerCase().includes(clean))
    );

    if (found) {
      login(found);
      setIsSubmitting(false);
      onSuccess();
    } else {
      setErrorMessage(t('invalid_credentials'));
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (userId: string) => {
    const success = login(userId);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Sign In Form */}
      <form onSubmit={handleManualLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">{t('phone_or_email')}</label>
          <input
            type="text"
            required
            value={accountQuery}
            onChange={(e) => {
              setAccountQuery(e.target.value);
              setErrorMessage('');
            }}
            placeholder="e.g. 98220 12345 or neha.resident@aquaflow.in"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">{t('password')}</label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 shadow-sm"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400">
              <KeyRound className="w-4 h-4 text-slate-400" />
            </span>
          </div>
        </div>

        {errorMessage && <p className="text-xs font-semibold text-rose-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>{isSubmitting ? t('loading') : t('sign_in')}</span>
        </button>
      </form>

      {/* Evaluator Personas Section */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('quick_login_evaluator')}</span>
          </div>
          <span className="text-[11px] text-slate-600 font-medium">1-Click Test</span>
        </div>
        <p className="text-[11px] text-slate-600 mb-3">{t('quick_login_desc')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => handleQuickLogin(account.id)}
                className="p-2.5 bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition-all group flex items-start gap-2.5 cursor-pointer shadow-xs"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:border-sky-400 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center shrink-0 text-slate-700 transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-sky-900 truncate">
                      {account.name}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
                  </div>
                  <div className="text-[10px] text-slate-600 truncate mt-0.5">{account.subtext}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Switch to Register */}
      <div className="pt-2 text-center">
        <p className="text-xs text-slate-600">
          {currentLanguage === 'mr' ? 'नवीन खाते हवे आहे का?' : "Don't have an authenticated account?"}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
          >
            {t('register_account')} →
          </button>
        </p>
      </div>
    </div>
  );
};
