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
} from 'lucide-react';
import { format } from 'date-fns';

export const SocietyView: React.FC = () => {
  const { currentUser, t } = useAppStore();
  const [society, setSociety] = useState<Society | null>(null);
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [societyBookings, setSocietyBookings] = useState<Booking[]>([]);
  const [gateMode, setGateMode] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<Booking | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const refreshData = () => {
    const data = db.getData();
    const soc = data.societies.find((s) => s.id === 'soc-1') || data.societies[0];
    setSociety(soc);
    setGateLogs(data.gateLogs.filter((g) => g.societyId === soc.id));
    setSocietyBookings(data.bookings.filter((b) => b.societyId === soc.id || b.customerId === soc.adminUserId));

    const pending = data.bookings.find(
      (b) => b.societyId === soc.id && b.price.total > soc.approvalThresholdPaise && b.status === 'REQUESTED'
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

  if (!society) return null;

  // Calculate daily per capita consumption vs 135 L/person benchmark (flats * 3.5 persons)
  const totalResidents = Math.round(society.flats * 3.5); // 840 persons
  const todayDeliveredL = 120000; // illustrative daily total
  const perPersonPerDayL = Math.round(todayDeliveredL / totalResidents); // ~142 L
  const isOverBenchmark = perPersonPerDayL > 150;

  // --- GATE MODE (GUARD VIEW WITH LARGE TOUCH BUTTONS) ---
  if (gateMode) {
    return (
      <div className="min-h-[85vh] bg-slate-900 text-white p-6 rounded-3xl flex flex-col justify-between select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs uppercase font-black text-cyan-400 tracking-wider">
              Gate Guard Mode • {society.name}
            </span>
            <h1 className="text-xl font-black text-white mt-1">Expected Tankers Today</h1>
          </div>
          <button
            onClick={() => setGateMode(false)}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Exit Guard Mode
          </button>
        </div>

        {/* Expected Tankers Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-slate-800/80 p-5 rounded-3xl border border-cyan-500/30 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-1 rounded-md">
                  MH-12 CD 9012
                </span>
                <h3 className="text-lg font-black text-white mt-2">10,000 L • Shree Ganesh Water</h3>
                <p className="text-xs text-slate-400">Driver: Anand Shinde (+91 98902 11223)</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full">
                PMC Parvati Verified
              </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <button
                onClick={async () => {
                  await mockApi.logGateEntry({
                    societyId: society.id,
                    bookingId: 'BK-2026-8820',
                    vehicleRegNo: 'MH-12 CD 9012',
                    driverName: 'Anand Shinde',
                    vendorName: 'Shree Ganesh Water Suppliers',
                    volumeL: 10000,
                    sourceBadge: 'PMC Parvati Verified',
                    verifiedBy: 'Guard Kailash',
                  });
                  refreshData();
                  showToast('✓ Vehicle MH-12 CD 9012 entry recorded with PMC source verified badge!');
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <CheckCircle2 size={18} />
                <span>Mark Gate IN</span>
              </button>

              <button
                onClick={() => showToast('✓ Vehicle marked Gate OUT. Delivery logged to society ledger.')}
                className="py-3 px-5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-2xl text-sm cursor-pointer"
              >
                Mark OUT
              </button>
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="bg-emerald-900/90 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-2xl text-xs font-semibold text-center my-2">
            {toastMsg}
          </div>
        )}

        <div className="text-xs text-slate-500 text-center">
          Security Gate 1 • Tap 'Mark Gate IN' to auto-verify against digital manifest
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{society.name}</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Pro Plan (240 Flats)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Balewadi High Street, Pune • Treasurer: Rajesh Patil</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setGateMode(true)}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <UserCheck size={16} className="text-cyan-400" />
            <span>Launch Gate Guard Mode</span>
          </button>
        </div>
      </div>

      {/* Pending Committee Approval Banner (if above threshold) */}
      {pendingApproval && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="font-extrabold text-amber-950 text-sm">
                Tanker Order Requires Committee Approval ({formatINR(pendingApproval.price.total)})
              </div>
              <p className="text-amber-800 mt-0.5">
                Amount exceeds society auto-approval limit of {formatINR(society.approvalThresholdPaise)}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                showToast('✓ Order approved by Society Treasurer. Matched to vendor.');
                setPendingApproval(null);
              }}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Approve Order
            </button>
            <button
              onClick={() => {
                mockApi.cancelBooking(pendingApproval.id, 'Rejected by society committee');
                setPendingApproval(null);
              }}
              className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily Consumption Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Per Person Consumption</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{perPersonPerDayL} L</span>
            <span className="text-xs text-slate-500">/ person / day</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            {isOverBenchmark ? (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>&gt;150 L Alert (Check for leaks)</span>
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Below 135 L Benchmark</span>
              </span>
            )}
          </div>
        </div>

        {/* Deliveries This Month */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deliveries This Month</div>
          <div className="text-2xl font-black text-cyan-900">28 Tankers</div>
          <p className="text-[11px] text-slate-500">280,000 Litres total delivered</p>
        </div>

        {/* Quality Audit Score */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source Verification</div>
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <p className="text-[11px] text-slate-500">All deliveries from verified PMC Parvati source</p>
        </div>

        {/* Society Plan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Society SaaS Plan</div>
          <div className="text-2xl font-black text-slate-900">₹5,999 / mo</div>
          <p className="text-[11px] text-cyan-700 font-semibold">Pro Tier (Up to 300 flats)</p>
        </div>
      </div>

      {/* Two Column Layout: Recurring Orders & Gate Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recurring Schedules */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Recurring Tanker Schedules</h3>
            <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-full">Automated</span>
          </div>

          <div className="space-y-3">
            {society.recurringOrders.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="font-extrabold text-xs text-slate-900">
                    {rec.volumeL.toLocaleString('en-IN')} L • {rec.time}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {rec.daysOfWeek.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Gate Logs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Security Gate In/Out Log</h3>
            <span className="text-[10px] text-slate-400">Gate 1</span>
          </div>

          <div className="space-y-3">
            {gateLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-extrabold text-slate-900">{log.vehicleRegNo}</div>
                  <div className="text-[11px] text-slate-500">
                    Driver: {log.driverName} • {log.sourceBadge}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-700">
                    {format(new Date(log.entryTs), 'hh:mm a')}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">Verified IN</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
