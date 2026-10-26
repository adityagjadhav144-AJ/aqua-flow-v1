export type Role = 'resident' | 'society' | 'driver' | 'vendor' | 'municipal' | 'ops';

export type Language = 'en' | 'mr' | 'hi';

export interface UserVerification {
  isVerified: boolean;
  verificationBadgeId: string;
  verifiedAt: string;
  statutoryIdType: string;
  statutoryIdValue: string;
  phoneOtpVerified: boolean;
  roleBadgeTitle: string;
  officialOrg?: string;
  jurisdictionZone?: string;
}

export interface User {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  language: Language;
  zoneId: string;
  addresses: Address[];
  walletPaise: number;
  trustScore: number; // 0-100
  notifPrefs: {
    push: boolean;
    whatsapp: boolean;
  };
  societyId?: string;
  vendorId?: string;
  verification?: UserVerification;
  // Role specific metadata
  vehicleNo?: string;
  commercialDl?: string;
  pmcEmployeeId?: string;
  designation?: string;
  societyRegNo?: string;
  flatsCount?: number;
  sumpCapacityL?: number;
  vendorPermitNo?: string;
  fleetSize?: number;
}

export interface Address {
  id: string;
  label: string;
  line: string;
  lat: number;
  lng: number;
  zoneId: string;
  societyId?: string;
}

export interface Zone {
  id: string;
  name: string;
  areas: string[];
  center: { lat: number; lng: number };
  radiusM: number;
  authority: 'PMC' | 'PCMC';
  demandIndex: number; // 0.5 - 2.0
  currentStatus?: 'normal' | 'outage' | 'maintenance' | 'supply_live';
}

export interface WaterSource {
  id: string;
  name: string;
  type: 'PMC_FILLING_POINT' | 'CERTIFIED_RO' | 'TESTED_BOREWELL';
  lat: number;
  lng: number;
  certificateNo: string;
  validTill: string;
}

export interface SourceCheckIn {
  id: string;
  driverId: string;
  sourceId: string;
  ts: string;
  lat: number;
  lng: number;
  distanceFromSourceM: number;
  photoDataUrl?: string;
  certificateNo: string;
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}

export interface Vehicle {
  id: string;
  vendorId: string;
  regNo: string;
  capacityL: number;
  status: 'idle' | 'busy' | 'offline';
  driverId?: string;
}

export interface Driver {
  id: string;
  vendorId: string;
  userId: string;
  name: string;
  phone: string;
  vehicleId: string;
  online: boolean;
  walletPaise: number;
  todayCheckInId?: string;
  currentLat?: number;
  currentLng?: number;
}

export interface Vendor {
  id: string;
  name: string;
  ownerUserId: string;
  zonesServed: string[];
  ratePerLitrePaise: {
    municipal: number; // default 9 (₹0.09)
    ro: number;        // default 30 (₹0.30)
  };
  ratePerKmPaise: number; // default 2500 (₹25/km)
  rating: number;
  onTimePct: number;
  planTier: 'starter' | 'fleetPro';
  status: 'active' | 'flagged' | 'suspended';
  driverIncentivePct: number; // default 12%
  flagReason?: string;
  appealSubmitted?: boolean;
}

export type BookingStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'MATCHED'
  | 'ACCEPTED'
  | 'FILLING'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'SETTLED'
  | 'REASSIGNED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export interface BookingPrice {
  base: number;            // paise
  distance: number;        // paise
  subtotal: number;        // paise
  slotFactor: number;
  demandFactor: number;
  rawDemandFactor: number;
  fairCapSavings: number;  // paise
  poolDiscount: number;    // 0 to 0.12
  total: number;           // paise
  marketEstimate: number;  // paise
}

export interface TimelineEntry {
  status: BookingStatus;
  ts: string;
  lat?: number;
  lng?: number;
  note?: string;
}

export interface BookingPod {
  nonce: string;
  issuedAt: string;
  verifiedAt?: string;
  deliveredL?: number;
  gpsDistanceM?: number;
  signature?: string;
}

