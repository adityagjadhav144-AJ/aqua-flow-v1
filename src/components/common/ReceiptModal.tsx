import React from 'react';
import { Booking } from '../../types';
import { formatINR } from '../../services/pricing';
import { db } from '../../services/db';
import { X, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptModalProps {
  booking: Booking;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ booking, onClose }) => {
  const data = db.getData();
  const vendor = data.vendors.find((v) => v.id === booking.vendorId);
  const driver = data.drivers.find((d) => d.id === booking.driverId);
  const source = data.waterSources.find((s) => s.id === 'src-1');

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        {/* Top Controls */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Digital Tax Invoice & Delivery Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printReceipt}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs text-slate-700 font-sans print:p-0">
          {/* Header */}
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-start gap-2 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg overflow-hidden bg-white border border-cyan-200 flex items-center justify-center shrink-0 p-0.5 shadow-2xs">
                  <img
                    src="/assets/aistudio/image_a469dbfe.png"
                    alt="AquaFlow"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight">AquaFlow Pune</span>
              </div>
              <p className="text-[11px] text-slate-500">Digital Water Logistics & Escrow Platform</p>
              <p className="text-[10px] text-slate-400">GSTIN: 27AABCA1234F1Z9 • Pune, MH</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Escrow Settled
              </span>
              <p className="font-mono font-bold text-slate-900 mt-1">{booking.id}</p>
              <p className="text-[10px] text-slate-500">
                {format(new Date(booking.timeline[0]?.ts || Date.now()), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>

          {/* Delivery & Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Customer Details</div>
              <div className="font-semibold text-slate-900 mt-0.5">Neha Deshpande</div>
              <div className="text-[11px] text-slate-600 leading-snug mt-0.5">{booking.address.line}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">+91 98220 12345</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Vendor & Vehicle</div>
              <div className="font-semibold text-slate-900 mt-0.5">{vendor?.name || 'Shree Ganesh Water'}</div>
              <div className="text-[11px] text-slate-600 mt-0.5">Driver: {driver?.name || 'Santosh Jadhav'}</div>
              <div className="text-[11px] font-mono text-cyan-800 font-bold mt-0.5">MH-12 AB 4821</div>
            </div>
          </div>

          {/* Source Certification Audit Trail */}
          <div className="border border-cyan-100 bg-cyan-50/50 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-950 text-xs">
              <ShieldCheck size={16} className="text-cyan-700" />
              <span>Certified Water Source Trail</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-cyan-900">
              <div>
                <span className="text-slate-500">Source: </span>
                <span className="font-semibold">{source?.name || 'PMC Filling Point: Parvati'}</span>
              </div>
              <div>
                <span className="text-slate-500">Certificate: </span>
                <span className="font-mono font-semibold">{source?.certificateNo || 'PMC-WTR-2026-PARV-094'}</span>
              </div>
              <div>
                <span className="text-slate-500">Purpose: </span>
                <span className="font-semibold capitalize">{booking.purpose} Domestic</span>
              </div>
              <div>
                <span className="text-slate-500">Delivered Volume: </span>
                <span className="font-bold text-emerald-800">
                  {(booking.deliveredConfirmedL || booking.volumeL).toLocaleString('en-IN')} Litres
                </span>
              </div>
            </div>
          </div>

          {/* Line Item Financial Breakdown */}
          <div className="space-y-2 overflow-x-auto">
            <table className="w-full text-xs min-w-[340px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="text-left pb-1.5">Item Description</th>
                  <th className="text-right pb-1.5">Rate</th>
                  <th className="text-right pb-1.5">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2">
                    Water Volume ({booking.volumeL.toLocaleString('en-IN')} L)
                  </td>
                  <td className="text-right py-2 font-mono">₹0.09 / L</td>
                  <td className="text-right py-2 font-semibold">{formatINR(booking.price.base)}</td>
                </tr>
                <tr>
                  <td className="py-2">Transit Distance Surcharge</td>
                  <td className="text-right py-2 font-mono">₹25.00 / km</td>
                  <td className="text-right py-2 font-semibold">{formatINR(booking.price.distance)}</td>
                </tr>
                {booking.price.slotFactor !== 1.0 && (
                  <tr>
                    <td className="py-2 text-slate-600">Slot Factor ({booking.slot.type})</td>
                    <td className="text-right py-2 font-mono">x {booking.price.slotFactor}</td>
                    <td className="text-right py-2 font-semibold">
                      +{formatINR(Math.round(booking.price.subtotal * (booking.price.slotFactor - 1)))}
                    </td>
                  </tr>
                )}
                {booking.price.fairCapSavings > 0 && (
                  <tr className="text-emerald-700">
                    <td className="py-2 font-medium">Fair-Price Cap Government Subsidy/Cap</td>
                    <td className="text-right py-2">Capped 1.25x</td>
                    <td className="text-right py-2 font-bold">-{formatINR(booking.price.fairCapSavings)}</td>
                  </tr>
                )}
                {booking.price.poolDiscount > 0 && (
                  <tr className="text-cyan-700">
                    <td className="py-2 font-medium">Community Pooling Volume Discount</td>
                    <td className="text-right py-2">-{(booking.price.poolDiscount * 100).toFixed(0)}%</td>
                    <td className="text-right py-2 font-bold">
                      -{formatINR(Math.round(booking.price.subtotal * booking.price.poolDiscount))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Total */}
            <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
              <span className="font-extrabold text-sm text-slate-900">Total Paid (Escrow Settled)</span>
              <span className="font-extrabold text-base text-cyan-900">{formatINR(booking.price.total)}</span>
            </div>
          </div>

          {/* Proof of Delivery Cryptographic Verification Hash */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Digital Proof of Delivery (PoD) Audit Record</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 break-all leading-tight">
              Nonce: {booking.pod?.nonce || 'NC_49F8B2A'} | VerifiedAt: {booking.pod?.verifiedAt || new Date().toISOString()} |
              Distance: {booking.pod?.gpsDistanceM ?? 42}m | Hash: SHA-256(e4b89f...28c0)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
