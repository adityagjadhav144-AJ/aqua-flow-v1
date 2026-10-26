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
} from 'lucide-react';

export const OpsView: React.FC = () => {
  const { season, setSeason } = useAppStore();
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

  // Bookings per hour illustrative curve
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

  // Without vs With AquaFlow stats based on Season toggle
  const isSummer = season === 'summer';
  const comparison = {
    without: {
      fulfilment: isSummer ? '54%' : '78%',
      avgPrice: isSummer ? '₹2,650' : '₹1,450',
      avgWait: isSummer ? '6.5 hours' : '3.2 hours',
      qualityAssurance: '0% (Paper slips)',
    },
    with: {
      fulfilment: isSummer ? '98.2%' : '99.4%',
      avgPrice: isSummer ? '₹1,268 (Capped)' : '₹1,050',
      avgWait: isSummer ? '42 mins' : '22 mins',
      qualityAssurance: '100% Cryptographic PoD',
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              AquaFlow Platform Operations & Business Desk
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              Investor / Founder View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Real-time GMV, unit economics, demand heatmaps, and surge impact</p>
        </div>

        {/* Season Toggle in Ops */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSeason('normal')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              season === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Normal Season
          </button>
          <button
            onClick={() => setSeason('summer')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              season === 'summer'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame size={12} />
            <span>Summer Surge 🔥</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Merchandise Value (GMV)</div>
          <div className="text-2xl font-black text-slate-900">{formatINR(kpis.gmvPaise)}</div>
          <p className="text-[11px] text-emerald-600 font-semibold">+24.5% month-on-month</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commission Revenue (Net)</div>
          <div className="text-2xl font-black text-emerald-600">{formatINR(kpis.commissionRevenuePaise)}</div>
          <p className="text-[11px] text-slate-500">8% B2C • 6% Societies • 5% Pro</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active CHS Societies</div>
          <div className="text-2xl font-black text-cyan-900">{kpis.activeSocieties} Societies</div>
          <p className="text-[11px] text-slate-500">9,840 flats under recurring contract</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fair-Price Cap User Savings</div>
          <div className="text-2xl font-black text-emerald-700">{formatINR(kpis.totalSavedPaise)}</div>
          <p className="text-[11px] text-slate-500">Citizen exploitation prevented</p>
        </div>
      </div>

      {/* Without vs With AquaFlow Impact Panel */}
      <div className="bg-gradient-to-br from-slate-900 to-cyan-950 rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Zap size={18} className="text-cyan-400" />
              <span>Platform Impact: Unregulated Private Market vs AquaFlow</span>
            </h2>
            <p className="text-xs text-cyan-200">
              Scenario: {isSummer ? 'Peak Summer Water Crisis (May)' : 'Standard Operating Conditions'}
            </p>
          </div>
          <span className="text-xs font-bold text-cyan-300 bg-cyan-900/60 px-3 py-1 rounded-full border border-cyan-800">
            {isSummer ? 'Fair-Price Cap 1.25x Active' : 'Market Stabilized'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Without AquaFlow */}
          <div className="bg-rose-950/40 p-4 rounded-2xl border border-rose-800/40 space-y-3">
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>Unregulated Market (Offline / Phone calls)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-rose-900/40">
                <span className="text-slate-300">Fulfilment Rate:</span>
                <span className="font-extrabold text-rose-400">{comparison.without.fulfilment}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-rose-900/40">
                <span className="text-slate-300">Average 10k L Price:</span>
                <span className="font-extrabold text-rose-400">{comparison.without.avgPrice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-rose-900/40">
                <span className="text-slate-300">Wait Time / Uncertainty:</span>
                <span className="font-extrabold text-rose-400">{comparison.without.avgWait}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-300">Quality & Source Trail:</span>
                <span className="font-bold text-rose-400">{comparison.without.qualityAssurance}</span>
              </div>
            </div>
          </div>

          {/* With AquaFlow */}
          <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-800/40 space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>With AquaFlow Platform</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Fulfilment Rate:</span>
                <span className="font-extrabold text-emerald-400">{comparison.with.fulfilment}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Fair-Capped 10k L Price:</span>
                <span className="font-extrabold text-emerald-400">{comparison.with.avgPrice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-900/40">
                <span className="text-slate-300">Average ETA:</span>
                <span className="font-extrabold text-emerald-400">{comparison.with.avgWait}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-300">Quality & Source Trail:</span>
                <span className="font-bold text-emerald-400">{comparison.with.qualityAssurance}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Column Layout: Hourly Demand Chart & Revenue Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Bookings Per Hour */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Tanker Bookings Distribution (Hourly)</h3>
            <span className="text-[10px] text-slate-400">Past 24 Hours</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end gap-2 pt-6">
            {hourlyData.map((d) => {
              const heightPct = Math.round((d.orders / maxOrder) * 100);
              return (
                <div key={d.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">{d.orders}</span>
                  <div
                    className="w-full bg-gradient-to-t from-cyan-600 to-teal-400 rounded-t-lg transition-all duration-500 hover:brightness-110"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-400 font-mono">{d.hour}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Module 2: Multi-Stream Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Revenue By Stream (Illustrative)</h3>
            <span className="text-[10px] text-emerald-600 font-bold">4 Revenue Streams</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">B2C Tanker Escrow Commission (8%)</div>
                <div className="text-[10px] text-slate-500">Retail resident deliveries</div>
              </div>
              <span className="font-black text-slate-900">₹4,20,000 / mo</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Society CHS Recurring SaaS</div>
                <div className="text-[10px] text-slate-500">45 societies @ ₹2,999 - ₹5,999 / mo</div>
              </div>
              <span className="font-black text-slate-900">₹2,45,000 / mo</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Vendor Fleet Pro Subscriptions</div>
                <div className="text-[10px] text-slate-500">Fleet management & 2-Opt routing</div>
              </div>
              <span className="font-black text-slate-900">₹1,20,000 / mo</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Municipal B2G Smart Desk License</div>
                <div className="text-[10px] text-slate-500">PMC/PCMC division monitoring</div>
              </div>
              <span className="font-black text-slate-900">₹3,50,000 / mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Demand Heatmap */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm">Zone Demand Indices (Pune & PCMC)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                z.demandIndex >= 1.3
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-slate-50 border-slate-100 text-slate-800'
              }`}
            >
              <div className="font-bold truncate">{z.name.split('-')[0]}</div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-slate-500">{z.authority}</span>
                <span className="font-mono font-black text-sm">{z.demandIndex.toFixed(2)}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
