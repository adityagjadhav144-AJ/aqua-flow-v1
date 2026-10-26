import React from 'react';
import { BookingPrice } from '../../types';
import { formatINR } from '../../services/pricing';
import { ShieldCheck, Sparkles, TrendingDown, Info } from 'lucide-react';

interface PriceBreakdownProps {
  price: BookingPrice;
  volumeL?: number;
  purpose?: 'general' | 'drinking';
  isCompact?: boolean;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  price,
  volumeL,
  purpose = 'general',
  isCompact = false,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
          <span>Price Breakdown</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
            {purpose === 'drinking' ? 'Certified RO' : 'PMC Domestic'}
          </span>
        </div>
        <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <ShieldCheck size={14} />
          <span>Fair-Capped</span>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Base Water ({volumeL ? `${volumeL.toLocaleString('en-IN')} L` : 'Tanker volume'})</span>
          <span className="font-semibold text-slate-800">{formatINR(price.base)}</span>
        </div>

        <div className="flex justify-between">
          <span>Transit Distance Charge</span>
          <span className="font-semibold text-slate-800">{formatINR(price.distance)}</span>
        </div>

        {price.slotFactor !== 1.0 && (
          <div className="flex justify-between text-amber-700">
            <span>Slot Adjustment ({price.slotFactor > 1 ? 'Express +15%' : 'Off-peak -5%'})</span>
            <span>{price.slotFactor > 1 ? '+' : ''}{((price.slotFactor - 1) * 100).toFixed(0)}%</span>
          </div>
        )}

        {/* Fair Price Cap Savings Highlight */}
        {price.fairCapSavings > 0 ? (
          <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl font-medium">
            <span className="flex items-center gap-1">
              <Sparkles size={13} />
              <span>Fair-Price Cap Protection:</span>
            </span>
            <span className="font-bold">Saved -{formatINR(price.fairCapSavings)}</span>
          </div>
        ) : null}

        {/* Community Pool Discount */}
        {price.poolDiscount > 0 && (
          <div className="flex items-center justify-between text-cyan-700 bg-cyan-50 px-2.5 py-1.5 rounded-xl font-medium">
            <span className="flex items-center gap-1">
              <TrendingDown size={13} />
              <span>Community Pool Discount ({(price.poolDiscount * 100).toFixed(0)}%):</span>
            </span>
            <span className="font-bold">
              -{formatINR(Math.round(price.subtotal * price.slotFactor * price.demandFactor * price.poolDiscount))}
            </span>
          </div>
        )}
      </div>

      {/* Total Section */}
      <div className="border-t border-slate-100 pt-2.5 flex items-baseline justify-between">
        <div>
          <div className="text-xs text-slate-500 font-medium">Total All-Inclusive</div>
          <div className="text-[10px] text-slate-400">Escrow released only upon QR verification</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-cyan-900 tracking-tight">
            {formatINR(price.total)}
          </div>
        </div>
      </div>

      {/* Unregulated Market Comparison */}
      <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600 border border-slate-100">
        <div className="flex items-center gap-1 text-slate-500">
          <Info size={13} />
          <span>Typical unregulated market rate:</span>
        </div>
        <span className="line-through font-semibold text-slate-400">
          {formatINR(price.marketEstimate)}
        </span>
      </div>
    </div>
  );
};
