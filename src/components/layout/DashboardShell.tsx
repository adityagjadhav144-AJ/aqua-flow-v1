import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Role, Language } from '../../types';
import { formatINR } from '../../services/pricing';
import {
  Home,
  Navigation,
  Truck,
  Zap,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Wallet,
  Plus,
  ChevronDown,
  Globe,
  Menu,
  X,
  BadgeCheck,
  LogOut,
  Building2,
  Landmark,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  CreditCard,
} from 'lucide-react';

interface DashboardShellProps {
  children: React.ReactNode;
  activeNav: string;
  onNavChange: (navId: string) => void;
  onOpenDemoPanel?: () => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  activeNav,
  onNavChange,
  onOpenDemoPanel,
}) => {
  const {
    currentRole,
    currentUser,
    setRole,
    currentLanguage,
    setLanguage,
    unreadCount,
    toggleNotifCenter,
    toggleAquaBot,
    logout,
  } = useAppStore();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);

  // Role options for rapid testing
  const rolesList: { id: Role; label: string; icon: string; name: string }[] = [
    { id: 'resident', label: 'Resident', icon: '🏡', name: 'Neha Deshpande' },
    { id: 'driver', label: 'Tanker Driver', icon: '🚚', name: 'Santosh Jadhav' },
    { id: 'society', label: 'Society Admin', icon: '🏢', name: 'Rajesh Patil' },
    { id: 'vendor', label: 'Vendor Fleet', icon: '💼', name: 'Meena Shinde' },
    { id: 'municipal', label: 'Municipal Officer', icon: '🏛️', name: 'Anil Gokhale' },
    { id: 'ops', label: 'Platform Ops', icon: '📊', name: 'Ops Team' },
  ];

  // Role-specific navigation items matching the reference image layout
  const getNavItems = () => {
    switch (currentRole) {
      case 'resident':
        return [
          { id: 'home', label: currentLanguage === 'mr' ? 'मुख्यपृष्ठ' : 'Home', icon: Home },
          { id: 'radar', label: currentLanguage === 'mr' ? 'थेट टँकर रडार' : 'Live Tanker Radar', icon: Navigation },
          { id: 'book', label: currentLanguage === 'mr' ? 'टँकर बुक करा' : 'Book Tanker', icon: Truck },
          { id: 'schedule', label: currentLanguage === 'mr' ? 'मनपा पाणी व कपात' : 'Municipal Supply & Outages', icon: Zap },
          { id: 'orders', label: currentLanguage === 'mr' ? 'ऑर्डर इतिहास व पावत्या' : 'Order History & Tax Invoices', icon: FileText },
          { id: 'pool', label: currentLanguage === 'mr' ? 'कम्युनिटी पूल' : 'Community Pools', icon: Users },
          { id: 'settings', label: currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings },
          { id: 'support', label: currentLanguage === 'mr' ? 'मदत व सहाय्य' : 'Help & Support', icon: HelpCircle },
        ];
      case 'driver':
        return [
          { id: 'home', label: currentLanguage === 'mr' ? 'चालक डॅशबोर्ड' : 'Home / Trip Radar', icon: Home },
          { id: 'source_checkin', label: currentLanguage === 'mr' ? 'स्रोत तपासणी (Audit)' : 'Source Check-In', icon: ShieldCheck },
          { id: 'active_nav', label: currentLanguage === 'mr' ? 'थेट रस्ता दिशा' : 'Active Navigation', icon: Navigation },
          { id: 'scan_pod', label: currentLanguage === 'mr' ? 'QR कोड स्कॅन करा' : 'Scan Customer QR', icon: Truck },
          { id: 'earnings', label: currentLanguage === 'mr' ? 'कमाई व लेजर' : 'Earnings & Ledger', icon: FileText },
          { id: 'settings', label: currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings },
          { id: 'support', label: currentLanguage === 'mr' ? 'चालक मदत' : 'Driver Support', icon: HelpCircle },
        ];
      case 'society':
        return [
          { id: 'home', label: currentLanguage === 'mr' ? 'सोसायटी डॅशबोर्ड' : 'Society Home', icon: Home },
          { id: 'sump_levels', label: currentLanguage === 'mr' ? 'संप पाण्याची पातळी' : 'Sump Water Levels', icon: Droplets },
          { id: 'gate_mode', label: currentLanguage === 'mr' ? 'गेट सुरक्षा मोड' : 'Gate Guard Mode', icon: ShieldCheck },
          { id: 'recurring', label: currentLanguage === 'mr' ? 'नियमित वेळापत्रक' : 'Recurring Schedule', icon: Zap },
          { id: 'approvals', label: currentLanguage === 'mr' ? 'समिती मंजुरी' : 'Committee Approvals', icon: FileText },
          { id: 'flats', label: currentLanguage === 'mr' ? 'फ्लॅट्स व कोटा' : 'Flats & Member Quotas', icon: Users },
          { id: 'settings', label: currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings },
        ];
      case 'vendor':
        return [
          { id: 'home', label: currentLanguage === 'mr' ? 'फ्लीट मुख्यपृष्ठ' : 'Fleet Home', icon: Home },
          { id: 'fleet_roster', label: currentLanguage === 'mr' ? 'टँकर यादी (Roster)' : 'Tanker Roster', icon: Truck },
          { id: 'route_batching', label: currentLanguage === 'mr' ? '२-ऑप्ट मार्ग ऑप्टिमायझेशन' : 'Route Batching (2-Opt)', icon: Navigation },
          { id: 'payouts', label: currentLanguage === 'mr' ? 'चालक पेआउट्स' : 'Driver Payout Ledger', icon: FileText },
          { id: 'compliance', label: currentLanguage === 'mr' ? 'मनपा परवाने व स्रोत' : 'PMC Water Permits', icon: ShieldCheck },
          { id: 'settings', label: currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings },
        ];
      case 'municipal':
        return [
          { id: 'home', label: currentLanguage === 'mr' ? 'विभाग मुख्यपृष्ठ' : 'Division Overview', icon: Home },
          { id: 'broadcast', label: currentLanguage === 'mr' ? 'नागरिक सूचना प्रसार' : 'Outage Broadcast Publisher', icon: Zap },
          { id: 'complaints', label: currentLanguage === 'mr' ? 'तक्रार निवारण (SLA)' : 'Citizen Grievance Desk', icon: FileText },
          { id: 'emergency_tanks', label: currentLanguage === 'mr' ? 'मोफत आपत्कालीन टँकर' : 'Emergency Water Hubs', icon: Truck },
          { id: 'suspended_vendors', label: currentLanguage === 'mr' ? 'निलंबित व्हेंडर्स' : 'Suspended Vendors', icon: ShieldCheck },
          { id: 'settings', label: currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings },
        ];
      case 'ops':
        return [
          { id: 'home', label: currentLanguage === 'mr' ? 'ऑप्स मुख्यपृष्ठ' : 'Operations Home', icon: Home },
          { id: 'financials', label: currentLanguage === 'mr' ? 'जीएमव्ही व कमिशन' : 'GMV & Unit Economics', icon: FileText },
          { id: 'heatmap', label: currentLanguage === 'mr' ? 'मागणी हीटमॅप (Wards)' : 'Zone Demand Heatmap', icon: Navigation },
          { id: 'fair_cap', label: currentLanguage === 'mr' ? 'वाजवी दर मर्यादा' : 'Fair-Cap Price Analytics', icon: ShieldCheck },
          { id: 'health', label: currentLanguage === 'mr' ? 'सिस्टम आरोग्य' : 'System Telemetry', icon: Zap },
          { id: 'settings', label: currentLanguage === 'mr' ? 'सेटिंग्ज' : 'Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  // Top Up Wallet Handler
  const handleTopUpWallet = () => {
    useAppStore.setState((state) => ({
      currentUser: {
        ...state.currentUser,
        walletPaise: (state.currentUser.walletPaise || 150000) + topUpAmount * 100,
      },
    }));
    setShowTopUpModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5F8] via-[#E4F3F7] to-[#DDF0F7] text-slate-800 font-sans antialiased flex flex-col lg:flex-row relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* ============================================================ */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Matching Reference Design)        */}
      {/* ============================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 xl:w-72 bg-white/90 backdrop-blur-xl border-r border-sky-100 shadow-xl shadow-cyan-950/5 flex flex-col justify-between p-4 sm:p-5 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Top Brand Lockup */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-1 flex items-center justify-center text-white shadow-md shadow-cyan-500/25 shrink-0">
                <img
                  src="/assets/aistudio/image_a469dbfe.png"
                  alt="AquaFlow Icon"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                  <span>AquaFlow</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-cyan-100 text-cyan-800">
                    Pune
                  </span>
                </div>
                <p className="text-[10px] text-cyan-800/80 font-medium tracking-tight">
                  Smart Water • Better Tomorrow ♡
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 lg:hidden cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavChange(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-md shadow-cyan-500/25 font-bold translate-x-1'
                      : 'text-slate-600 hover:bg-sky-50 hover:text-cyan-900'
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 transition-transform ${
                      isActive ? 'stroke-[2.5] scale-110' : 'text-slate-400 group-hover:text-cyan-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom City Silhouette Illustration Card (from reference image) */}
        <div className="mt-6 pt-4 border-t border-sky-100/80">
          <div className="rounded-2xl bg-gradient-to-b from-sky-50/80 to-cyan-100/60 p-3.5 border border-sky-200/60 text-center relative overflow-hidden group shadow-2xs">
            {/* Artistic vector skyline backdrop */}
            <div className="h-12 w-full flex items-end justify-center gap-1 opacity-70 mb-1">
              <div className="w-2.5 h-7 bg-cyan-600/40 rounded-t-xs" />
              <div className="w-3.5 h-10 bg-cyan-700/50 rounded-t-xs" />
              <div className="w-2 h-6 bg-teal-600/40 rounded-t-xs" />
              <div className="w-4 h-12 bg-cyan-800/60 rounded-t-xs" />
              <div className="w-3 h-8 bg-cyan-600/50 rounded-t-xs" />
              <div className="w-2.5 h-5 bg-teal-500/40 rounded-t-xs" />
            </div>

            <div className="text-xs font-black text-cyan-950 tracking-tight font-serif italic">
              Every Drop Counts ♡
            </div>
            <p className="text-[10px] text-cyan-800 font-medium mt-0.5">
              PMC Parvati • Warje • Cantonment
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ============================================================ */}
      {/* 2. RIGHT / MAIN DASHBOARD AREA (Top Bar + Dynamic View)       */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar (Matching Reference Greeting & Wallet Pill) */}
        <header className="sticky top-0 z-30 bg-[#EAF5F8]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between border-b border-sky-100/60 shadow-2xs">
          {/* Left Greeting & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 lg:hidden cursor-pointer shadow-xs"
              title="Open Navigation"
            >
              <Menu size={18} />
            </button>

            {/* User Avatar Circle & Persona Greeting */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0) : 'N'}
              </div>
              <div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>
                    {currentLanguage === 'mr' ? 'शुभ संध्या' : 'Good Evening'},{' '}
                    {currentUser?.name ? currentUser.name.split(' ')[0] : 'Neha'}! 👋
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  {currentLanguage === 'mr'
                    ? 'आपल्या शहराला पाणीदार आणि सुरक्षित ठेवूया. 🌿'
                    : "Let's keep our city hydrated together. 🌿"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Wallet Pill, Notifications, Language, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wallet Pill (Matching reference: Wallet ₹1,500 [Top Up]) */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-full border border-sky-100 shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Wallet size={14} className="text-teal-600" />
              </div>
              <div className="text-xs">
                <span className="text-[10px] text-slate-400 block font-bold leading-none">Wallet</span>
                <span className="font-extrabold text-slate-900 text-xs">
                  {formatINR(currentUser?.walletPaise || 150000)}
                </span>
              </div>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="py-1 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-full text-[10px] tracking-wide cursor-pointer transition-colors shadow-xs"
              >
                Top Up
              </button>
            </div>

            {/* Notification Bell with Badge */}
            <button
              onClick={toggleNotifCenter}
              className="relative p-2 rounded-full bg-white border border-sky-100 text-slate-600 hover:text-cyan-800 hover:bg-sky-50 transition-colors cursor-pointer shadow-xs"
              title="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 p-1 bg-white rounded-full border border-sky-100 shadow-xs text-xs font-bold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  currentLanguage === 'en'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  currentLanguage === 'mr'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* User Profile Capsule & Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-white border border-sky-100 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                title="Switch Role or Profile"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'N'}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden md:inline truncate max-w-[100px]">
                  {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
                </span>
                <ChevronDown size={14} className="text-slate-400 hidden sm:inline" />
              </button>

              {/* Role Dropdown Menu */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-sky-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active User Persona
                    </p>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{currentUser?.name}</p>
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      Role: {currentRole.toUpperCase()}
                    </span>
                  </div>

                  {/* Switch Persona Options */}
                  <div className="py-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">
                      Switch Role View
                    </p>
                    {rolesList.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          currentRole === r.id
                            ? 'bg-cyan-50 text-cyan-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{r.icon}</span>
                          <span>{r.label}</span>
                        </span>
                        {currentRole === r.id && (
                          <BadgeCheck size={14} className="text-cyan-600" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out to Login Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 space-y-6">
          {children}
        </main>
      </div>

      {/* Wallet Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Wallet className="w-5 h-5 text-teal-600" />
                <span>Top Up AquaFlow Wallet</span>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Add funds for 1-click escrow tanker orders and fair-capped dispatches.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                    topUpAmount === amt
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleTopUpWallet}
              className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard size={15} />
              <span>Simulate Instant UPI Credit (₹{topUpAmount})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
