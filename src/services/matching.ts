import { Driver, Vehicle, Vendor, WaterSource, SourceCheckIn } from '../types';
import { calculateDistanceMeters } from './qr';

export interface MatchCandidate {
  vendor: Vendor;
  driver: Driver;
  vehicle: Vehicle;
  waterSource?: WaterSource;
  checkIn?: SourceCheckIn;
  score: number;
  distanceKm: number;
  whyThisVendor: string;
  tag: 'recommended' | 'fastest' | 'cheapest' | 'best_rated';
  estimatedEtaMin: number;
}

export function matchVendorsForBooking(params: {
  volumeL: number;
  deliveryLat: number;
  deliveryLng: number;
  vendors: Vendor[];
  vehicles: Vehicle[];
  drivers: Driver[];
  sources: WaterSource[];
  checkIns: SourceCheckIn[];
}): MatchCandidate[] {
  const { volumeL, deliveryLat, deliveryLng, vendors, vehicles, drivers, sources, checkIns } = params;

  const candidates: MatchCandidate[] = [];

  for (const vendor of vendors) {
    // Filter 1: vendor status active (not flagged or suspended)
    if (vendor.status !== 'active') continue;

    // Vendor vehicles with capacity >= volume
    const eligibleVehicles = vehicles.filter(
      (v) => v.vendorId === vendor.id && v.capacityL >= volumeL && v.status === 'idle'
    );
    if (eligibleVehicles.length === 0) continue;

    for (const vehicle of eligibleVehicles) {
      // Find driver assigned to vehicle or vendor
      const driver = drivers.find(
        (d) => d.vendorId === vendor.id && d.online && (d.vehicleId === vehicle.id || !d.vehicleId)
      );
      if (!driver) continue;

      // Filter: driver has a VERIFIED source check-in today
      const todayCheckIn = checkIns.find(
        (c) => c.driverId === driver.id && c.status === 'verified'
      );
      if (!todayCheckIn) continue;

      const source = sources.find((s) => s.id === todayCheckIn.sourceId);
      const sourceLat = source?.lat ?? 18.5204;
      const sourceLng = source?.lng ?? 73.8567;

      // Distance from driver/source to delivery
      const driverLat = driver.currentLat ?? sourceLat;
      const driverLng = driver.currentLng ?? sourceLng;
      const distM = calculateDistanceMeters(driverLat, driverLng, deliveryLat, deliveryLng);
      const distanceKm = Math.max(1.5, Math.round((distM / 1000) * 10) / 10);

      // Score components (0 to 1 normalized)
      // Proximity: max 20km
      const proximityScore = Math.max(0, 1 - distanceKm / 20);
      // Rating: out of 5.0
      const ratingScore = vendor.rating / 5.0;
      // Source quality: verified PMC point = 1.0, borewell = 0.8
      const sourceScore = source?.type === 'PMC_FILLING_POINT' ? 1.0 : 0.85;
      // Price score: lower rate = higher score
      const priceScore = 1.0 - (vendor.ratePerLitrePaise.municipal - 8) / 10;
      // On-time pct: 0 to 1
      const onTimeScore = vendor.onTimePct / 100;

      // Score = 0.35 x proximity + 0.25 x rating + 0.20 x sourceQuality + 0.10 x priceScore + 0.10 x onTimePct
      const totalScore =
        0.35 * proximityScore +
        0.25 * ratingScore +
        0.20 * sourceScore +
        0.10 * priceScore +
        0.10 * onTimeScore;

      const estimatedEtaMin = Math.round(distanceKm * 3.5 + 15);

      const whyThisVendor = `${vendor.rating.toFixed(1)}★ rating, source verified today at ${source?.name ?? 'PMC station'} (${distanceKm} km away, ${estimatedEtaMin} mins ETA)`;

      candidates.push({
        vendor,
        driver,
        vehicle,
        waterSource: source,
        checkIn: todayCheckIn,
        score: totalScore,
        distanceKm,
        whyThisVendor,
        tag: 'recommended',
        estimatedEtaMin,
      });
    }
  }

  // Sort by total score descending
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    candidates[0].tag = 'recommended';
  }
  if (candidates.length > 1) {
    // Pick fastest or cheapest
    candidates[1].tag = candidates[1].estimatedEtaMin < candidates[0].estimatedEtaMin ? 'fastest' : 'best_rated';
  }
  if (candidates.length > 2) {
    candidates[2].tag = 'cheapest';
  }

  return candidates.slice(0, 3);
}
