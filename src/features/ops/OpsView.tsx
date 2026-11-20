import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { mockApi } from '../../services/mockApi';
import { formatINR } from '../../services/pricing';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Truck,
  Clock,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  Radio,
  Layers,
  RotateCcw,
} from 'lucide-react';

interface OpsViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const OpsView: React.FC<OpsViewProps> = ({
  activeNav: externalNav,
  onNavChange: externalOnNavChange,
}) => {
  const { season, setSeason } = useAppStore();
  const [internalTab, setInternalTab] = useState<string>('home');
  const activeTab = externalNav || internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (externalOnNavChange) externalOnNavChange(tab);
  };

  const [kpis, setKpis] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);

  const refreshData = async () => {
    const kpiData = await mockApi.getOpsKpis();
    setKpis(kpiData);
    setZones(db.getData().zones);
  };

  useEffect(() => {
    refreshData();
    const sub = eventBus.subscribe('simulation_tick', refreshData);
    return () => sub();
  }, []);

  if (!kpis) return null;

  const hourlyData = [
    { hour: '06:00', orders: 48 },
    { hour: '08:00', orders: 92 },
    { hour: '10:00', orders: 135 },
    { hour: '12:00', orders: 74 },
    { hour: '14:00', orders: 62 },
    { hour: '16:00', orders: 88 },
    { hour: '18:00', orders: 142 },
    { hour: '20:00', orders: 85 },
  ];
  const maxOrder = Math.max(...hourlyData.map((d) => d.orders));

  const isSummer = season === 'summer';
  const comparison = {
    without: {
      fulfilment: isSummer ? '54%' : '78%',
      avgPrice: isSummer ? '₹2,650' : '₹1,450',
      avgWait: isSummer ? '6.5 hours' : '3.2 hours',
      qualityAssurance: '0% (Paper slips)',
    },
    withAquaFlow: {
      fulfilment: isSummer ? '91%' : '98%',
      avgPrice: isSummer ? '₹1,420 (Fair-Capped)' : '₹1,020',
      avgWait: isSummer ? '42 minutes' : '28 minutes',
      qualityAssurance: '100% (PMC GPS Geofence & QR PoD)',
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 select-none text-slate-800">
      {/* ============================================================== */}
      {/* 1. TOP 5 ACTION CARDS RIBBON (Platform Operations)             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: GMV Analytics */}
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
              <TrendingUp size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">GMV Analytics</span>
              <span className="text-[10px] text-cyan-200 font-medium">{formatINR(kpis.gmvPaise)}</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/80 shrink-0" />
        </button>

        {/* Card 2: Summer Surge Controls */}
        <button
          onClick={() => setSeason(isSummer ? 'normal' : 'summer')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            isSummer
              ? 'bg-amber-50 border-2 border-amber-500 shadow-md text-amber-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSummer ? 'bg-amber-100 text-amber-700' : 'bg-cyan-50 text-cyan-700'}`}>
              <Flame size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">
                {isSummer ? 'Summer Surge' : 'Normal Season'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Click to Toggle</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 3: Demand Heatmap */}
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'heatmap'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Layers size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Zone Heatmap</span>
              <span className="text-[10px] text-slate-400 font-medium">3 Wards Monitored</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 4: Fair-Cap Savings */}
        <button
          onClick={() => setActiveTab('fair_cap')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'fair_cap'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Citizen Savings</span>
              <span className="text-[10px] text-slate-400 font-medium">₹4.8L Protected</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 5: System Telemetry */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 shadow-xs text-left text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Zap size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">99.98%</span>
              <span className="text-[10px] text-emerald-600 font-bold">System Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 2-COLUMN DASHBOARD (Ops View)                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
        {/* Left Column (7/12): Hero Pricing Engine + 4 Metrics + Hourly Bar Chart */}
        <div className="lg:col-span-7 space-y-5">
          {/* HERO OPS STATUS */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#063b4f] via-[#09576f] to-[#0c6b84] text-white p-5 sm:p-7 shadow-lg shadow-cyan-950/15 border border-cyan-800/40">
            <div className="relative z-10 space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 backdrop-blur-md border border-cyan-300/30 text-cyan-200 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldCheck size={13} className="text-cyan-300" />
                <span>PMC Fair-Price Pricing Algorithm Engine</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  ₹1,400 Fair-Cap Enforced
                </h2>
                <p className="text-cyan-200 text-xs sm:text-sm font-semibold mt-0.5">
                  Algorithm prevented ₹4,82,000 in unorganized cartel price gouging this month
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                <CheckCircle2 size={15} className="text-emerald-300" />
                <span>All 42 active tankers bound to real-time distance and escrow settlements</span>
              </div>
            </div>

            <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
              <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                Every Drop Counts ♡
              </span>
              <span className="text-xs text-cyan-200/80 font-mono">
                Platform Operations Core
              </span>
            </div>
          </div>

          {/* 4 OPS METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <DollarSign size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">24h GMV</span>
                <span className="text-sm font-black text-slate-900 block">{formatINR(kpis.gmvPaise)}</span>
              </div>
              <div className="text-[10px] font-extrabold text-cyan-700">Commission: 6%</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Truck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">City Tankers</span>
                <span className="text-sm font-black text-slate-900 block">{kpis.activeTankers} Online</span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700">Across 3 Corridors</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Avg Delivery</span>
                <span className="text-sm font-black text-slate-900 block">{kpis.avgDeliveryMinutes} mins</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-500">&lt; 2h SLA Target</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Activity size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Fulfilment</span>
                <span className="text-sm font-black text-slate-900 block">97.8%</span>
              </div>
              <div className="text-[10px] font-extrabold text-teal-700">Zero Unmet Orders</div>
            </div>
          </div>

          {/* HOURLY DEMAND DISTRIBUTION CHART */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Hourly Water Order Velocity (Pune Metropolitan)
                </h3>
              </div>
              <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-full">
                Peak: 10:00 AM & 6:00 PM
              </span>
            </div>

            <div className="pt-4 flex items-end justify-between gap-2 h-36 border-b border-slate-100 pb-2">
              {hourlyData.map((d) => {
                const heightPct = Math.round((d.orders / maxOrder) * 100);
                return (
                  <div key={d.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-slate-400">{d.orders}</span>
                    <div
                      className="w-full bg-gradient-to-t from-cyan-600 to-teal-400 rounded-t-lg transition-all duration-300 hover:brightness-110"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-bold text-slate-500">{d.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Without vs With Matrix + Season Controls */}
        <div className="lg:col-span-5 space-y-5">
          {/* WITHOUT VS WITH AQUAFLOW MATRIX */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck size={17} className="text-cyan-700" />
                <span>Market Impact Analysis</span>
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {isSummer ? 'Summer Peak' : 'Standard'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
                <span className="font-extrabold text-rose-900 block mb-1">Unorganized Cartel Model</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-rose-800">
                  <span>Price: {comparison.without.avgPrice}</span>
                  <span>Wait: {comparison.without.avgWait}</span>
                  <span>Fulfill: {comparison.without.fulfilment}</span>
                  <span>Quality: {comparison.without.qualityAssurance}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="font-extrabold text-emerald-950 block mb-1">With AquaFlow Platform</span>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-800">
                  <span>Price: {comparison.withAquaFlow.avgPrice}</span>
                  <span>Wait: {comparison.withAquaFlow.avgWait}</span>
                  <span>Fulfill: {comparison.withAquaFlow.fulfilment}</span>
                  <span>Quality: {comparison.withAquaFlow.qualityAssurance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* OPS CONTROLS */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-700" />
              <span>Platform Core Controls</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSeason(isSummer ? 'normal' : 'summer')}
                className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-center hover:bg-amber-100/70 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-amber-950">
                  {isSummer ? 'End Summer' : 'Trigger Summer'}
                </span>
                <span className="text-[10px] text-slate-500">Toggle Surge Caps</span>
              </button>

              <button
                onClick={() => {
                  db.reset();
                  refreshData();
                  alert('Reset simulated database state to baseline.');
                }}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-slate-800">Reset State</span>
                <span className="text-[10px] text-slate-500">Restore Baseline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
