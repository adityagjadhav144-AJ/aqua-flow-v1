import React from 'react';
import { BookingPrice } from '../../types';
import { formatINR } from '../../services/pricing';
import { ShieldCheck, Sparkles, TrendingDown, Info, QrCode } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface PriceBreakdownProps {
  price: BookingPrice;
  volumeL?: number;
  purpose?: 'general' | 'drinking';
  isCompact?: boolean;
  onPayViaUpi?: () => void;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  price,
  volumeL,
  purpose = 'general',
  isCompact = false,
  onPayViaUpi,
}) => {
  const { currentLanguage, t } = useAppStore();

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
          <span>{currentLanguage === 'mr' ? 'ऑर्डर सारांश व दर तपशील' : 'Order Summary & Price'}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
            {purpose === 'drinking' ? 'Certified RO' : 'PMC Domestic'}
          </span>
        </div>
        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Fair-Capped</span>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex justify-between items-center">
          <span>Base Water ({volumeL ? `${volumeL.toLocaleString('en-IN')} L` : 'Tanker volume'})</span>
          <span className="font-semibold text-slate-800">{formatINR(price.base)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Transit Distance Charge</span>
          <span className="font-semibold text-slate-800">{formatINR(price.distance)}</span>
        </div>

        {price.slotFactor !== 1.0 && (
          <div className="flex justify-between items-center text-amber-700">
            <span>Slot Adjustment ({price.slotFactor > 1 ? 'Express +15%' : 'Off-peak -5%'})</span>
            <span className="font-bold">{price.slotFactor > 1 ? '+' : ''}{((price.slotFactor - 1) * 100).toFixed(0)}%</span>
          </div>
        )}

        {/* Fair Price Cap Savings Highlight */}
        {price.fairCapSavings > 0 && (
          <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl font-medium border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" />
              <span className="font-bold">{t('fair_cap_savings')}:</span>
            </span>
            <span className="font-black text-emerald-700">-{formatINR(price.fairCapSavings)}</span>
          </div>
        )}

        {/* Community Pool Discount */}
        {price.poolDiscount > 0 && (
          <div className="flex items-center justify-between text-cyan-800 bg-cyan-50 px-3 py-2 rounded-xl font-medium border border-cyan-200">
            <span className="flex items-center gap-1.5">
              <TrendingDown size={14} className="text-cyan-600" />
              <span className="font-bold">{t('pool_discount')} ({(price.poolDiscount * 100).toFixed(0)}%):</span>
            </span>
            <span className="font-black text-cyan-700">
              -{formatINR(Math.round(price.subtotal * price.slotFactor * price.demandFactor * price.poolDiscount))}
            </span>
          </div>
        )}
      </div>

      {/* Total Section */}
      <div className="border-t border-slate-100 pt-3 flex items-baseline justify-between">
        <div>
          <div className="text-xs text-slate-500 font-semibold">{t('total_payable')}</div>
          <div className="text-[10px] text-slate-400">100% Escrow Protection</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-cyan-950 tracking-tight">
            {formatINR(price.total)}
          </div>
        </div>
      </div>

      {/* Unregulated Market Comparison */}
      <div className="bg-slate-50 rounded-2xl p-2.5 px-3 flex items-center justify-between text-[11px] text-slate-600 border border-slate-200">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Info size={13} />
          <span>{currentLanguage === 'mr' ? 'बाजारातील अनियंत्रित सरासरी दर:' : 'Typical unregulated market rate:'}</span>
        </div>
        <span className="line-through font-bold text-slate-400">
          {formatINR(price.marketEstimate)}
        </span>
      </div>

      {/* UPI / QR Instant Pay Badge or Trigger */}
      {onPayViaUpi && (
        <button
          type="button"
          onClick={onPayViaUpi}
          className="w-full py-2.5 px-3 rounded-2xl bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <QrCode size={15} className="text-cyan-700" />
          <span>{t('pay_via_upi_qr')} (Dynamic QR)</span>
        </button>
      )}
    </div>
  );
};

