import React, { useState } from 'react';
import {
  User,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Building,
  Building2,
  Truck,
  Landmark,
  Sliders,
  Sparkles,
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

  // Primary subtab: 'account' (manual credentials matching the reference image) or 'roles' (1-click evaluator login)
  const [activeSubTab, setActiveSubTab] = useState<'account' | 'roles'>('account');

  // Form fields
  const [accountQuery, setAccountQuery] = useState('98220 12345');
  const [password, setPassword] = useState('password123');
  const [captchaInput, setCaptchaInput] = useState('7428');
  const [captchaCode, setCaptchaCode] = useState('7428');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshCaptcha = () => {
    const nextCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(nextCode);
    setCaptchaInput(nextCode);
  };

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
      setErrorMessage(
        currentLanguage === 'mr'
          ? 'अवैध वापरकर्ता तपशील. कृपया नोंदणीकृत फोन किंवा आयडी प्रविष्ट करा.'
          : 'Invalid credentials. Please enter a registered mobile number, email, or select a role.'
      );
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
    <div className="w-full">
      {/* Brand Header Lockup matching inspiration image */}
      <div className="mb-6 pb-2">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Logo Icon */}
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-blue-200/90 p-0.5 flex items-center justify-center shadow-xs shrink-0">
            <img
              src="/assets/aistudio/image_a469dbfe.png"
              alt="AquaFlow Icon"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Brand Name */}
          <span className="text-lg sm:text-xl font-extrabold text-blue-600 tracking-tight">
            AquaFlow
          </span>

          {/* Divider */}
          <span className="text-slate-300 font-light hidden sm:inline">|</span>

          {/* Subtitle / Platform Name */}
          <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
            {currentLanguage === 'mr'
              ? 'पुणे मनपा अधिकृत जल व टँकर वितरण मंच'
              : 'Smart Water & Tanker Operations Platform'}
          </span>
        </div>
      </div>

      {/* Clean Segmented Tabs matching inspiration image */}
      <div className="flex items-center gap-6 border-b border-slate-200/90 mb-6">
        <button
          type="button"
          onClick={() => setActiveSubTab('account')}
          className={`pb-2.5 text-sm font-semibold transition-all relative cursor-pointer ${
            activeSubTab === 'account'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>{currentLanguage === 'mr' ? 'खाते लॉगिन' : 'Account Login'}</span>
          {activeSubTab === 'account' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('roles')}
          className={`pb-2.5 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'roles'
              ? 'text-blue-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>{currentLanguage === 'mr' ? 'त्वरित भूमिका प्रवेश' : 'Quick Role Access'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold">
            1-Click
          </span>
          {activeSubTab === 'roles' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>

      {/* TAB 1: Account Login (Sleek minimalist fields matching the reference image) */}
      {activeSubTab === 'account' ? (
        <form onSubmit={handleManualLogin} className="space-y-4">
          {/* Field 1: User / Phone / ID */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={accountQuery}
              onChange={(e) => {
                setAccountQuery(e.target.value);
                setErrorMessage('');
              }}
              placeholder={
                currentLanguage === 'mr'
                  ? 'नोंदणीकृत मोबाईल नंबर किंवा आयडी'
                  : 'Enter Mobile Number, Email or ID'
              }
              className="w-full pl-10 pr-24 py-3 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-xs transition-all"
            />
            {/* Quick pre-fill chip */}
            <button
              type="button"
              onClick={() => setAccountQuery('98220 12345')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors cursor-pointer"
            >
              Demo Fill
            </button>
          </div>

          {/* Field 2: Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={currentLanguage === 'mr' ? 'पासवर्ड प्रविष्ट करा' : 'Enter Password'}
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-xs transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Field 3: Security Verification Code / Captcha (Matching the reference image) */}
          <div className="relative flex gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder={
                  currentLanguage === 'mr' ? 'सुरक्षा कोड प्रविष्ट करा' : 'Enter Verification Code'
                }
                className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-xs transition-all"
              />
            </div>

            {/* Captcha Badge with Refresh */}
            <div
              onClick={refreshCaptcha}
              title="Click to refresh security code"
              className="h-11 sm:h-12 px-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-blue-100/70 transition-colors select-none shrink-0"
            >
              <span className="font-mono text-sm sm:text-base font-black tracking-widest text-blue-700 italic">
                {captchaCode}
              </span>
              <RefreshCw className="w-3 h-3 text-blue-400" />
            </div>
          </div>

          {/* Remember me & Default password helper */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>{currentLanguage === 'mr' ? 'लॉगिन जतन करा' : 'Remember login'}</span>
            </label>

            <span className="text-[11px] text-slate-400 font-mono">Default: password123</span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Primary Action Button (Vivid Blue styled directly like inspiration image) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-[0.99] text-white font-bold rounded-xl text-sm sm:text-base tracking-wide shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{currentLanguage === 'mr' ? 'प्रवेश करत आहे...' : 'Signing in...'}</span>
              </>
            ) : (
              <span>{currentLanguage === 'mr' ? 'प्रवेश करा (Sign In)' : 'Sign In to Portal'}</span>
            )}
          </button>
        </form>
      ) : (
        /* TAB 2: Quick Role Access (1-Click Evaluator Personas) */
        <div className="space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            {currentLanguage === 'mr'
              ? 'कोणत्याही भूमिकेवर टॅप करा आणि थेट संबंधित अधिकृत डॅशबोर्डमध्ये त्वरित प्रवेश करा:'
              : 'Select any civic persona below to instantly experience their isolated dashboard:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleQuickLogin(account.id)}
                  className="p-3 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all group flex items-start gap-3 cursor-pointer shadow-xs hover:shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-700 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900 truncate">
                        {account.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 shrink-0 ml-1" />
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {account.subtext}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Switch to Registration */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {currentLanguage === 'mr' ? 'खाते नाही?' : 'Need an authorized role?'}
        </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>
            {currentLanguage === 'mr' ? 'अधिकृत नोंदणी करा' : 'Register New Account'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
