import React, { useState } from 'react';
import {
  ShieldCheck,
  Building,
  Truck,
  Building2,
  Landmark,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Copy,
  Check,
  BadgeCheck,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Role, User, Zone } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';

interface RegisterWizardProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

type WizardStep = 'role' | 'details' | 'otp' | 'badge';

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { t, registerUser, currentLanguage } = useAppStore();
  const zones: Zone[] = db.getData().zones;

  const [step, setStep] = useState<WizardStep>('role');
  const [selectedRole, setSelectedRole] = useState<Role>('resident');

  // Common fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('98220 94812');
  const [password, setPassword] = useState('password123');
  const [zoneId, setZoneId] = useState<string>(zones[1]?.id || 'z2');
  const [addressLine, setAddressLine] = useState('Flat 304, Green Acres, Baner Road, Pune');

  // Role specific fields
  const [vehicleNo, setVehicleNo] = useState('MH-12 TR 7714');
  const [commercialDl, setCommercialDl] = useState('MH12 20190088219');
  const [societyName, setSocietyName] = useState('Skyline Towers Co-op Housing Society');
  const [societyRegNo, setSocietyRegNo] = useState('PUN/HSG/TC/19042/2022');
  const [flatsCount, setFlatsCount] = useState('84');
  const [sumpCapacityL, setSumpCapacityL] = useState('35000');
  const [vendorCompany, setVendorCompany] = useState('Maratha Water Carriers & Logistics');
  const [vendorPermitNo, setVendorPermitNo] = useState('PMC-WTR-PERMIT-2026-891');
  const [fleetSize, setFleetSize] = useState('8');
  const [pmcEmployeeId, setPmcEmployeeId] = useState('PMC-WTR-ENG-449');
  const [designation, setDesignation] = useState('Sub-Divisional Water Inspector');
  const [opsPasscode, setOpsPasscode] = useState('OPS-PMC-PUN-2026');

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('942618');
  const [otpError, setOtpError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  const roleDefinitions = [
    {
      id: 'resident' as Role,
      title: t('role_resident'),
      desc: t('role_resident_desc'),
      icon: Building,
      badgeText: currentLanguage === 'mr' ? 'नागरिक / घरगुती' : 'Domestic Resident',
    },
    {
      id: 'society' as Role,
      title: t('role_society'),
      desc: t('role_society_desc'),
      icon: Building2,
      badgeText: currentLanguage === 'mr' ? 'गृहनिर्माण संस्था' : 'Housing Society',
    },
    {
      id: 'driver' as Role,
      title: t('role_driver'),
      desc: t('role_driver_desc'),
      icon: Truck,
      badgeText: currentLanguage === 'mr' ? 'व्यावसायिक चालक' : 'Commercial Driver',
    },
    {
      id: 'vendor' as Role,
      title: t('role_vendor'),
      desc: t('role_vendor_desc'),
      icon: Landmark,
      badgeText: currentLanguage === 'mr' ? 'परवानाधारक पुरवठादार' : 'Certified Fleet Vendor',
    },
    {
      id: 'municipal' as Role,
      title: t('role_municipal'),
      desc: t('role_municipal_desc'),
      icon: ShieldCheck,
      badgeText: currentLanguage === 'mr' ? 'मनपा पाणी पुरवठा' : 'PMC Water Authority',
    },
    {
      id: 'ops' as Role,
      title: t('role_ops'),
      desc: t('role_ops_desc'),
      icon: Sliders,
      badgeText: currentLanguage === 'mr' ? 'प्रणाली ऑप्स' : 'Platform Operations',
    },
  ];

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    // Pre-seed sample contextual defaults
    if (role === 'resident') {
      setName('Aditya Jadhav');
      setPhone('98220 94812');
    } else if (role === 'driver') {
      setName('Eknath Shinde');
      setPhone('98904 55123');
      setVehicleNo('MH-12 TR 7714');
    } else if (role === 'society') {
      setName('Pradeep Joshi');
      setPhone('98231 66234');
      setSocietyName('Skyline Towers CHS');
    } else if (role === 'vendor') {
      setName('Sanjay Mane');
      setPhone('94220 77123');
      setVendorCompany('Mane Water Express');
    } else if (role === 'municipal') {
      setName('Vikram Patil (PMC)');
      setPhone('020 2550 4400');
      setPmcEmployeeId('PMC-WTR-ENG-449');
    } else if (role === 'ops') {
      setName('Gaurav Kadam');
      setPhone('98229 00112');
    }
    setStep('details');
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate a simulated 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpError('');
    setStep('otp');
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    const chars = generatedOtp.split('');
    setOtpDigits(chars);
    setOtpError('');
  };

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(generatedOtp);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleVerifyOtpAndActivate = () => {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setOtpError(t('invalid_otp'));
      return;
    }
    if (entered !== generatedOtp && entered !== '123456') {
      setOtpError(t('invalid_otp'));
      return;
    }

    // Provision new authenticated User
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const badgePrefix =
      selectedRole === 'resident'
        ? 'PMC-RES'
        : selectedRole === 'driver'
          ? 'PMC-DRV'
          : selectedRole === 'society'
            ? 'PMC-SOC'
            : selectedRole === 'vendor'
              ? 'PMC-VND'
              : selectedRole === 'municipal'
                ? 'PMC-OFF'
                : 'PMC-OPS';

    const verificationBadgeId = `${badgePrefix}-2026-${randomSuffix}`;

    const newUser: User = {
      id: `user-${selectedRole}-${Date.now()}`,
      role: selectedRole,
      name: name.trim() || 'PMC Registered User',
      phone: phone.startsWith('+91') ? phone : `+91 ${phone}`,
      password: password || 'password123',
      language: currentLanguage,
      zoneId: zoneId,
      walletPaise: selectedRole === 'society' ? 5000000 : selectedRole === 'vendor' ? 10000000 : 200000,
      trustScore: 100, // Instant certified trust score
      notifPrefs: { push: true, whatsapp: true },
      verification: {
        isVerified: true,
        verificationBadgeId,
        verifiedAt: new Date().toISOString().split('T')[0],
        statutoryIdType:
          selectedRole === 'resident'
            ? 'RESIDENT_AADHAAR_MASKED'
            : selectedRole === 'driver'
              ? 'COMMERCIAL_DL'
              : selectedRole === 'society'
                ? 'RERA_SOCIETY'
                : selectedRole === 'vendor'
                  ? 'PMC_VENDOR_PERMIT'
                  : selectedRole === 'municipal'
                    ? 'PMC_EMP_ID'
                    : 'OPS_KEY',
        statutoryIdValue:
          selectedRole === 'resident'
            ? 'XXXX-XXXX-9912'
            : selectedRole === 'driver'
              ? commercialDl
              : selectedRole === 'society'
                ? societyRegNo
                : selectedRole === 'vendor'
                  ? vendorPermitNo
                  : selectedRole === 'municipal'
                    ? pmcEmployeeId
                    : opsPasscode,
        phoneOtpVerified: true,
        roleBadgeTitle:
          selectedRole === 'resident'
            ? 'Verified Pune Resident'
            : selectedRole === 'driver'
              ? 'PMC Licensed Tanker Pilot'
              : selectedRole === 'society'
                ? 'Certified Society Bulk Administrator'
                : selectedRole === 'vendor'
                  ? 'PMC Certified Commercial Fleet Carrier'
                  : selectedRole === 'municipal'
                    ? 'PMC Municipal Water Supply Magistrate'
                    : 'AquaFlow Platform Operations Arbiter',
        officialOrg:
          selectedRole === 'society'
            ? societyName
            : selectedRole === 'vendor'
              ? vendorCompany
              : selectedRole === 'municipal'
                ? 'Pune Municipal Corporation'
                : 'AquaFlow Pune Network',
        jurisdictionZone: zones.find((z) => z.id === zoneId)?.name || 'Baner - Aundh - Balewadi',
      },
      addresses:
        selectedRole === 'resident' || selectedRole === 'society'
          ? [
              {
                id: `addr-${Date.now()}`,
                label: selectedRole === 'resident' ? 'Registered Residence' : societyName,
                line: addressLine,
                lat: 18.5592,
                lng: 73.7868,
                zoneId: zoneId,
              },
            ]
          : [],
      // Role metadata
      vehicleNo: selectedRole === 'driver' ? vehicleNo : undefined,
      commercialDl: selectedRole === 'driver' ? commercialDl : undefined,
      societyRegNo: selectedRole === 'society' ? societyRegNo : undefined,
      flatsCount: selectedRole === 'society' ? parseInt(flatsCount, 10) || 50 : undefined,
      sumpCapacityL: selectedRole === 'society' ? parseInt(sumpCapacityL, 10) || 20000 : undefined,
      vendorPermitNo: selectedRole === 'vendor' ? vendorPermitNo : undefined,
      fleetSize: selectedRole === 'vendor' ? parseInt(fleetSize, 10) || 5 : undefined,
      pmcEmployeeId: selectedRole === 'municipal' ? pmcEmployeeId : undefined,
      designation: selectedRole === 'municipal' ? designation : undefined,
    };

    setCreatedUser(newUser);
    setStep('badge');
  };

  const handleLaunchDashboard = () => {
    if (createdUser) {
      registerUser(createdUser);
      onSuccess();
    }
  };

  return (
    <div className="w-full">
      {/* Wizard Progress Stepper */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
        <div className={`flex items-center gap-1.5 ${step === 'role' ? 'text-sky-700 font-semibold' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'role' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            1
          </span>
          <span>{t('step_role')}</span>
        </div>
        <div className="h-0.5 w-6 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step === 'details' ? 'text-sky-700 font-semibold' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'details' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            2
          </span>
          <span>{t('step_details')}</span>
        </div>
        <div className="h-0.5 w-6 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step === 'otp' ? 'text-sky-700 font-semibold' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'otp' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            3
          </span>
          <span>{t('step_otp')}</span>
        </div>
        <div className="h-0.5 w-6 bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step === 'badge' ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${step === 'badge' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
            4
          </span>
          <span>{t('step_badge')}</span>
        </div>
      </div>

      {/* STEP 1: ROLE SELECTION */}
      {step === 'role' && (
        <div>
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">{t('select_role_to_register')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentLanguage === 'mr'
                ? 'तुमच्या जबाबदारीनुसार योग्य श्रेणी निवडा. प्रत्येक भूमिकेला मनपा नियमांनुसार विशेष पडताळणी आवश्यक आहे.'
                : 'Choose your operational scope. Each role is issued a dedicated PMC digital credential.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {roleDefinitions.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedRole === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectRole(item.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-600 bg-sky-50/70 ring-1 ring-sky-600 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                        <span className="text-[10px] font-medium text-slate-500">{item.badgeText}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {currentLanguage === 'mr' ? '← आधीच खाते आहे? लॉग इन करा' : '← Already have an account? Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setStep('details')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <span>{t('next')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ROLE SPECIFIC CREDENTIALS */}
      {step === 'details' && (
        <form onSubmit={handleProceedToOtp} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('step_details')} · {roleDefinitions.find((r) => r.id === selectedRole)?.title}
              </h3>
              <p className="text-xs text-slate-500">
                {currentLanguage === 'mr'
                  ? 'कृपया अधिकृत ओळख आणि संपर्क माहिती भरा'
                  : 'Enter verified identity & contact credentials'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('role')}
              className="text-xs text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>{t('step_role')}</span>
            </button>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('full_name')} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aditya Jadhav"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('mobile_number')} *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                <input
                  type="text"
                  required
                  value={phone.replace(/^\+91\s*/, '')}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98220 12345"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('select_ward')} *</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.authority})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('password')} *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Role Tailored Inputs */}
          {selectedRole === 'resident' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t('delivery_address')} *</label>
              <textarea
                rows={2}
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Flat / House No, Society Name, Street, Landmark, Pune Pin Code"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

          {selectedRole === 'driver' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">{t('tanker_no')} *</label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="MH-12 RN 8842"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">{t('commercial_dl')} *</label>
                <input
                  type="text"
                  required
                  value={commercialDl}
                  onChange={(e) => setCommercialDl(e.target.value.toUpperCase())}
                  placeholder="MH12 20180045921"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          {selectedRole === 'society' && (
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">{t('society_name')} *</label>
                <input
                  type="text"
                  required
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                  placeholder="e.g. Sunrise Heights Co-op Housing Society"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('society_rera')} *</label>
                  <input
                    type="text"
                    required
                    value={societyRegNo}
                    onChange={(e) => setSocietyRegNo(e.target.value.toUpperCase())}
                    placeholder="PUN/HSG/14220"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('flats_count')} *</label>
                  <input
                    type="number"
                    required
                    min="2"
                    value={flatsCount}
                    onChange={(e) => setFlatsCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('sump_capacity')} *</label>
                  <input
                    type="number"
                    required
                    step="5000"
                    min="5000"
                    value={sumpCapacityL}
                    onChange={(e) => setSumpCapacityL(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">{t('delivery_address')} *</label>
                <input
                  type="text"
                  required
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Full Society Campus Address, Pune"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          {selectedRole === 'vendor' && (
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('vendor_company')} *</label>
                  <input
                    type="text"
                    required
                    value={vendorCompany}
                    onChange={(e) => setVendorCompany(e.target.value)}
                    placeholder="Shivneri Water Carriers"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('vendor_permit')} *</label>
                  <input
                    type="text"
                    required
                    value={vendorPermitNo}
                    onChange={(e) => setVendorPermitNo(e.target.value.toUpperCase())}
                    placeholder="PMC-WTR-PERMIT-449"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">{t('fleet_size')} *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {selectedRole === 'municipal' && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('pmc_employee_id')} *</label>
                  <input
                    type="text"
                    required
                    value={pmcEmployeeId}
                    onChange={(e) => setPmcEmployeeId(e.target.value.toUpperCase())}
                    placeholder="PMC-WTR-EXEC-092"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">{t('official_designation')} *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Executive Engineer - Water Rationing"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-indigo-700">
                {currentLanguage === 'mr'
                  ? '🔒 मनपा पाणी पुरवठा विभाग: झटपट ओटीपी पडताळणीनंतर अधिकृत कार्यकारी मॅजिस्ट्रेट बॅज जारी केला जाईल.'
                  : '🔒 Municipal Officer Portal: Instant credential activation with PMC Executive Magistrate digital seal.'}
              </p>
            </div>
          )}

          {selectedRole === 'ops' && (
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-2">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">{t('ops_passcode')} *</label>
                <input
                  type="text"
                  required
                  value={opsPasscode}
                  onChange={(e) => setOpsPasscode(e.target.value)}
                  placeholder="OPS-SEC-KEY-PUN-01"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('role')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← {t('back')}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <span>{t('continue_to_otp')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: 6-DIGIT MOBILE OTP SIMULATION */}
      {step === 'otp' && (
        <div className="space-y-4">
          <div className="text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t('step_otp')}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('otp_instruction')}{' '}
              <span className="font-semibold text-slate-900 font-mono">
                {phone.startsWith('+91') ? phone : `+91 ${phone}`}
              </span>
            </p>
          </div>

          {/* Simulated SMS Notification Banner */}
          <div className="p-3 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{t('otp_simulation_title')}</span>
              </span>
              <span>Just now · VK-PMCAQF</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <p className="text-xs text-slate-300">
                  {currentLanguage === 'mr'
                    ? 'अ‍ॅक्वाफ्लो पुणे पडताळणी कोड आहे:'
                    : 'Your AquaFlow Pune verification code is:'}
                </p>
                <div className="text-xl font-bold font-mono tracking-widest text-emerald-400 mt-0.5">
                  {generatedOtp}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? t('copied') : t('copy_upi_id')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6-Digit OTP Inputs */}
          <div>
            <div className="flex justify-center gap-2 sm:gap-3 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-xl font-bold font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 shadow-sm"
                />
              ))}
            </div>

            {otpError && <p className="text-center text-xs font-semibold text-rose-600 mb-2">{otpError}</p>}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('auto_fill_otp')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                  setGeneratedOtp(newOtp);
                  setOtpDigits(['', '', '', '', '', '']);
                  setOtpError('');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                {t('resend_code')}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ← {t('back')}
            </button>
            <button
              type="button"
              onClick={handleVerifyOtpAndActivate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t('instant_verify_cta')}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: INSTANT CIVIC BADGE CARD */}
      {step === 'badge' && createdUser && (
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('congratulations')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('badge_issued_desc')}</p>
          </div>

          {/* Official PMC Badge Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white text-left border border-slate-700 shadow-lg relative overflow-hidden">
            {/* Background water crest watermark */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
              <ShieldCheck className="w-48 h-48 text-white" />
            </div>

            <div className="flex items-start justify-between relative z-10 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <div className="text-[10px] tracking-wider uppercase text-sky-400 font-bold">
                    Pune Municipal Corporation
                  </div>
                  <div className="text-xs font-semibold text-slate-100">
                    {createdUser.verification?.roleBadgeTitle}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACTIVE · 100% TRUST
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 relative z-10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Authorized Identity</span>
                <span className="font-semibold text-slate-100">{createdUser.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Badge ID</span>
                <span className="font-mono font-bold text-sky-300">
                  {createdUser.verification?.verificationBadgeId}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Contact</span>
                <span className="font-mono text-slate-200">{createdUser.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Ward Jurisdiction</span>
                <span className="text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  <span className="truncate">{createdUser.verification?.jurisdictionZone}</span>
                </span>
              </div>
            </div>

            {createdUser.vehicleNo && (
              <div className="mt-3 pt-2 border-t border-slate-700/60 relative z-10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Assigned Tanker:</span>
                <span className="font-mono font-bold text-amber-300">{createdUser.vehicleNo}</span>
              </div>
            )}

            {createdUser.pmcEmployeeId && (
              <div className="mt-3 pt-2 border-t border-slate-700/60 relative z-10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Employee Code:</span>
                <span className="font-mono font-bold text-sky-300">{createdUser.pmcEmployeeId}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLaunchDashboard}
            className="w-full py-3 px-4 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('enter_dashboard')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
