import { BookingPrice, Zone } from '../types';

export const TANKER_CAPACITIES = [1000, 3000, 5000, 10000, 12000] as const;

export const DEFAULT_RATES = {
  municipalRatePerLitrePaise: 9, // ₹0.09
  roRatePerLitrePaise: 30,       // ₹0.30
  ratePerKmPaise: 2500,          // ₹25.00
};

export interface CalculatePriceParams {
  volumeL: number;
  purpose: 'general' | 'drinking';
  distanceKm: number;
  slotType: 'standard' | 'express' | 'today' | 'scheduled' | 'recurring';
  demandIndex: number; // e.g. 1.0 to 2.0
  householdCount?: number;
  ratePerLitrePaise?: number;
  ratePerKmPaise?: number;
}

export function calculatePrice(params: CalculatePriceParams): BookingPrice {
  const {
    volumeL,
    purpose,
    distanceKm,
    slotType,
    demandIndex,
    householdCount = 1,
    ratePerLitrePaise = purpose === 'drinking'
      ? DEFAULT_RATES.roRatePerLitrePaise
      : DEFAULT_RATES.municipalRatePerLitrePaise,
    ratePerKmPaise = DEFAULT_RATES.ratePerKmPaise,
  } = params;

  // Base price in paise
  const base = Math.round(volumeL * ratePerLitrePaise);

  // Distance charge in paise (from water source to delivery)
  const distance = Math.round(distanceKm * ratePerKmPaise);

  // Subtotal
  const subtotal = base + distance;

  // Slot factor
  let slotFactor = 1.0;
  if (slotType === 'express') {
    slotFactor = 1.15;
  } else if (slotType === 'today') {
    // Check if off-peak or standard
    slotFactor = 1.0;
  }

  // Demand factor: raw = clamp(1 + 0.5 * (demandIndex - 1), 1.0, 1.6)
  const rawDemand = Math.min(1.6, Math.max(1.0, 1 + 0.5 * (demandIndex - 1)));
  // Applied: Fair-Price Cap at 1.25 maximum
  const appliedDemand = Math.min(rawDemand, 1.25);

  // fairCapSavings = (raw - applied) * subtotal * slotFactor
  const fairCapSavings = Math.round((rawDemand - appliedDemand) * subtotal * slotFactor);

  // Pool discount: 3 households = 5%, 5 households = 8%, 8+ = 12%
  let poolDiscount = 0;
  if (householdCount >= 8) {
    poolDiscount = 0.12;
  } else if (householdCount >= 5) {
    poolDiscount = 0.08;
  } else if (householdCount >= 3) {
    poolDiscount = 0.05;
  }

  // total = subtotal * slotFactor * applied * (1 - poolDiscount)
  const total = Math.round(subtotal * slotFactor * appliedDemand * (1 - poolDiscount));

  // marketEstimate = subtotal * slotFactor * (1 + 0.8 * max(0, demandIndex - 1))
  const marketEstimate = Math.round(
    subtotal * slotFactor * (1 + 0.8 * Math.max(0, demandIndex - 1))
  );

  return {
    base,
    distance,
    subtotal,
    slotFactor,
    demandFactor: appliedDemand,
    rawDemandFactor: rawDemand,
    fairCapSavings,
    poolDiscount,
    total,
    marketEstimate: Math.max(total, marketEstimate),
  };
}

export function calculateCommissionAndPayout(params: {
  totalPaise: number;
  orderType: 'b2c' | 'pool' | 'society';
  vendorPlanTier: 'starter' | 'fleetPro';
  driverIncentivePct?: number; // default 12%
}) {
  const { totalPaise, orderType, vendorPlanTier, driverIncentivePct = 0.12 } = params;

  // Commission %: 8% B2C, 6% pool/society, 5% if Fleet Pro
  let commissionPct = 0.08;
  if (vendorPlanTier === 'fleetPro') {
    commissionPct = 0.05;
  } else if (orderType === 'pool' || orderType === 'society') {
    commissionPct = 0.06;
  }

  const commissionPaise = Math.round(totalPaise * commissionPct);
  const vendorNetPaise = totalPaise - commissionPaise;
  const driverIncentivePaise = Math.round(vendorNetPaise * driverIncentivePct);
  const vendorFinalPaise = vendorNetPaise - driverIncentivePaise;

  return {
    commissionPct,
    commissionPaise,
    vendorNetPaise,
    driverIncentivePaise,
    vendorFinalPaise,
  };
}

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}
