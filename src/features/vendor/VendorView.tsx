import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { eventBus } from '../../services/eventBus';
import { formatINR } from '../../services/pricing';
import { optimizeRouteBatch } from '../../services/routing';
import { LeafletMap } from '../../components/common/LeafletMap';
import { Driver, Vehicle, Vendor, Booking } from '../../types';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  Route,
  Zap,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  FileText,
  ArrowRight,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';

interface VendorViewProps {
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export const VendorView: React.FC<VendorViewProps> = ({
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

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const refreshData = () => {
    const data = db.getData();
    const v = data.vendors.find((item) => item.id === 'vendor-1') || data.vendors[0];
    setVendor(v);
    setVehicles(data.vehicles.filter((veh) => veh.vendorId === v?.id));
    setDrivers(data.drivers.filter((d) => d.vendorId === v?.id));
    setBookings(data.bookings.filter((b) => b.vendorId === v?.id));
  };

  useEffect(() => {
    refreshData();
    const sub = eventBus.subscribe('simulation_tick', refreshData);
    return () => sub();
  }, []);

  if (!vendor) return null;

  // Route batching demonstration data
  const sampleStops = [
    { id: 's1', label: 'Rohan Leher (Baner)', lat: 18.559, lng: 73.786, volumeL: 10000, orderId: 'BK-9041' },
    { id: 's2', label: 'Sunrise Heights (Balewadi)', lat: 18.572, lng: 73.771, volumeL: 10000, orderId: 'BK-8820' },
    { id: 's3', label: 'Pancard Club Lane', lat: 18.554, lng: 73.781, volumeL: 5000, orderId: 'BK-7712' },
  ];
  const depot = { lat: 18.498, lng: 73.847, label: 'PMC Parvati Filling Station' };
  const batchOptimization = optimizeRouteBatch(depot, sampleStops);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 select-none text-slate-800">
      {/* ============================================================== */}
      {/* 1. TOP 5 ACTION CARDS RIBBON (Vendor Fleet)                    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Fleet Roster */}
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
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Fleet Roster</span>
              <span className="text-[10px] text-cyan-200 font-medium">8/10 Online</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-white/80 shrink-0" />
        </button>

        {/* Card 2: 2-Opt Batching */}
        <button
          onClick={() => setActiveTab('route_batching')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'route_batching'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Route size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">2-Opt Batching</span>
              <span className="text-[10px] text-slate-400 font-medium">18% Fuel Saved</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 3: Driver Payouts */}
        <button
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'payouts'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">Driver Payouts</span>
              <span className="text-[10px] text-slate-400 font-medium">Instant Escrow</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 4: PMC Permits */}
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl shadow-xs transition-all duration-200 cursor-pointer text-left ${
            activeTab === 'compliance'
              ? 'bg-white border-2 border-cyan-500 shadow-md text-cyan-950 scale-[1.02]'
              : 'bg-white border border-sky-100/90 hover:border-cyan-300 hover:bg-sky-50/50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">PMC Permits</span>
              <span className="text-[10px] text-slate-400 font-medium">100% Verified</span>
            </div>
          </div>
          <ArrowRight size={15} className="text-slate-400 shrink-0" />
        </button>

        {/* Card 5: Fleet Revenue */}
        <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-sky-100/90 shadow-xs text-left text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold block tracking-tight">₹21,600</span>
              <span className="text-[10px] text-emerald-600 font-bold">Today's Revenue</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 2-COLUMN DASHBOARD (Vendor View)                       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
        {/* Left Column (7/12): Hero Optimization + 4 Metrics + 2-Opt Visualizer */}
        <div className="lg:col-span-7 space-y-5">
          {/* HERO FLEET STATUS */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#063b4f] via-[#09576f] to-[#0c6b84] text-white p-5 sm:p-7 shadow-lg shadow-cyan-950/15 border border-cyan-800/40">
            <div className="relative z-10 space-y-4 max-w-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 backdrop-blur-md border border-cyan-300/30 text-cyan-200 text-[11px] font-extrabold uppercase tracking-wider">
                <Truck size={13} className="text-cyan-300" />
                <span>{vendor.name} • Fleet Ops</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                  8 of 10 Tankers Active
                </h2>
                <p className="text-cyan-200 text-xs sm:text-sm font-semibold mt-0.5">
                  2-Opt AI Route Batching active • Average delivery turnaround 34 mins
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                <CheckCircle2 size={15} className="text-emerald-300" />
                <span>Zero fair-price violations • 100% Escrow settlements cleared</span>
              </div>
            </div>

            <div className="absolute right-4 sm:right-6 bottom-4 sm:bottom-6 z-10 text-right pointer-events-none hidden sm:block">
              <span className="text-sm font-serif italic text-cyan-100/90 font-bold block drop-shadow-md">
                Every Drop Counts ♡
              </span>
              <span className="text-xs text-cyan-200/80 font-mono">
                PMC Zone 2 Fleet
              </span>
            </div>
          </div>

          {/* 4 VENDOR METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Truck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Fleet Utilization</span>
                <span className="text-sm font-black text-slate-900 block">80% Online</span>
              </div>
              <div className="text-[10px] font-extrabold text-cyan-700">8 Active Tankers</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Volume Delivered</span>
                <span className="text-sm font-black text-slate-900 block">72,000 L</span>
              </div>
              <div className="text-[10px] font-extrabold text-emerald-700">↑ 14% vs Yesterday</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Fleet Rating</span>
                <span className="text-sm font-black text-slate-900 block">{vendor.rating} ★</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-500">Tier 1 Vendor</div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-sky-100/90 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <ShieldCheck size={17} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">PMC Compliance</span>
                <span className="text-sm font-black text-slate-900 block">100% Valid</span>
              </div>
              <div className="text-[10px] font-extrabold text-teal-700">Parvati Stations</div>
            </div>
          </div>

          {/* 2-OPT ROUTE BATCHING MAP */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route size={18} className="text-cyan-700" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  2-Opt Clustered Route Optimization
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Savings: {Math.round((batchOptimization.savedKm / (batchOptimization.originalDistanceKm || 1)) * 100) || 18}% Km Reduced
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200">
              <LeafletMap
                center={[18.54, 73.80]}
                zoom={12}
                className="h-64 w-full"
                markers={[
                  { id: 'depot', lat: depot.lat, lng: depot.lng, title: depot.label, type: 'source' },
                  ...sampleStops.map((s) => ({
                    id: s.id,
                    lat: s.lat,
                    lng: s.lng,
                    title: `${s.label} (${s.volumeL}L)`,
                    type: 'delivery' as const,
                  })),
                ]}
                routePolyline={[
                  [depot.lat, depot.lng],
                  [sampleStops[0].lat, sampleStops[0].lng],
                  [sampleStops[2].lat, sampleStops[2].lng],
                  [sampleStops[1].lat, sampleStops[1].lng],
                ]}
              />
            </div>
          </div>
        </div>

        {/* Right Column (5/12): Fleet Roster + Quick Actions */}
        <div className="lg:col-span-5 space-y-5">
          {/* TANKER FLEET ROSTER */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Truck size={17} className="text-cyan-700" />
                <span>Live Tanker Roster</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">{vehicles.length} Tankers</span>
            </div>

            <div className="space-y-2.5">
              {vehicles.slice(0, 4).map((veh) => (
                <div key={veh.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">
                      {veh.capacityL / 1000}k
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">{veh.regNo}</div>
                      <div className="text-[10px] text-slate-400">Driver: Santosh Jadhav • PMC Verified</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* VENDOR QUICK CONTROLS */}
          <div className="bg-white rounded-3xl p-5 border border-sky-100/90 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-700" />
              <span>Fleet Operations</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => alert('Dispatched optimized 2-Opt cluster to Driver Santosh Jadhav.')}
                className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-100 text-center hover:bg-cyan-100/70 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-cyan-950">Dispatch Batch</span>
                <span className="text-[10px] text-slate-500">Auto Route 3 Stops</span>
              </button>

              <button
                onClick={() => alert('Exported Vendor GST Invoices & Driver Payouts.')}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="text-xs font-extrabold block text-slate-800">Export Ledger</span>
                <span className="text-[10px] text-slate-500">Download Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
