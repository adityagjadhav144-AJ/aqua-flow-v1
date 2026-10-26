import { db } from './db';
import { eventBus } from './eventBus';
import {
  Booking,
  BookingStatus,
  Complaint,
  CrowdReport,
  Driver,
  GateLog,
  LedgerEntry,
  NotificationItem,
  Pool,
  ScheduleEvent,
  SourceCheckIn,
  User,
  Vendor,
  Zone,
} from '../types';
import { calculatePrice, CalculatePriceParams, calculateCommissionAndPayout } from './pricing';
import { matchVendorsForBooking } from './matching';
import { createDynamicQrPayload, verifyDeliveryQr, VerificationChecklist } from './qr';
import { calculatePoolSplits } from './pooling';

const simulateLatency = (ms = Math.floor(Math.random() * 300) + 200): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

export const mockApi = {
  // --- AUTH ---
  async authOtpRequest(phone: string): Promise<{ success: boolean; message: string }> {
    await simulateLatency(300);
    return { success: true, message: 'OTP 123456 sent (Demo)' };
  },

  async authOtpVerify(phone: string, otp: string): Promise<{ success: boolean; user?: User }> {
    await simulateLatency(400);
    if (otp !== '123456') {
      throw new Error('Invalid OTP. Use 123456 for demo.');
    }
    const data = db.getData();
    const user = data.users.find((u) => u.phone.includes(phone.slice(-5))) || data.users[0];
    return { success: true, user };
  },

  // --- ZONES & SCHEDULES ---
  async getZones(): Promise<Zone[]> {
    await simulateLatency(200);
    return db.getData().zones;
  },

  async getSchedules(zoneId?: string): Promise<ScheduleEvent[]> {
    await simulateLatency(200);
    const schedules = db.getData().schedules;
    if (zoneId) {
      return schedules.filter((s) => s.zoneId === zoneId);
    }
    return schedules;
  },

  async createSchedule(event: Omit<ScheduleEvent, 'id' | 'stats'>): Promise<ScheduleEvent> {
    await simulateLatency(350);
    const newEvent: ScheduleEvent = {
      ...event,
      id: `sch-${Date.now()}`,
      stats: { sent: 0, delivered: 0, read: 0 },
    };
    db.update((d) => {
      d.schedules.unshift(newEvent);
    });
    eventBus.publish('schedule_created', newEvent);
    return newEvent;
  },

  async publishSchedule(id: string): Promise<ScheduleEvent> {
    await simulateLatency(400);
    let updated: ScheduleEvent | undefined;
    db.update((d) => {
      const sch = d.schedules.find((s) => s.id === id);
      if (sch) {
        sch.status = 'published';
        sch.stats = { sent: 14200, delivered: 13900, read: 9800 };
        updated = sch;

        // Create broadcast push notification for zone users
        const zone = d.zones.find((z) => z.id === sch.zoneId);
        const pushNotif: NotificationItem = {
          id: `notif-${Date.now()}`,
          userId: 'user-resident-1',
          channel: 'push',
          title: `PMC Alert: ${zone?.name || 'Your Zone'}`,
          body: sch.message.en,
          ts: new Date().toISOString(),
          read: false,
        };
        const waNotif: NotificationItem = {
          id: `notif-wa-${Date.now()}`,
          userId: 'user-resident-1',
          channel: 'whatsapp',
          title: 'PMC Water Notification',
          body: `💧 *Pune Water Supply Notice*\n${sch.message.en}`,
          ts: new Date().toISOString(),
          read: false,
          whatsappMeta: { sender: 'PMC Water Department', isVerifiedBusiness: true },
        };
        d.notifications.unshift(pushNotif, waNotif);
      }
    });
    eventBus.publish('schedule_published', updated);
    eventBus.publish('notification_received');
    return updated!;
  },

  // --- BOOKINGS & PRICING ---
  async quoteBooking(params: CalculatePriceParams) {
    await simulateLatency(150);
    const data = db.getData();
    const zone = data.zones.find((z) => z.id === 'z2') || data.zones[0];
    const demandIndex = data.season === 'summer' ? Math.max(1.6, zone.demandIndex * 1.3) : zone.demandIndex;
    const price = calculatePrice({ ...params, demandIndex });
    return { price, demandIndex };
  },

  async getMatchingVendors(volumeL: number, deliveryLat: number, deliveryLng: number) {
    await simulateLatency(300);
    const data = db.getData();
    return matchVendorsForBooking({
      volumeL,
      deliveryLat,
      deliveryLng,
      vendors: data.vendors,
      vehicles: data.vehicles,
      drivers: data.drivers,
      sources: data.waterSources,
      checkIns: data.sourceCheckIns,
    });
  },

  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    await simulateLatency(400);
    const data = db.getData();

    const newBooking: Booking = {
      id: `BK-${Date.now().toString().slice(-6)}`,
      customerId: bookingData.customerId || 'user-resident-1',
      societyId: bookingData.societyId,
      poolId: bookingData.poolId,
      address: bookingData.address || data.users[0].addresses[0],
      lat: bookingData.lat || 18.5592,
      lng: bookingData.lng || 73.7868,
      volumeL: bookingData.volumeL || 10000,
      purpose: bookingData.purpose || 'general',
      slot: bookingData.slot || {
        type: 'today',
        start: '10:00 AM',
        end: '12:00 PM',
        label: 'Today Standard',
      },
      vendorId: bookingData.vendorId,
      driverId: bookingData.driverId,
      vehicleId: bookingData.vehicleId,
      status: 'REQUESTED',
      price: bookingData.price!,
      commissionPaise: Math.round(bookingData.price!.total * 0.08),
      escrow: {
        status: 'held',
        heldAt: new Date().toISOString(),
      },
      timeline: [
        {
          status: 'REQUESTED',
          ts: new Date().toISOString(),
          note: 'Escrow payment held securely.',
        },
      ],
      etaMin: bookingData.etaMin || 25,
      currentLat: 18.520,
      currentLng: 73.840,
    };

    // Deduct user wallet or record UPI transaction
    db.update((d) => {
      const user = d.users.find((u) => u.id === newBooking.customerId);
      if (user) {
        user.walletPaise = Math.max(0, user.walletPaise - newBooking.price.total);
      }
      d.bookings.unshift(newBooking);

      d.ledger.unshift({
        id: `led-${Date.now()}`,
        type: 'booking_payment',
        partyId: newBooking.customerId,
        partyName: user?.name,
        amountPaise: -newBooking.price.total,
        bookingId: newBooking.id,
        description: `Escrow hold for ${newBooking.volumeL.toLocaleString('en-IN')} L tanker booking`,
        ts: new Date().toISOString(),
      });

      d.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: newBooking.customerId,
        channel: 'whatsapp',
        title: 'Booking Confirmed',
        body: `✅ Tanker booking ${newBooking.id} confirmed! ₹${(
          newBooking.price.total / 100
        ).toFixed(0)} held in escrow. Matching driver now.`,
        ts: new Date().toISOString(),
        read: false,
        whatsappMeta: { sender: 'AquaFlow Booking', isVerifiedBusiness: true },
      });
    });

    eventBus.publish('booking_created', newBooking);
    eventBus.publish('notification_received');
    return newBooking;
  },

  async getBooking(id: string): Promise<Booking | undefined> {
    await simulateLatency(150);
    return db.getData().bookings.find((b) => b.id === id);
  },

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    note?: string,
    coords?: { lat: number; lng: number }
  ): Promise<Booking> {
    await simulateLatency(250);
    let updated: Booking | undefined;
    db.update((d) => {
      const b = d.bookings.find((item) => item.id === id);
      if (b) {
        b.status = status;
        if (coords) {
          b.currentLat = coords.lat;
          b.currentLng = coords.lng;
        }
        b.timeline.push({
          status,
          ts: new Date().toISOString(),
          note,
          lat: coords?.lat,
          lng: coords?.lng,
        });

        if (status === 'ARRIVED') {
          b.etaMin = 0;
          d.notifications.unshift({
            id: `notif-${Date.now()}`,
            userId: b.customerId,
            channel: 'push',
            title: 'Tanker Arrived at Gate! 🚰',
            body: `Your tanker has arrived. Please show the dynamic QR on your screen to verify delivery.`,
            ts: new Date().toISOString(),
            read: false,
          });
        }
        updated = b;
      }
    });
    eventBus.publish('booking_status_changed', updated);
    eventBus.publish('notification_received');
    return updated!;
  },

  async cancelBooking(id: string, reason?: string): Promise<Booking> {
    await simulateLatency(300);
    let updated: Booking | undefined;
    db.update((d) => {
      const b = d.bookings.find((item) => item.id === id);
      if (b) {
        const canFreeCancel = b.status === 'REQUESTED' || b.status === 'MATCHED';
        const feePaise = canFreeCancel ? 0 : 5000; // ₹50 cancellation fee if driver already accepted
        const refundPaise = b.price.total - feePaise;

        b.status = 'CANCELLED';
        b.escrow.status = 'refunded';
        b.timeline.push({
          status: 'CANCELLED',
          ts: new Date().toISOString(),
          note: reason || (feePaise > 0 ? 'Cancelled after acceptance (₹50 fee)' : 'Cancelled by customer'),
        });

        // Refund customer
        const user = d.users.find((u) => u.id === b.customerId);
        if (user) {
          user.walletPaise += refundPaise;
        }

        d.ledger.unshift({
          id: `led-${Date.now()}`,
          type: 'refund',
          partyId: b.customerId,
          amountPaise: refundPaise,
          bookingId: b.id,
          description: `Escrow refund for cancelled booking ${b.id}${feePaise > 0 ? ' (₹50 fee deducted)' : ''}`,
          ts: new Date().toISOString(),
        });
        updated = b;
      }
    });
    eventBus.publish('booking_status_changed', updated);
    return updated!;
  },

  // --- DIGITAL POD & QR VERIFICATION ---
  async getPodQr(bookingId: string) {
    const payload = await createDynamicQrPayload(bookingId);
    return payload;
  },

  async verifyPod(params: {
    bookingId: string;
    payloadString: string;
    driverLat: number;
    driverLng: number;
    deliveredLitres: number;
    simulateGpsDrift?: boolean;
  }): Promise<{ result: VerificationChecklist; booking?: Booking }> {
    await simulateLatency(450);
    const data = db.getData();
    const booking = data.bookings.find((b) => b.id === params.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const usedNoncesSet = new Set(data.usedNonces);
    const checkResult = await verifyDeliveryQr(
      params.payloadString,
      booking,
      params.driverLat,
      params.driverLng,
      usedNoncesSet,
      params.simulateGpsDrift
    );

    if (!checkResult.allPassed) {
      return { result: checkResult };
    }

    // Success! Update booking status, escrow release, payouts, driver incentive
    let updatedBooking: Booking | undefined;
    db.update((d) => {
      const b = d.bookings.find((item) => item.id === params.bookingId);
      if (b) {
        const nonce = JSON.parse(params.payloadString).nonce;
        d.usedNonces.push(nonce);

        b.status = 'DELIVERED';
        b.escrow.status = 'released';
        b.escrow.releasedAt = new Date().toISOString();
        b.deliveredConfirmedL = params.deliveredLitres;
        b.pod = {
          nonce,
          issuedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          deliveredL: params.deliveredLitres,
          gpsDistanceM: checkResult.distanceM,
        };

        b.timeline.push({
          status: 'DELIVERED',
          ts: new Date().toISOString(),
          note: `PoD QR verified. Delivered ${params.deliveredLitres} L (GPS dist: ${checkResult.distanceM}m)`,
        });

        // Check short delivery < 95%
        let finalPayable = b.price.total;
        if (params.deliveredLitres < b.volumeL * 0.95) {
          const ratio = params.deliveredLitres / b.volumeL;
          const shortRefund = Math.round(b.price.total * (1 - ratio));
          b.shortDeliveryRefundPaise = shortRefund;
          finalPayable = b.price.total - shortRefund;

          // Refund difference to customer
          const customer = d.users.find((u) => u.id === b.customerId);
          if (customer) {
            customer.walletPaise += shortRefund;
          }
          d.ledger.unshift({
            id: `led-${Date.now()}-ref`,
            type: 'refund',
            partyId: b.customerId,
            amountPaise: shortRefund,
            bookingId: b.id,
            description: `Auto-refund for short delivery (${params.deliveredLitres} L of ${b.volumeL} L)`,
            ts: new Date().toISOString(),
          });
        }

        // Payout splits: Vendor + Platform Commission + Driver Incentive
        const vendor = d.vendors.find((v) => v.id === b.vendorId);
        const split = calculateCommissionAndPayout({
          totalPaise: finalPayable,
          orderType: b.poolId ? 'pool' : b.societyId ? 'society' : 'b2c',
          vendorPlanTier: vendor?.planTier || 'starter',
          driverIncentivePct: vendor?.driverIncentivePct || 0.12,
        });

        // Credit driver wallet
        const driver = d.drivers.find((dr) => dr.id === b.driverId);
        if (driver) {
          driver.walletPaise += split.driverIncentivePaise;
        }

        // Credit vendor wallet / ledger
        d.ledger.unshift(
          {
            id: `led-${Date.now()}-drv`,
            type: 'driver_incentive',
            partyId: driver?.id || 'driver-1',
            partyName: driver?.name,
            amountPaise: split.driverIncentivePaise,
            bookingId: b.id,
            description: `Driver per-trip incentive credit (${Math.round(
              (vendor?.driverIncentivePct || 0.12) * 100
            )}%)`,
            ts: new Date().toISOString(),
          },
          {
            id: `led-${Date.now()}-vdr`,
            type: 'payout',
            partyId: vendor?.id || 'vendor-1',
            partyName: vendor?.name,
            amountPaise: split.vendorFinalPaise,
            bookingId: b.id,
            description: `Vendor payout settled after commission & driver cut`,
            ts: new Date().toISOString(),
          },
          {
            id: `led-${Date.now()}-comm`,
            type: 'commission',
            partyId: 'platform_ops',
            partyName: 'AquaFlow Platform',
            amountPaise: split.commissionPaise,
            bookingId: b.id,
            description: `Platform commission (${split.commissionPct * 100}%)`,
            ts: new Date().toISOString(),
          }
        );

        d.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: b.customerId,
          channel: 'push',
          title: 'Delivery Confirmed! 💧',
          body: `Escrow released. Thank you! Please tap to rate the water quality and driver.`,
          ts: new Date().toISOString(),
          read: false,
        });

        updatedBooking = b;
      }
    });

    eventBus.publish('booking_status_changed', updatedBooking);
    eventBus.publish('notification_received');
    return { result: checkResult, booking: updatedBooking };
  },

  async rateBooking(bookingId: string, stars: number, tags: string[], comment?: string) {
    await simulateLatency(250);
    db.update((d) => {
      const b = d.bookings.find((item) => item.id === bookingId);
      if (b) {
        b.rating = { stars, tags, comment };

        // Check water quality tags for vendor auto-flagging
        const qualityTags = ['Cloudy', 'Odour', 'Short quantity'];
        const hasQualityIssue = tags.some((t) => qualityTags.includes(t));

        if (hasQualityIssue && b.vendorId) {
          // Count recent quality tags in past 7 days for this vendor
          const vendorBookings = d.bookings.filter(
            (bk) => bk.vendorId === b.vendorId && bk.rating && bk.rating.tags.some((t) => qualityTags.includes(t))
          );
          if (vendorBookings.length >= 3) {
            const vendor = d.vendors.find((v) => v.id === b.vendorId);
            if (vendor) {
              vendor.status = 'flagged';
              vendor.flagReason = `Auto-flagged: 3+ quality complaints (${tags.join(', ')}) in 7 days. Matching suspended pending inspection.`;
            }
          }
        }
      }
    });
  },

  // --- POOLING ---
  async getPools(zoneId?: string): Promise<Pool[]> {
    await simulateLatency(200);
    const pools = db.getData().pools;
    if (zoneId) {
      return pools.filter((p) => p.zoneId === zoneId);
    }
    return pools;
  },

  async createPool(poolData: Partial<Pool>): Promise<Pool> {
    await simulateLatency(350);
    const newPool: Pool = {
      id: `pool-${Date.now().toString().slice(-4)}`,
      leaderId: poolData.leaderId || 'user-resident-1',
      leaderName: poolData.leaderName || 'Neha Deshpande',
      zoneId: poolData.zoneId || 'z2',
      dropPoint: poolData.dropPoint || {
        lat: 18.559,
        lng: 73.786,
        label: 'Baner Community Hub',
      },
      targetL: poolData.targetL || 5000,
      minL: poolData.minL || 3000,
      deadline: poolData.deadline || new Date(Date.now() + 6 * 3600000).toISOString(),
      members: poolData.members || [
        {
          userId: 'user-resident-1',
          name: 'Neha Deshpande',
          litres: 1500,
          sharePaise: 21500,
          confirmedReceipt: false,
        },
      ],
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    db.update((d) => {
      d.pools.unshift(newPool);
    });
    eventBus.publish('pool_updated', newPool);
    return newPool;
  },

  async joinPool(poolId: string, litres: number, userId = 'user-resident-1', userName = 'Neha Deshpande'): Promise<Pool> {
    await simulateLatency(300);
    let updated: Pool | undefined;
    db.update((d) => {
      const pool = d.pools.find((p) => p.id === poolId);
      if (pool) {
        const existingMember = pool.members.find((m) => m.userId === userId);
        if (existingMember) {
          existingMember.litres += litres;
        } else {
          pool.members.push({
            userId,
            name: userName,
            litres,
            sharePaise: 0,
            confirmedReceipt: false,
          });
        }

        const splits = calculatePoolSplits(pool, 1.1);
        pool.members = splits.members;

        // Auto-confirm if target or min is reached
        const totalL = pool.members.reduce((a, b) => a + b.litres, 0);
        if (totalL >= pool.minL && pool.status === 'open') {
          pool.status = 'confirmed';
          d.notifications.unshift({
            id: `notif-${Date.now()}`,
            userId: pool.leaderId,
            channel: 'whatsapp',
            title: 'Water Pool Confirmed! 🚰',
            body: `🎉 Target reached (${totalL} L). Tanker order dispatched to vendor at capped volume rates!`,
            ts: new Date().toISOString(),
            read: false,
            whatsappMeta: { sender: 'AquaFlow Pooling', isVerifiedBusiness: true },
          });
        }
        updated = pool;
      }
    });
    eventBus.publish('pool_updated', updated);
    eventBus.publish('notification_received');
    return updated!;
  },

  // --- CROWD SOURCING ---
  async getCrowdReports(zoneId?: string): Promise<CrowdReport[]> {
    await simulateLatency(150);
    const reports = db.getData().crowdReports;
    if (zoneId) {
      return reports.filter((r) => r.zoneId === zoneId);
    }
    return reports;
  },

  async createCrowdReport(report: Omit<CrowdReport, 'id' | 'ts' | 'confirmations' | 'verified'>): Promise<CrowdReport> {
    await simulateLatency(300);
    const newReport: CrowdReport = {
      ...report,
      id: `cr-${Date.now()}`,
      ts: new Date().toISOString(),
      confirmations: 1,
      verified: false,
    };

    db.update((d) => {
      d.crowdReports.unshift(newReport);
      // Alert neighbours within 500m
      d.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: 'user-resident-1',
        channel: 'push',
        title: 'Water Running Alert 🚰',
        body: `A neighbour on your street just reported municipal tap water is running!`,
        ts: new Date().toISOString(),
        read: false,
      });

      // Increase reporter trust score
      const user = d.users.find((u) => u.id === report.userId);
      if (user) {
        user.trustScore = Math.min(100, user.trustScore + 2);
      }
    });

    eventBus.publish('crowd_report_created', newReport);
    eventBus.publish('notification_received');
    return newReport;
  },

  async confirmCrowdReport(reportId: string): Promise<CrowdReport> {
    await simulateLatency(200);
    let updated: CrowdReport | undefined;
    db.update((d) => {
      const r = d.crowdReports.find((item) => item.id === reportId);
      if (r) {
        r.confirmations += 1;
        if (r.confirmations >= 2) {
          r.verified = true;
        }
        updated = r;
      }
    });
    eventBus.publish('crowd_report_updated', updated);
    return updated!;
  },

  // --- DRIVER DAILY SOURCE CHECK-IN ---
  async driverSourceCheckIn(data: {
    driverId: string;
    sourceId: string;
    certificateNo: string;
    driverLat: number;
    driverLng: number;
    photoDataUrl?: string;
  }): Promise<SourceCheckIn> {
    await simulateLatency(400);
    const sources = db.getData().waterSources;
    const source = sources.find((s) => s.id === data.sourceId);

    const distM = source
      ? Math.round(
          Math.sqrt(
            Math.pow((data.driverLat - source.lat) * 111000, 2) +
              Math.pow((data.driverLng - source.lng) * 111000, 2)
          )
        )
      : 50;

    const isVerified = distM <= 250 && data.certificateNo.trim().length > 4;

    const checkIn: SourceCheckIn = {
      id: `chk-${Date.now()}`,
      driverId: data.driverId,
      sourceId: data.sourceId,
      ts: new Date().toISOString(),
      lat: data.driverLat,
      lng: data.driverLng,
      distanceFromSourceM: distM,
      photoDataUrl: data.photoDataUrl,
      certificateNo: data.certificateNo,
      status: isVerified ? 'verified' : 'rejected',
      rejectionReason: !isVerified
        ? distM > 250
          ? `Driver location is ${distM}m away from registered source (> 200m limit)`
          : 'Invalid or missing certificate number'
        : undefined,
    };

    db.update((d) => {
      d.sourceCheckIns.unshift(checkIn);
      if (isVerified) {
        const driver = d.drivers.find((dr) => dr.id === data.driverId);
        if (driver) {
          driver.todayCheckInId = checkIn.id;
          driver.online = true;
        }
      }
    });

    eventBus.publish('source_checkin_completed', checkIn);
    return checkIn;
  },

  // --- COMPLAINTS ---
  async getComplaints(zoneId?: string): Promise<Complaint[]> {
    await simulateLatency(200);
    const complaints = db.getData().complaints;
    if (zoneId) {
      return complaints.filter((c) => c.zoneId === zoneId);
    }
    return complaints;
  },

  async createComplaint(complaintData: Partial<Complaint>): Promise<Complaint> {
    await simulateLatency(350);
    const slaHours = complaintData.urgency === 'high' ? 4 : complaintData.urgency === 'med' ? 24 : 48;
    const newComplaint: Complaint = {
      id: `comp-${Date.now().toString().slice(-4)}`,
      userId: complaintData.userId || 'user-resident-1',
      userName: complaintData.userName || 'Neha Deshpande',
      userPhone: complaintData.userPhone || '+91 98220 12345',
      zoneId: complaintData.zoneId || 'z2',
      category: complaintData.category || 'low_pressure',
      text: complaintData.text || '',
      urgency: complaintData.urgency || 'med',
      status: 'open',
      slaDueAt: new Date(Date.now() + slaHours * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.update((d) => {
      d.complaints.unshift(newComplaint);
    });
    eventBus.publish('complaint_created', newComplaint);
    return newComplaint;
  },

  async updateComplaintStatus(
    id: string,
    status: 'open' | 'assigned' | 'in_progress' | 'resolved',
    assignedTo?: string
  ): Promise<Complaint> {
    await simulateLatency(300);
    let updated: Complaint | undefined;
    db.update((d) => {
      const c = d.complaints.find((item) => item.id === id);
      if (c) {
        c.status = status;
        if (assignedTo) c.assignedTo = assignedTo;
        updated = c;
      }
    });
    eventBus.publish('complaint_updated', updated);
    return updated!;
  },

  // --- GATE LOGS & SOCIETY ---
  async logGateEntry(entry: Omit<GateLog, 'id' | 'entryTs'>): Promise<GateLog> {
    await simulateLatency(250);
    const newLog: GateLog = {
      ...entry,
      id: `gt-${Date.now()}`,
      entryTs: new Date().toISOString(),
    };
    db.update((d) => {
      d.gateLogs.unshift(newLog);
    });
    return newLog;
  },

  async logGateExit(gateLogId: string): Promise<GateLog> {
    await simulateLatency(200);
    let updated: GateLog | undefined;
    db.update((d) => {
      const log = d.gateLogs.find((l) => l.id === gateLogId);
      if (log) {
        log.exitTs = new Date().toISOString();
        updated = log;
      }
    });
    return updated!;
  },

  // --- WALLET TOP UP ---
  async topUpWallet(userId: string, amountPaise: number) {
    await simulateLatency(300);
    db.update((d) => {
      const user = d.users.find((u) => u.id === userId);
      if (user) {
        user.walletPaise += amountPaise;
      }
      d.ledger.unshift({
        id: `led-${Date.now()}`,
        type: 'subscription',
        partyId: userId,
        amountPaise,
        description: `Wallet recharge via UPI`,
        ts: new Date().toISOString(),
      });
    });
    eventBus.publish('wallet_updated');
  },

  // --- OPS & KPIS ---
  async getOpsKpis() {
    await simulateLatency(200);
    const data = db.getData();
    const completedBookings = data.bookings.filter((b) => b.status === 'DELIVERED' || b.status === 'SETTLED');
    const totalGmvPaise = completedBookings.reduce((sum, b) => sum + b.price.total, 0);
    const totalCommissionPaise = completedBookings.reduce((sum, b) => sum + b.commissionPaise, 0);
    const totalFairCapSavingsPaise = completedBookings.reduce((sum, b) => sum + b.price.fairCapSavings, 0) + 3840000;

    return {
      gmvPaise: totalGmvPaise + 84200000, // include seeded aggregate
      commissionRevenuePaise: totalCommissionPaise + 6736000,
      activeSocieties: data.societies.length + 42,
      activeVendors: data.vendors.filter((v) => v.status === 'active').length,
      fulfilmentRatePct: 98.4,
      avgEtaMins: 22,
      totalSavedPaise: totalFairCapSavingsPaise,
      totalCompletedTrips: completedBookings.length + 380,
    };
  },
};
