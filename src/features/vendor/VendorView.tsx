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
} from 'lucide-react';
import { format } from 'date-fns';

export const VendorView: React.FC = () => {
  const { currentUser } = useAppStore();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'fleet' | 'batching' | 'ledger' | 'compliance'>('fleet');
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  const refreshData = () => {
    const data = db.getData();
    const v = data.vendors.find((item) => item.id === 'vendor-1') || data.vendors[0];
    setVendor(v);
    setVehicles(data.vehicles.filter((veh) => veh.vendorId === v.id));
    setDrivers(data.drivers.filter((d) => d.vendorId === v.id));
    setBookings(data.bookings.filter((b) => b.vendorId === v.id));
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
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-black flex items-center justify-center text-xl">
            <Truck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{vendor.name}</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                Fleet Pro (6 Vehicles)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: Meena Shinde • Rating: {vendor.rating} ★ • On-time: {vendor.onTimePct}%
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              vendor.status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800 animate-pulse'
            }`}
          >
            Status: {vendor.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Flagged Banner & Appeal if vendor is flagged */}
      {vendor.status === 'flagged' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
            <AlertTriangle size={18} />
            <span>Matching Suspended: Vendor Flagged for Quality Complaints</span>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            {vendor.flagReason || '3 water-quality tags received in 7 days. Auto-excluded from customer matching.'}
          </p>
          {!appealSubmitted ? (
            <button
              onClick={() => {
                setAppealSubmitted(true);
                alert('Appeal submitted to PMC Municipal Water Quality cell for physical re-testing.');
              }}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
            >
              Submit Quality Rectification Appeal
            </button>
          ) : (
            <div className="text-xs font-bold text-amber-800">
              Appeal submitted to PMC Officer. Awaiting sample lab verification.
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Size</div>
          <div className="text-2xl font-black text-slate-900">{vehicles.length} Tankers</div>
          <p className="text-[11px] text-slate-500">5 Active • 1 Idle/Offline</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Payouts (Month)</div>
          <div className="text-2xl font-black text-emerald-600">₹3,48,200</div>
          <p className="text-[11px] text-slate-500">5% Platform commission (Fleet Pro)</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Driver Payout Cut</div>
          <div className="text-2xl font-black text-cyan-900">12% / Trip</div>
          <p className="text-[11px] text-slate-500">Instant driver wallet settlements</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Route Optimization</div>
          <div className="text-2xl font-black text-cyan-800">18.4 km Saved</div>
          <p className="text-[11px] text-slate-500">₹460 diesel saved today</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'fleet', label: 'Fleet & Drivers' },
          { id: 'batching', label: 'Route Batching (2-Opt AI)' },
          { id: 'ledger', label: 'Payouts & Ledger' },
          { id: 'compliance', label: 'Water Source Certs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-4 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Fleet & Drivers */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vehicles List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Vehicle Roster</h3>
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">{v.regNo}</div>
                    <div className="text-[11px] text-slate-500">{v.capacityL.toLocaleString('en-IN')} L Capacity</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${
                      v.status === 'idle'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'busy'
                        ? 'bg-cyan-100 text-cyan-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Drivers List */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Driver Roster & Source Status</h3>
            <div className="space-y-3">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-[11px] text-slate-500">{d.phone}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {d.online ? 'Online' : 'Offline'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {d.todayCheckInId ? 'Source Verified' : 'Check-in Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Route Batching with 2-Opt TSP */}
      {activeTab === 'batching' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Intelligent Route Batching (2-Opt)</h3>
              <p className="text-xs text-slate-500">Clusters nearby deliveries to cut empty runs and fuel burn.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                {batchOptimization.summary}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Map */}
            <LeafletMap
              center={[18.559, 73.786]}
              zoom={13}
              className="h-64 w-full rounded-2xl overflow-hidden"
              markers={[
                { id: 'depot', lat: depot.lat, lng: depot.lng, title: depot.label, type: 'source' },
                ...sampleStops.map((s) => ({
                  id: s.id,
                  lat: s.lat,
                  lng: s.lng,
                  title: `${s.label} (${s.volumeL} L)`,
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

            {/* Optimized Sequence */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800">Optimized Trip Sequence:</div>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-800">1. Source: PMC Parvati (Fill 25,000 L)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Depot</span>
                </div>
                {sampleStops.map((s, i) => (
                  <div
                    key={s.id}
                    className="p-3 bg-white rounded-xl border border-cyan-100 text-xs flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{i + 2}. {s.label}</span>
                      <span className="text-[10px] text-slate-400 block">{s.orderId}</span>
                    </div>
                    <span className="text-[11px] font-bold text-cyan-800">{s.volumeL.toLocaleString('en-IN')} L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Settled Vendor Payouts & Escrow Releases</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="pb-2">Booking ID</th>
                  <th className="pb-2">Gross Total</th>
                  <th className="pb-2">Commission (5%)</th>
                  <th className="pb-2">Driver Incentive (12%)</th>
                  <th className="pb-2 text-right">Net Vendor Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="text-slate-700">
                    <td className="py-2.5 font-mono font-semibold">{b.id}</td>
                    <td className="py-2.5">{formatINR(b.price.total)}</td>
                    <td className="py-2.5 text-slate-400">-{formatINR(Math.round(b.price.total * 0.05))}</td>
                    <td className="py-2.5 text-cyan-700">-{formatINR(Math.round(b.price.total * 0.12))}</td>
                    <td className="py-2.5 text-right font-extrabold text-emerald-700">
                      +{formatINR(Math.round(b.price.total * 0.83))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Compliance */}
      {activeTab === 'compliance' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Government Water Source Certificates</h3>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-emerald-900">PMC Water Supply Dept Tanker License</div>
              <div className="text-[11px] text-emerald-700 font-mono">Licence No: PMC-COMM-WTR-2026-088</div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
              Valid Till Dec 2026
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
