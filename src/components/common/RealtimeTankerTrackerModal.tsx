import React, { useState } from 'react';
import { Booking, WaterSource, Vendor, Driver } from '../../types';
import { LeafletMap } from './LeafletMap';
import { StatusStepper } from './StatusStepper';
import { formatINR } from '../../services/pricing';
import { calculateDistanceMeters } from '../../services/qr';
import { db } from '../../services/db';
import {
  X,
  Clock,
  Truck,
  MapPin,
  ShieldCheck,
  PhoneCall,
  Share2,
  Maximize2,
  Minimize2,
  Crosshair,
  QrCode,
  AlertTriangle,
  RefreshCw,
  Navigation,
} from 'lucide-react';

interface RealtimeTankerTrackerModalProps {
  booking: Booking;
  onClose: () => void;
  onOpenQrModal?: () => void;
  onCancelBooking?: (bookingId: string) => void;
}

export const RealtimeTankerTrackerModal: React.FC<RealtimeTankerTrackerModalProps> = ({
  booking,
  onClose,
  onOpenQrModal,
  onCancelBooking,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [followTruck, setFollowTruck] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    booking.currentLat || 18.535,
    booking.currentLng || 73.805,
  ]);
  const [zoomLevel, setZoomLevel] = useState(14);

  const data = db.getData();
  const vendor = data.vendors.find((v) => v.id === booking.vendorId);
  const driver = data.drivers.find((d) => d.id === booking.driverId);
  const source = data.waterSources.find((s) => s.id === 'src-1') || data.waterSources[0];

  // Calculate real-time distance remaining
  const currentTruckLat = booking.currentLat || 18.535;
  const currentTruckLng = booking.currentLng || 73.805;
  const remainingDistM = calculateDistanceMeters(
    currentTruckLat,
    currentTruckLng,
    booking.lat,
    booking.lng
  );
  const remainingDistKm = (remainingDistM / 1000).toFixed(1);

  // Source to destination coordinates for route
  const sourceLat = source?.lat || 18.4985;
  const sourceLng = source?.lng || 73.8475;
  const destLat = booking.lat;
  const destLng = booking.lng;

  // Midpoints to form a realistic Pune road corridor: Parvati -> Karve Rd / Deccan -> Senapati Bapat Rd -> Baner
  const routePolyline: [number, number][] = [
    [sourceLat, sourceLng],
    [18.508, 73.832],
    [18.518, 73.824],
    [currentTruckLat, currentTruckLng],
    [18.542, 73.801],
    [18.552, 73.792],
    [destLat, destLng],
  ];

  // Total trip distance vs remaining
  const totalTripDistM = calculateDistanceMeters(sourceLat, sourceLng, destLat, destLng);
  const progressPct = Math.min(
    100,
    Math.max(10, Math.round(((totalTripDistM - remainingDistM) / totalTripDistM) * 100))
  );

  const isArrived = booking.status === 'ARRIVED';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div
        className={`w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-cyan-100 transition-all duration-300 ${
          isExpanded ? 'h-[96vh]' : 'h-[88vh] max-h-[820px]'
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 px-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <Navigation size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight">Real-Time Tanker Tracking</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-900 text-cyan-300 font-bold border border-cyan-700/50">
                  {booking.id}
                </span>
              </div>
              <p className="text-[10px] text-cyan-200/80">Live GPS telemetry updating every second</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand full view'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              title="Close tracker"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Real-time Map Area */}
        <div className="relative shrink-0 w-full overflow-hidden transition-all duration-300">
          <LeafletMap
            center={mapCenter}
            zoom={zoomLevel}
            className={`${isExpanded ? 'h-80 sm:h-96' : 'h-60 sm:h-64'} w-full relative z-0`}
            followTruck={followTruck}
            markers={[
              {
                id: 'source-point',
                lat: sourceLat,
                lng: sourceLng,
                title: source?.name || 'PMC Parvati Water Filling Station',
                type: 'source',
                popupContent: 'Water filling station • Daily certified source audit verified',
              },
              {
                id: 'active-tanker',
                lat: currentTruckLat,
                lng: currentTruckLng,
                title: `Tanker MH-12 AB 4821 (${driver?.name || 'Santosh Jadhav'})`,
                type: 'truck',
                etaMin: booking.etaMin,
                subLabel: 'MH-12 AB 4821',
                popupContent: `Driver: ${driver?.name || 'Santosh Jadhav'} • Speed: 22 km/h • ETA: ${
                  booking.etaMin > 0 ? `${booking.etaMin} mins` : 'Arrived at Gate'
                }`,
              },
              {
                id: 'delivery-point',
                lat: destLat,
                lng: destLng,
                title: booking.address.label || 'Delivery Address (Baner)',
                type: 'delivery',
                popupContent: `${booking.address.line} • 100% Escrow protected delivery point`,
              },
            ]}
            routePolyline={routePolyline}
          />

          {/* Floating Map Controls & Overlays */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            <button
              onClick={() => {
                setFollowTruck(true);
                setMapCenter([currentTruckLat, currentTruckLng]);
                setZoomLevel(15);
              }}
              className={`p-2 rounded-xl text-xs font-bold shadow-md backdrop-blur-md flex items-center gap-1 transition-all cursor-pointer ${
                followTruck
                  ? 'bg-cyan-600 text-white shadow-cyan-600/30'
                  : 'bg-white/90 text-slate-700 hover:bg-white'
              }`}
              title="Center and follow tanker"
            >
              <Crosshair size={14} />
              <span className="hidden sm:inline">Follow Tanker</span>
            </button>

            <button
              onClick={() => {
                setFollowTruck(false);
                setMapCenter([destLat, destLng]);
                setZoomLevel(15);
              }}
              className="p-2 rounded-xl text-xs font-bold shadow-md bg-white/90 hover:bg-white text-slate-700 backdrop-blur-md flex items-center gap-1 transition-all cursor-pointer"
              title="Center on delivery house"
            >
              <MapPin size={14} className="text-rose-600" />
              <span className="hidden sm:inline">Delivery</span>
            </button>
          </div>

          {/* Live ETA Floating Banner Over Map */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-3 shadow-lg border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                    isArrived ? 'bg-emerald-500 animate-bounce' : 'bg-cyan-600 animate-pulse'
                  }`}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">
                    {isArrived ? 'Status Update' : 'Estimated Arrival Time'}
                  </div>
                  <div className="text-base font-black tracking-tight text-white">
                    {isArrived ? (
                      <span className="text-emerald-400">Arrived at Gate! 🚰</span>
                    ) : (
                      <span>{booking.etaMin} mins away</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-extrabold text-cyan-300 font-mono">
                  {isArrived ? '0.0 km' : `${remainingDistKm} km`}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isArrived ? 'Delivery ready' : 'Avg speed: 24 km/h'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Details Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
          {/* Real-time Trip Progress Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="flex justify-between items-center text-slate-700 font-semibold">
              <span className="flex items-center gap-1">
                <Truck size={13} className="text-cyan-600" />
                <span>Transit Progress</span>
              </span>
              <span className="font-bold text-cyan-900">
                {isArrived ? '100% Completed' : `${progressPct}% on route`}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>PMC Parvati Station</span>
              <span>{booking.address.label}</span>
            </div>
          </div>

          {/* Driver & Vehicle Details Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  {driver?.name.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{driver?.name || 'Santosh Jadhav'}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                      4.8 ★
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {vendor?.name || 'Shree Ganesh Water Suppliers'}
                  </div>
                </div>
              </div>

              {/* Call Mock Button */}
              <button
                onClick={() =>
                  alert(
                    `Simulated Call to Driver ${driver?.name || 'Santosh Jadhav'} (+91 98901 67890)`
                  )
                }
                className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors flex items-center gap-1 font-bold text-xs cursor-pointer shadow-2xs"
                title="Call driver"
              >
                <PhoneCall size={14} />
                <span className="hidden sm:inline">Call</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Vehicle Reg. Number</span>
                <span className="font-mono font-bold text-slate-900">MH-12 AB 4821</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-slate-400 block text-[10px]">Tanker Volume</span>
                <span className="font-bold text-slate-900">
                  {booking.volumeL.toLocaleString('en-IN')} Litres
                </span>
              </div>
            </div>
          </div>

          {/* Certified Water Source Audit Trail */}
          <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-700" />
                <span>Certified Water Source Audit Trail</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                PMC Verified Today
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Source: <span className="font-bold">{source?.name || 'PMC Filling Point: Parvati'}</span> •
              Cert: <span className="font-mono font-semibold">{source?.certificateNo || 'PMC-WTR-2026-PARV-094'}</span> •
              Turbidity: Clear (&lt; 1.0 NTU) • Geotag audit logged at 6:42 AM.
            </p>
          </div>

          {/* Status Stepper Progression */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
            <div className="font-extrabold text-xs text-slate-900">Delivery Lifecycle Progress</div>
            <StatusStepper currentStatus={booking.status} timeline={booking.timeline} />
          </div>

          {/* Escrow & Payment Summary */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Escrow Amount Held</div>
              <div className="text-[10px] text-slate-400">
                Released automatically only after your QR verification
              </div>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-sm text-cyan-950">
                {formatINR(booking.price.total)}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">100% Escrow Protected</div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-3.5 px-4 bg-white border-t border-slate-100 shrink-0 flex items-center gap-2">
          {isArrived ? (
            <button
              onClick={() => {
                if (onOpenQrModal) onOpenQrModal();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:brightness-105 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 animate-pulse cursor-pointer"
            >
              <QrCode size={16} />
              <span>Show Dynamic Delivery QR (Proof of Delivery)</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'AquaFlow Tanker Live Tracking',
                      text: `Tracking 10,000 L water tanker arriving at Baner. ETA: ${booking.etaMin} mins.`,
                      url: window.location.href,
                    });
                  } else {
                    alert('Tracking link copied to clipboard!');
                  }
                }}
                className="py-2.5 px-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share Track</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this booking? If driver has already accepted, a ₹50 cancellation fee applies.')) {
                    if (onCancelBooking) onCancelBooking(booking.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-3 border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel Order
              </button>

              <div className="flex-1 text-right">
                <span className="text-[11px] font-extrabold text-cyan-900 bg-cyan-50 px-3 py-2 rounded-xl border border-cyan-100 inline-block">
                  ETA: {booking.etaMin} mins
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
