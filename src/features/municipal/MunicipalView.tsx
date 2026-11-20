import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { mockApi } from '../../services/mockApi';
import { translateBroadcastMessage } from '../../services/gemini';
import { LeafletMap } from '../../components/common/LeafletMap';
import { Complaint, ScheduleEvent, Zone, Vendor } from '../../types';
import {
  Building2,
  AlertTriangle,
  Radio,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  Truck,
  Users,
  ShieldAlert,
  Flame,
  ArrowRight,
  Droplet,
  Gauge,
  Activity,
  Award,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

interface MunicipalViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const MunicipalView: React.FC<MunicipalViewProps> = ({
  activeNav: externalNav,
  onNavChange: externalOnNavChange,
}) => {
  const { currentUser } = useAppStore();
  const [internalTab, setInternalTab] = useState<string>('home');
  const activeTab = externalNav || internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (externalOnNavChange) externalOnNavChange(tab);
  };

  const [zones, setZones] = useState<Zone[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEvent[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [flaggedVendors, setFlaggedVendors] = useState<Vendor[]>([]);

  // Publisher State
  const [pubZoneId, setPubZoneId] = useState('z2');
  const [pubType, setPubType] = useState<'supply' | 'outage' | 'maintenance' | 'emergency_hub'>('outage');
  const [msgEn, setMsgEn] = useState(
    'Scheduled maintenance of main conduit pipe on Baner-Pashan link. Tap supply suspended for 4 hours.'
  );
  const [msgMr, setMsgMr] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const refreshData = () => {
    const data = db.getData();
    setZones(data.zones);
    setSchedules(data.schedules);
    setComplaints(data.complaints);
    setFlaggedVendors(data.vendors.filter((v) => v.status === 'flagged'));
  };

  useEffect(() => {
    refreshData();
    const sub = eventBus.subscribe('simulation_tick', refreshData);
    return () => sub();
  }, []);

  const handleTranslate = async () => {
    if (!msgEn.trim()) return;
    setIsTranslating(true);
    try {
      const res = await translateBroadcastMessage(msgEn);
      setMsgMr(res.mr);
      showToast('Gemini AI translated message into Marathi!');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePublish = async () => {
    if (!msgEn.trim()) return;
    setIsPublishing(true);
    try {
      const created = await mockApi.createSchedule({
        zoneId: pubZoneId,
        type: pubType,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        message: {
          en: msgEn,
          mr: msgMr || msgEn,
          hi: msgEn,
        },
        createdBy: currentUser.id,
        status: 'published',
      });
      await mockApi.publishSchedule(created.id);
      showToast('Broadcast published across citizen notification push feeds!');
      refreshData();
    } finally {
      setIsPublishing(false);
    }
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
      {/* 1. TOP 5 ACTION CARDS RIBBON (Municipal Officer)               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Division Overview */}
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
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Division Overview</span>
              <span className="text-[10px] text-cyan-200 font-medium">PMC Water Works</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/80 shrink-0" />
        </button>

        {/* Card 2: Outage Publisher */}
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'broadcast'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Radio size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Broadcast Alerts</span>
              <span className="text-[10px] text-slate-400 font-medium">AI Translation</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 3: Citizen Grievances SLA */}
        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'complaints'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Grievance Desk</span>
              <span className="text-[10px] text-slate-400 font-medium">&lt; 4h SLA Target</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 4: Emergency Water Hubs */}
        <button
          onClick={() => setActiveTab('emergency_tanks')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'emergency_tanks'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Emergency Hubs</span>
              <span className="text-[10px] text-slate-400 font-medium">12 Free Points</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 5: Vendor Compliance */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 shadow-xs text-left text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">99.4%</span>
              <span className="text-[10px] text-emerald-600 font-bold">Price Cap Compliance</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 2-COLUMN DASHBOARD (Municipal View)                    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
        {/* Left Column (7/12): Hero City Supply + 4 Metrics + AI Publisher */}
        <div className="lg:col-span-7 space-y-5">
          {/* HERO PUNE WATER SUPPLY */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#063b4f] via-[#09576f] to-[#0c6b84] text-white p-5 sm:p-7 shadow-lg shadow-cyan-950/15 border border-cyan-800/40">
            <div className="relative z-10 space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 backdrop-blur-md border border-cyan-300/30 text-cyan-200 text-[11px] font-extrabold uppercase tracking-wider">
                <Building2 size={13} className="text-cyan-300" />
                <span>Pune Municipal Water Directorate</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  Khadakwasla Dam: 84% Capacity
                </h2>
                <p className="text-cyan-200 text-xs sm:text-sm font-semibold mt-0.5">
                  1,450 MLD daily supply active across 15 wards • Normal line pressure
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                <CheckCircle2 size={15} className="text-emerald-300" />
                <span>1 Scheduled maintenance window on Baner-Pashan link (Today 6-8:30 PM)</span>
              </div>
            </div>

            <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
              <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                Every Drop Counts ♡
              </span>
              <span className="text-xs text-cyan-200/80 font-mono">
                PMC Officer Anil G.
              </span>
            </div>
          </div>

          {/* 4 MUNICIPAL METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Droplet size={17} className="fill-cyan-500 text-cyan-600" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">City Inflow</span>
                <span className="text-sm font-black text-slate-900 block">1,450 MLD</span>
              </div>
              <div className="text-[10px] font-extrabold text-cyan-700">Parvati & Warje Works</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Open Grievances</span>
                <span className="text-sm font-black text-slate-900 block">{complaints.length} Under SLA</span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700">Avg Resolution: 2.1h</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Price Integrity</span>
                <span className="text-sm font-black text-slate-900 block">99.4% Clean</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-500">Zero Gouging Alerts</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Truck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Free Hubs</span>
                <span className="text-sm font-black text-slate-900 block">12 Deployed</span>
              </div>
              <div className="text-[10px] font-extrabold text-teal-700">Emergency Dispatches</div>
            </div>
          </div>

          {/* AI-POWERED OUTAGE BROADCAST PUBLISHER */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Citizen Outage Broadcast Desk (with Gemini AI)
                </h3>
              </div>
              <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-full">
                Multi-Ward Push
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Target Municipal Ward
                </label>
                <select
                  value={pubZoneId}
                  onChange={(e) => setPubZoneId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (Ward {z.id}) • Authority: {z.authority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Notice Message (English)
                </label>
                <textarea
                  value={msgEn}
                  onChange={(e) => setMsgEn(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {msgMr && (
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-950">
                  <span className="text-[10px] font-black text-cyan-800 uppercase block mb-0.5">मराठी भाषांतर (Gemini AI)</span>
                  {msgMr}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="px-4 py-2.5 rounded-xl border border-cyan-500 text-cyan-800 font-bold text-xs hover:bg-cyan-50 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles size={14} className="text-cyan-600" />
                  <span>{isTranslating ? 'Translating...' : 'Translate to Marathi'}</span>
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{isPublishing ? 'Publishing...' : 'Broadcast to Ward Citizens'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Grievance Feed + Quick Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* RECENT CITIZEN COMPLAINTS / LEAKS FEED */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock size={17} className="text-cyan-700" />
                <span>Citizen SLA Grievance Desk</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">{complaints.length} Active</span>
            </div>

            <div className="space-y-2.5">
              {complaints.slice(0, 3).map((c) => (
                <div key={c.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{c.userName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      {c.urgency.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MUNICIPAL QUICK CONTROLS */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-700" />
              <span>Division Actions</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => alert('Free Municipal Tanker deployed to Baner Slum Area Hub.')}
                className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 text-center hover:bg-cyan-100/70 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-cyan-950">Free Tanker</span>
                <span className="text-[10px] text-slate-500">Deploy Emergency</span>
              </button>

              <button
                onClick={() => alert('Exported Ward Inflow & Pressure Telemetry Log.')}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-slate-800">Export Report</span>
                <span className="text-[10px] text-slate-500">Download PMC PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
