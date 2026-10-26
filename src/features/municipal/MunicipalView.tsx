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
} from 'lucide-react';
import { format } from 'date-fns';

export const MunicipalView: React.FC = () => {
  const { currentUser } = useAppStore();
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
  const [msgHi, setMsgHi] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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

  // AI Translation Handler
  const handleAiTranslate = async () => {
    if (!msgEn.trim()) return;
    setIsTranslating(true);
    try {
      const translated = await translateBroadcastMessage(msgEn);
      setMsgMr(translated.mr);
      setMsgHi(translated.hi);
    } finally {
      setIsTranslating(false);
    }
  };

  // Publish Event Broadcast
  const handlePublishBroadcast = async () => {
    setIsPublishing(true);
    try {
      const newEvent = await mockApi.createSchedule({
        zoneId: pubZoneId,
        type: pubType,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        message: {
          en: msgEn,
          mr: msgMr || msgEn,
          hi: msgHi || msgEn,
        },
        createdBy: 'PMC Zone Water Control',
        status: 'draft',
      });

      await mockApi.publishSchedule(newEvent.id);
      alert('Alert successfully published! Push notifications and simulated WhatsApp messages sent to 14,200 residents in zone.');
      refreshData();
    } finally {
      setIsPublishing(false);
    }
  };

  // Dispatch Emergency Tanker for Complaint
  const handleDispatchEmergencyTanker = async (complaintId: string) => {
    await mockApi.updateComplaintStatus(complaintId, 'in_progress', 'Emergency Tanker MH-12 PMC 001');
    alert('Emergency Free Municipal Tanker dispatched to complaint location. Citizen notified.');
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-900 to-slate-900 text-white font-black flex items-center justify-center text-xl">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Pune Municipal Corporation (PMC)
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                Water Supply Dept (B2G Desk)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Zone Control: Parvati, Warje, Vadgaon & Cantonment Divisions (Zones 1–8)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            PMC Network Status: Operational
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Reach</div>
          <div className="text-2xl font-black text-slate-900">48,200</div>
          <p className="text-[11px] text-slate-500">Subscribed app & WhatsApp channels</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open Complaints</div>
          <div className="text-2xl font-black text-rose-600">{complaints.filter((c) => c.status !== 'resolved').length}</div>
          <p className="text-[11px] text-slate-500">2 Contamination tickets (4h SLA)</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flagged Private Vendors</div>
          <div className="text-2xl font-black text-amber-600">{flaggedVendors.length}</div>
          <p className="text-[11px] text-slate-500">Suspended for water quality violations</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fair-Cap Compliance</div>
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <p className="text-[11px] text-slate-500">Zero price gouging reports on platform</p>
        </div>
      </div>

      {/* 2 Column Layout: Schedule Publisher & Complaints Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Broadcast Publisher with AI Translation */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Schedule & Outage Broadcast Publisher</h3>
              <p className="text-[11px] text-slate-500">Multilingual push & WhatsApp citizen dispatch</p>
            </div>
            <button
              onClick={handleAiTranslate}
              disabled={isTranslating}
              className="py-1.5 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-cyan-600" />
              <span>{isTranslating ? 'Translating...' : 'Translate with AI'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Zone</label>
                <select
                  value={pubZoneId}
                  onChange={(e) => setPubZoneId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.authority})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Type</label>
                <select
                  value={pubType}
                  onChange={(e) => setPubType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  <option value="supply">Municipal Supply Window</option>
                  <option value="outage">Outage / Shutdown Alert</option>
                  <option value="maintenance">Maintenance Work</option>
                  <option value="emergency_hub">Emergency Water Hub</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">English Message</label>
              <textarea
                rows={2}
                value={msgEn}
                onChange={(e) => setMsgEn(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {msgMr && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">मराठी भाषांतर (Marathi)</label>
                <textarea
                  rows={2}
                  value={msgMr}
                  onChange={(e) => setMsgMr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            )}

            {msgHi && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">हिंदी अनुवाद (Hindi)</label>
                <textarea
                  rows={2}
                  value={msgHi}
                  onChange={(e) => setMsgHi(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            )}

            <button
              onClick={handlePublishBroadcast}
              disabled={isPublishing}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>Publish & Broadcast to Residents</span>
            </button>
          </div>
        </div>

        {/* Module B: Citizen Complaint Desk with SLA Timers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Citizen Complaints & Emergency Hubs</h3>
              <p className="text-[11px] text-slate-500">Real-time SLA tracking and emergency tanker dispatch</p>
            </div>
          </div>

          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        c.urgency === 'high'
                          ? 'bg-rose-100 text-rose-800'
                          : c.urgency === 'med'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.urgency} Urgency
                    </span>
                    <span className="font-bold text-slate-800">{c.userName} ({c.userPhone})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    SLA: {format(new Date(c.slaDueAt), 'hh:mm a')}
                  </span>
                </div>

                <p className="text-slate-700 leading-snug">{c.text}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-cyan-800 uppercase">
                    Status: {c.status.replace('_', ' ')}
                  </span>
                  {c.status !== 'resolved' && (
                    <button
                      onClick={() => handleDispatchEmergencyTanker(c.id)}
                      className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Truck size={12} />
                      <span>Dispatch Free Emergency Tanker</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagged Vendors Watchlist */}
      {flaggedVendors.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
            <ShieldAlert size={18} />
            <span>Vendors Suspended for Water Quality Non-Compliance</span>
          </div>
          <div className="space-y-3">
            {flaggedVendors.map((fv) => (
              <div
                key={fv.id}
                className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-extrabold text-rose-950">{fv.name}</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">{fv.flagReason}</div>
                </div>
                <button
                  onClick={() => {
                    db.update((d) => {
                      const v = d.vendors.find((item) => item.id === fv.id);
                      if (v) {
                        v.status = 'active';
                        v.flagReason = undefined;
                      }
                    });
                    refreshData();
                    alert(`Vendor ${fv.name} reinstated after passing physical lab sample inspection.`);
                  }}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Approve Re-Inspection & Re-Instate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