export interface BookingRating {
  stars: number;
  tags: string[];
  comment?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  societyId?: string;
  poolId?: string;
  address: Address;
  lat: number;
  lng: number;
  volumeL: number;
  purpose: 'general' | 'drinking';
  slot: {
    type: 'express' | 'today' | 'scheduled' | 'recurring';
    start: string;
    end: string;
    label?: string;
  };
  vendorId?: string;
  driverId?: string;
  vehicleId?: string;
  status: BookingStatus;
  price: BookingPrice;
  commissionPaise: number;
  escrow: {
    status: 'held' | 'released' | 'refunded';
    heldAt?: string;
    releasedAt?: string;
  };
  timeline: TimelineEntry[];
  etaMin: number;
  currentLat?: number;
  currentLng?: number;
  pod?: BookingPod;
  rating?: BookingRating;
  sourceCheckInId?: string;
  reassignCount?: number;
  offerExpiresAt?: string;
  deliveredConfirmedL?: number;
  shortDeliveryRefundPaise?: number;
}

export interface PoolMember {
  userId: string;
  litres: number;
  sharePaise: number;
  confirmedReceipt: boolean;
  name?: string;
}

export interface Pool {
  id: string;
  leaderId: string;
  leaderName: string;
  zoneId: string;
  dropPoint: {
    lat: number;
    lng: number;
    label: string;
  };
  targetL: number;
  minL: number;
  deadline: string;
  members: PoolMember[];
  status: 'open' | 'confirmed' | 'dispatched' | 'completed' | 'expired';
  bookingId?: string;
  createdAt: string;
}

export interface ScheduleEvent {
  id: string;
  zoneId: string;
  type: 'supply' | 'outage' | 'maintenance' | 'emergency_hub';
  startsAt: string;
  endsAt: string;
  message: {
    en: string;
    mr: string;
    hi: string;
  };
  createdBy: string;
  status: 'draft' | 'published';
  stats: {
    sent: number;
    delivered: number;
    read: number;
  };
  emergencyHubCoords?: { lat: number; lng: number };
}

export interface CrowdReport {
  id: string;
  userId: string;
  userName?: string;
  lat: number;
  lng: number;
  zoneId: string;
  type: 'water_running' | 'water_stopped' | 'low_pressure';
  ts: string;
  confirmations: number;
  verified: boolean;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  zoneId: string;
  category: 'no_water' | 'low_pressure' | 'contamination' | 'tanker_issue';
  text: string;
  urgency: 'low' | 'med' | 'high';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved';
  slaDueAt: string;
  assignedTo?: string;
  createdAt: string;
}

export interface Society {
  id: string;
  name: string;
  zoneId: string;
  flats: number;
  adminUserId: string;
  planTier: 'basic' | 'pro' | 'enterprise';
  recurringOrders: {
    id: string;
    daysOfWeek: number[]; // 0=Sun, 1=Mon, etc.
    time: string;
    volumeL: number;
    purpose: 'general' | 'drinking';
    active: boolean;
  }[];
  approvalThresholdPaise: number;
  gateGuardUserId: string;
}

export interface GateLog {
  id: string;
  societyId: string;
  bookingId: string;
  vehicleRegNo: string;
  driverName?: string;
  vendorName?: string;
  volumeL?: number;
  sourceBadge?: string;
  entryTs: string;
  exitTs?: string;
  verifiedBy: string;
}

export interface LedgerEntry {
  id: string;
  type:
    | 'booking_payment'
    | 'commission'
    | 'payout'
    | 'refund'
    | 'subscription'
    | 'driver_incentive';
  partyId: string; // userId or vendorId
  partyName?: string;
  amountPaise: number; // positive = credit to party, negative = debit
  bookingId?: string;
  description: string;
  ts: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  channel: 'push' | 'whatsapp' | 'inapp';
  title: string;
  body: string;
  ts: string;
  read: boolean;
  deepLink?: string;
  whatsappMeta?: {
    sender: string;
    isVerifiedBusiness: boolean;
  };
}

export interface OutboxAction {
  id: string;
  type: string;
  payload: any;
  ts: string;
}
