import { Booking } from '../types';

const DEMO_SECRET = 'AQUAFLOW_PUNE_VERIFY_SECRET_2026';

export interface QrPayload {
  bookingId: string;
  nonce: string;
  issuedAt: string;
  sig: string;
}

export interface VerificationChecklist {
  signatureValid: boolean;
  freshnessValid: boolean;      // age <= 60s
  statusValid: boolean;         // booking is ARRIVED
  nonceUnused: boolean;         // one-time use
  geofenceValid: boolean;       // within 150m
  distanceM: number;
  allPassed: boolean;
  failureReason?: string;
}

// Generate SHA-256 using SubtleCrypto
export async function generateQrSignature(
  bookingId: string,
  nonce: string,
  issuedAt: string
): Promise<string> {
  const data = `${bookingId}:${nonce}:${issuedAt}:${DEMO_SECRET}`;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

export async function createDynamicQrPayload(bookingId: string): Promise<QrPayload> {
  const nonce = 'NC_' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const issuedAt = new Date().toISOString();
  const sig = await generateQrSignature(bookingId, nonce, issuedAt);
  return {
    bookingId,
    nonce,
    issuedAt,
    sig,
  };
}

// Calculate Haversine distance in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function verifyDeliveryQr(
  payloadString: string,
  booking: Booking,
  driverLat: number,
  driverLng: number,
  usedNonces: Set<string>,
  simulateGpsDrift = false
): Promise<VerificationChecklist> {
  let parsed: QrPayload;
  try {
    parsed = JSON.parse(payloadString);
  } catch (err) {
    return {
      signatureValid: false,
      freshnessValid: false,
      statusValid: false,
      nonceUnused: false,
      geofenceValid: false,
      distanceM: 9999,
      allPassed: false,
      failureReason: 'Invalid QR JSON format',
    };
  }

  // 1. Signature check
  const expectedSig = await generateQrSignature(parsed.bookingId, parsed.nonce, parsed.issuedAt);
  const signatureValid = parsed.sig === expectedSig && parsed.bookingId === booking.id;

  // 2. Freshness check: age <= 60 seconds
  const ageMs = Date.now() - new Date(parsed.issuedAt).getTime();
  const freshnessValid = ageMs >= 0 && ageMs <= 60000;

  // 3. Status check: booking must be ARRIVED
  const statusValid = booking.status === 'ARRIVED';

  // 4. One-time nonce check
  const nonceUnused = !usedNonces.has(parsed.nonce);

  // 5. Geofence check: within 150m
  let distanceM = calculateDistanceMeters(driverLat, driverLng, booking.lat, booking.lng);
  if (simulateGpsDrift) {
    distanceM = 1850; // Drifts 1.85 km away
  }
  const geofenceValid = distanceM <= 150;

  const allPassed = signatureValid && freshnessValid && statusValid && nonceUnused && geofenceValid;

  let failureReason: string | undefined;
  if (!signatureValid) failureReason = 'Cryptographic signature mismatch or booking ID tampering.';
  else if (!freshnessValid) failureReason = `QR code expired (${Math.round(ageMs / 1000)}s old > 60s limit).`;
  else if (!statusValid) failureReason = `Booking is in status "${booking.status}", expected "ARRIVED".`;
  else if (!nonceUnused) failureReason = 'Nonce has already been used. Replay attempt detected.';
  else if (!geofenceValid) failureReason = `Driver GPS is ${distanceM}m away (> 150m geofence).`;

  return {
    signatureValid,
    freshnessValid,
    statusValid,
    nonceUnused,
    geofenceValid,
    distanceM,
    allPassed,
    failureReason,
  };
}
