import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { mockApi } from '../../services/mockApi';
import { formatINR } from '../../services/pricing';
import { Booking, GateLog, Society } from '../../types';
import {
  Building2,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  TrendingUp,
  FileText,
  UserCheck,
  Check,
  X,
  Plus,
  ArrowRight,
  Gauge,
  Activity,
  Award,
  Sparkles,
  Truck,
  Layers,
  ChevronRight,
  Droplet,
} from 'lucide-react';
import { format } from 'date-fns';

interface SocietyViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const SocietyView: React.FC<SocietyViewProps> = ({
  activeNav: externalNav,
  onNavChange: externalOnNavChange,
}) => {
  const { currentUser, t } = useAppStore();
  const [internalTab, setInternalTab] = useState<string>('home');
  const activeTab = externalNav || internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (externalOnNavChange) externalOnNavChange(tab);
  };

  const [society, setSociety] = useState<Society | null>(null);
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [societyBookings, setSocietyBookings] = useState<Booking[]>([]);
  const [gateMode, setGateMode] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<Booking | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAutoRefillModal, setShowAutoRefillModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const refreshData = () => {
    const data = db.getData();
    const soc = data.societies.find((s) => s.id === 'soc-1') || data.societies[0];
    setSociety(soc);
    setGateLogs(data.gateLogs.filter((g) => g.societyId === soc?.id));
    setSocietyBookings(data.bookings.filter((b) => b.societyId === soc?.id || b.customerId === soc?.adminUserId));

    const pending = data.bookings.find(
      (b) => b.societyId === soc?.id && b.price.total > soc?.approvalThresholdPaise && b.status === 'REQUESTED'
    );
    setPendingApproval(pending || null);
  };

  useEffect(() => {
    refreshData();
    const sub1 = eventBus.subscribe('simulation_tick', refreshData);
    const sub2 = eventBus.subscribe('booking_status_changed', refreshData);
    return () => {
      sub1();
      sub2();
    };
  }, []);

  const sumpCapacityL = 36000;
  const sumpCurrentL = 24500;
  const sumpPct = Math.round((sumpCurrentL / sumpCapacityL) * 100);

  const handleApproveBooking = (bookingId: string) => {
    mockApi.updateBookingStatus(bookingId, 'ACCEPTED');
    showToast('Society Committee sign-off recorded! Tanker dispatched to vendor fleet.');
    refreshData();
  };

  const handleLogGateEntry = async (bookingId: string) => {
    await mockApi.logGateEntry({
      societyId: society?.id || 'soc-1',
      bookingId,
      vehicleRegNo: 'MH-12 AB 4821',
      driverName: 'Santosh Jadhav',
      vendorName: 'Shree Ganesh Water Suppliers',
      verifiedBy: 'Gate Security Guard',
    });
    showToast('Gate security verification logged successfully!');
    refreshData();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 select-none text-slate-800">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-cyan-400 text-xs font-bold animate-in slide-in-from-top-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP 5 ACTION CARDS RIBBON (Matching reference aesthetic)   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Sump Levels */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'home'
              ? 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white shadow-md shadow-cyan-900/20 scale-[1.02]'
              : 'bg-gradient-to-r from-[#0d6b82] to-[#0a5265] text-white hover:brightness-105 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Droplets size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Sump Levels</span>
              <span className="text-[10px] text-cyan-200 font-medium">{sumpPct}% Capacity</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/80 shrink-0" />
        </button>

        {/* Card 2: Gate Guard Mode */}
        <button
          onClick={() => setGateMode(!gateMode)}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            gateMode
              ? 'bg-cyan-50 border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Gate Mode</span>
              <span className="text-[10px] text-slate-400 font-medium">{gateMode ? 'Active (Live)' : 'Standby'}</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 3: Recurring Schedule */}
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'recurring'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Schedule</span>
              <span className="text-[10px] text-slate-400 font-medium">Daily 7:00 PM</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 4: Approvals */}
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'approvals'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Approvals</span>
              <span className="text-[10px] text-slate-400 font-medium">Committee 2-Sign</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 5: Monthly Invoices */}
        <button
          onClick={() => setActiveTab('invoices')}
          className="col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 shadow-xs text-left text-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Invoices</span>
              <span className="text-[10px] text-slate-400 font-medium">GST Statements</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 2-COLUMN DASHBOARD (Society View)                      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
        {/* Left Column (7/12): Hero Sump Status + 4 Metrics + Sump Visualizer */}
        <div className="lg:col-span-7 space-y-5">
          {/* HERO SUMP STATUS CARD */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#063b4f] via-[#09576f] to-[#0c6b84] text-white p-5 sm:p-7 shadow-lg shadow-cyan-950/15 border border-cyan-800/40">
            <div className="relative z-10 space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 backdrop-blur-md border border-cyan-300/30 text-cyan-200 text-[11px] font-extrabold uppercase tracking-wider">
                <Building2 size={13} className="text-cyan-300" />
                <span>Rohan Leher Society • Baner</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  Sump Level: {sumpPct}% Optimal
                </h2>
                <p className="text-cyan-200 text-xs sm:text-sm font-semibold mt-0.5">
                  {sumpCurrentL.toLocaleString()} / {sumpCapacityL.toLocaleString()} Litres • 18 Hours Reserve
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                <CheckCircle2 size={15} className="text-emerald-300" />
                <span>Next automated top-up scheduled for 7:00 PM today</span>
              </div>

              <div className="pt-1 flex items-center gap-3">
                <button
                  onClick={() => setShowAutoRefillModal(true)}
                  className="px-5 py-2 rounded-full bg-white text-cyan-950 text-xs font-black hover:bg-cyan-50 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Trigger Auto-Refill</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
              <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                Every Drop Counts ♡
              </span>
              <span className="text-xs text-cyan-200/80 font-mono">
                120 Flats Registered
              </span>
            </div>
          </div>

          {/* 4 STATUS METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Droplet size={17} className="fill-cyan-500 text-cyan-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Water Quality</span>
                <span className="text-sm font-black text-slate-900 block">TDS 145 ppm</span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700">Safe Domestic</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Gauge size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Sump Health</span>
                <span className="text-sm font-black text-slate-900 block">{sumpPct}% Full</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-500">Threshold: 30%</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Truck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Tankers Active</span>
                <span className="text-sm font-black text-slate-900 block">1 En Route</span>
              </div>
              <div className="text-[10px] font-extrabold text-cyan-700">ETA: 35 mins</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Award size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Society Budget</span>
                <span className="text-sm font-black text-slate-900 block">₹38,200</span>
              </div>
              <div className="text-[10px] font-extrabold text-teal-700">Escrow Reserved</div>
            </div>
          </div>

          {/* SUMP TANK LEVEL VISUALIZER */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Underground Sump Level Visualizer (IoT Telemetry)
                </h3>
              </div>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full">
                Live Sensor Telemetry
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Current Reserve: {sumpCurrentL.toLocaleString()} L</span>
                <span>Max Capacity: {sumpCapacityL.toLocaleString()} L</span>
              </div>

              {/* Graphical Tank Level Indicator */}
              <div className="h-6 w-full rounded-full bg-slate-200 overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-500 relative"
                  style={{ width: `${sumpPct}%` }}
                >
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-white">
                    {sumpPct}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>0 L (Empty)</span>
                <span className="text-amber-600 font-bold">Auto-Refill Trigger: 10,800 L (30%)</span>
                <span>36,000 L (Full)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Gate Guard Mode + Approvals + Quick Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. GATE GUARD CHECK-IN SCANNER CARD */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Gate Security Mode
                </h3>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${gateMode ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {gateMode ? 'Guard Active' : 'Standby'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Security guards verify PMC licensed water permits, tanker seal, and vehicle registration before admitting tankers.
            </p>

            <button
              onClick={() => handleLogGateEntry('BK-9481')}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={15} />
              <span>Log Tanker Gate Entry (MH-12 AB 4821)</span>
            </button>
          </div>

          {/* 2. COMMITTEE DUAL SIGN-OFF APPROVAL CARD */}
          {pendingApproval ? (
            <div className="rounded-3xl bg-amber-50 p-5 border border-amber-200 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Committee Sign-Off Required (&gt; ₹5,000)</span>
              </div>
              <p className="text-xs text-amber-800">
                Order for {pendingApproval.volumeL.toLocaleString()} L ({formatINR(pendingApproval.price.total)}) requires society chairman sign-off.
              </p>
              <button
                onClick={() => handleApproveBooking(pendingApproval.id)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Approve & Dispatch Tanker
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>All Committee Approvals Cleared</span>
              </div>
              <p className="text-xs text-slate-500">
                Zero pending budget disputes. All automated dispatches conform to AGM guidelines.
              </p>
            </div>
          )}

          {/* 3. SOCIETY QUICK CONTROLS */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-700" />
              <span>Society Controls</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowAutoRefillModal(true)}
                className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 text-center hover:bg-cyan-100/70 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-cyan-950">Auto-Refill</span>
                <span className="text-[10px] text-slate-500">Schedule Rules</span>
              </button>

              <button
                onClick={() => alert('Downloaded Rohan Leher Society Water Ledger & Invoices.')}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-slate-800">Export GST</span>
                <span className="text-[10px] text-slate-500">Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Refill Modal */}
      {showAutoRefillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-sky-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Droplets className="w-5 h-5 text-cyan-600" />
                <span>Configure Auto-Refill Rules</span>
              </div>
              <button
                onClick={() => setShowAutoRefillModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              When sump drops below 30% (10,800 L), automatically order a 10,000 L tanker from Shree Ganesh Water Suppliers at PMC capped price.
            </p>

            <button
              onClick={() => {
                showToast('Auto-refill rules saved and armed!');
                setShowAutoRefillModal(false);
              }}
              className="w-full py-2.5 rounded-2xl bg-cyan-600 text-white font-black text-xs cursor-pointer hover:bg-cyan-700"
            >
              Save Auto-Refill Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
