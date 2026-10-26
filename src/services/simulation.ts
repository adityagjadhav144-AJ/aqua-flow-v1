import { db } from './db';
import { eventBus } from './eventBus';
import { Booking, BookingStatus } from '../types';

export interface SimulationConfig {
  timeSpeed: 1 | 10 | 60;
  autopilotDrivers: boolean;
  isPaused: boolean;
}

class SimulationEngine {
  private config: SimulationConfig = {
    timeSpeed: 1,
    autopilotDrivers: true,
    isPaused: false,
  };
  private intervalId: any = null;
  private tickCounter = 0;

  constructor() {
    this.start();
  }

  public setTimeSpeed(speed: 1 | 10 | 60) {
    this.config.timeSpeed = speed;
  }

  public setAutopilot(enabled: boolean) {
    this.config.autopilotDrivers = enabled;
  }

  public setPaused(paused: boolean) {
    this.config.isPaused = paused;
  }

  public getConfig(): SimulationConfig {
    return { ...this.config };
  }

  public start() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private tick() {
    if (this.config.isPaused) return;
    this.tickCounter++;

    const scaledSeconds = this.config.timeSpeed;
    const data = db.getData();

    // 1. Truck movement & status progression for active bookings
    let bookingsChanged = false;
    db.update((d) => {
      for (const booking of d.bookings) {
        if (booking.status === 'CANCELLED' || booking.status === 'DELIVERED' || booking.status === 'SETTLED') {
          continue;
        }

        // Autopilot driver state machine
        if (this.config.autopilotDrivers) {
          if (booking.status === 'REQUESTED') {
            // Match vendor & driver
            booking.status = 'MATCHED';
            booking.timeline.push({
              status: 'MATCHED',
              ts: new Date().toISOString(),
              note: 'Auto-matched to Shree Ganesh Water Suppliers',
            });
            booking.vendorId = 'vendor-1';
            booking.driverId = 'driver-1';
            booking.vehicleId = 'veh-1';
            booking.sourceCheckInId = 'chk-1';
            bookingsChanged = true;
          } else if (booking.status === 'MATCHED') {
            // Driver accepts after short delay
            booking.status = 'ACCEPTED';
            booking.timeline.push({
              status: 'ACCEPTED',
              ts: new Date().toISOString(),
              note: 'Driver Santosh Jadhav accepted the trip',
            });
            bookingsChanged = true;
          } else if (booking.status === 'ACCEPTED') {
            // Driver starts filling
            booking.status = 'FILLING';
            booking.timeline.push({
              status: 'FILLING',
              ts: new Date().toISOString(),
              note: 'Tanker filling at PMC Parvati filling station',
            });
            bookingsChanged = true;
          } else if (booking.status === 'FILLING') {
            // After filling, go en route
            booking.status = 'EN_ROUTE';
            booking.currentLat = 18.510;
            booking.currentLng = 73.835;
            booking.timeline.push({
              status: 'EN_ROUTE',
              ts: new Date().toISOString(),
              note: 'Departed source. En route to destination.',
            });
            bookingsChanged = true;
          }
        }

        // EN_ROUTE truck movement interpolation
        if (booking.status === 'EN_ROUTE') {
          const destLat = booking.lat;
          const destLng = booking.lng;
          const currLat = booking.currentLat || 18.510;
          const currLng = booking.currentLng || 73.835;

          const dLat = destLat - currLat;
          const dLng = destLng - currLng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          // Speed: approx 0.0001 lat/lng degree per tick * speed
          const stepSize = 0.00015 * scaledSeconds;

          if (dist <= stepSize * 1.5) {
            // Truck has arrived!
            booking.currentLat = destLat;
            booking.currentLng = destLng;
            booking.status = 'ARRIVED';
            booking.etaMin = 0;
            booking.timeline.push({
              status: 'ARRIVED',
              ts: new Date().toISOString(),
              lat: destLat,
              lng: destLng,
              note: 'Arrived at delivery gate. Dynamic QR verification required.',
            });
            d.notifications.unshift({
              id: `notif-${Date.now()}`,
              userId: booking.customerId,
              channel: 'push',
              title: 'Tanker Arrived at Gate! 🚰',
              body: `Tanker MH-12 AB 4821 has arrived. Show the dynamic QR code on your phone to driver Santosh Jadhav.`,
              ts: new Date().toISOString(),
              read: false,
            });
            bookingsChanged = true;
          } else {
            // Interpolate position
            const ratio = stepSize / dist;
            booking.currentLat = currLat + dLat * ratio;
            booking.currentLng = currLng + dLng * ratio;
            // Recalculate ETA (approx 3 mins per 0.01 deg)
            booking.etaMin = Math.max(1, Math.round((dist / 0.01) * 3));
            bookingsChanged = true;
          }
        }
      }

      // 2. Random walk for Zone demand indices (every ~15 ticks)
      if (this.tickCounter % 15 === 0) {
        const isSummer = d.season === 'summer';
        for (const zone of d.zones) {
          const minD = isSummer ? 1.4 : 0.85;
          const maxD = isSummer ? 2.0 : 1.35;
          const delta = (Math.random() - 0.5) * 0.05;
          zone.demandIndex = Math.min(maxD, Math.max(minD, Math.round((zone.demandIndex + delta) * 100) / 100));
        }
      }

      // 3. Simulated bot neighbours joining open pools (every ~20 ticks)
      if (this.tickCounter % 20 === 0) {
        const openPool = d.pools.find((p) => p.status === 'open');
        if (openPool) {
          const botNames = ['Vikram Joshi', 'Radhika Apte', 'Sachin Kadam', 'Kavita Shinde'];
          const randomName = botNames[Math.floor(Math.random() * botNames.length)];
          const hasAlready = openPool.members.some((m) => m.name === randomName);
          if (!hasAlready) {
            openPool.members.push({
              userId: `bot-${Date.now()}`,
              name: randomName,
              litres: 500,
              sharePaise: 7200,
              confirmedReceipt: false,
            });
            const total = openPool.members.reduce((a, b) => a + b.litres, 0);
            if (total >= openPool.minL) {
              openPool.status = 'confirmed';
            }
          }
        }
      }
    });

    if (bookingsChanged) {
      eventBus.publish('simulation_tick');
    }
  }

  // Demo Trigger shortcuts
  public triggerDriverArriveNow(bookingId?: string) {
    db.update((d) => {
      const b = bookingId ? d.bookings.find((item) => item.id === bookingId) : d.bookings[0];
      if (b) {
        b.status = 'ARRIVED';
        b.currentLat = b.lat;
        b.currentLng = b.lng;
        b.etaMin = 0;
        b.timeline.push({
          status: 'ARRIVED',
          ts: new Date().toISOString(),
          note: 'Fast-forwarded to Arrived via Demo panel.',
        });
        d.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: b.customerId,
          channel: 'push',
          title: 'Tanker Arrived at Gate! 🚰',
          body: `Tanker has arrived at your gate. Open AquaFlow to display your delivery QR code.`,
          ts: new Date().toISOString(),
          read: false,
        });
      }
    });
    eventBus.publish('simulation_tick');
    eventBus.publish('notification_received');
  }

  public triggerMunicipalOutage(zoneId = 'z2') {
    db.update((d) => {
      const zone = d.zones.find((z) => z.id === zoneId);
      if (zone) {
        zone.currentStatus = 'outage';
        d.schedules.unshift({
          id: `sch-outage-${Date.now()}`,
          zoneId,
          type: 'outage',
          startsAt: new Date().toISOString(),
          endsAt: new Date(Date.now() + 6 * 3600000).toISOString(),
          message: {
            en: `Urgent: Emergency water feeder line repair in ${zone.name}. Tap supply suspended for 6 hrs. Emergency tankers standing by.`,
            mr: `तातडीची सूचना: ${zone.name} मध्ये पाईपलाईन दुरुस्ती सुरू असल्याने पुढील ६ तास पाणीपुरवठा बंद राहील.`,
            hi: `महत्वपूर्ण सूचना: ${zone.name} में पाइपलाइन मरम्मत के कारण अगले 6 घंटे जलापूर्ति बंद रहेगी।`,
          },
          createdBy: 'PMC Emergency Control',
          status: 'published',
          stats: { sent: 12000, delivered: 11800, read: 8400 },
        });

        d.notifications.unshift(
          {
            id: `notif-${Date.now()}`,
            userId: 'user-resident-1',
            channel: 'push',
            title: `⚠️ Outage Alert: ${zone.name}`,
            body: `Emergency pipeline shutdown in your area for 6 hrs. Tanker booking enabled.`,
            ts: new Date().toISOString(),
            read: false,
          },
          {
            id: `notif-wa-${Date.now()}`,
            userId: 'user-resident-1',
            channel: 'whatsapp',
            title: 'PMC Emergency Update',
            body: `⚠️ *PMC Urgent Notice*: Feeder line repair in ${zone.name}. Supply suspended until evening. Book capped tankers via AquaFlow.`,
            ts: new Date().toISOString(),
            read: false,
            whatsappMeta: { sender: 'PMC Water Dept', isVerifiedBusiness: true },
          }
        );
      }
    });
    eventBus.publish('simulation_tick');
    eventBus.publish('notification_received');
  }

  public triggerNeighbourWaterRunning(zoneId = 'z2') {
    db.update((d) => {
      d.crowdReports.unshift({
        id: `cr-${Date.now()}`,
        userId: 'user-neighbour-sim',
        userName: 'Sunita Gavali (Baner Rd)',
        lat: 18.5595,
        lng: 73.7874,
        zoneId,
        type: 'water_running',
        ts: new Date().toISOString(),
        confirmations: 3,
        verified: true,
      });

      d.notifications.unshift({
        id: `notif-${Date.now()}`,
        userId: 'user-resident-1',
        channel: 'push',
        title: 'Tap Water Running! 🚰',
        body: `Sunita G. and 3 neighbours on your street report municipal water is flowing now!`,
        ts: new Date().toISOString(),
        read: false,
      });
    });
    eventBus.publish('simulation_tick');
    eventBus.publish('notification_received');
  }

  public triggerVendorDeclineReassign(bookingId?: string) {
    db.update((d) => {
      const b = bookingId ? d.bookings.find((item) => item.id === bookingId) : d.bookings[0];
      if (b) {
        b.status = 'REASSIGNED';
        b.reassignCount = (b.reassignCount || 0) + 1;
        b.vendorId = 'vendor-2'; // Reassigned to Sahyadri Aqua Services
        b.driverId = 'driver-3';
        b.vehicleId = 'veh-7';
        b.timeline.push({
          status: 'REASSIGNED',
          ts: new Date().toISOString(),
          note: `Driver Santosh timed out (90s). Auto-reassigned to Sahyadri Aqua Services (Tukaram Gaikwad).`,
        });

        d.notifications.unshift({
          id: `notif-${Date.now()}`,
          userId: b.customerId,
          channel: 'push',
          title: 'Tanker Reassigned 🔄',
          body: `First driver was delayed. Reassigned immediately to Sahyadri Aqua Services (4.4★). No price change.`,
          ts: new Date().toISOString(),
          read: false,
        });

        // Move to MATCHED
        setTimeout(() => {
          b.status = 'MATCHED';
          eventBus.publish('simulation_tick');
        }, 1200);
      }
    });
    eventBus.publish('simulation_tick');
    eventBus.publish('notification_received');
  }

  public setSeason(season: 'normal' | 'summer') {
    db.update((d) => {
      d.season = season;
      for (const zone of d.zones) {
        zone.demandIndex = season === 'summer' ? Math.max(1.6, zone.demandIndex * 1.35) : 1.1;
      }
    });
    eventBus.publish('simulation_tick');
  }

  public setSimulateOffline(offline: boolean) {
    db.update((d) => {
      d.isOfflineSimulated = offline;
    });
    eventBus.publish('offline_status_changed', offline);
  }

  public resetDemoData() {
    db.reset();
    eventBus.publish('db_reset');
  }
}

export const simulationEngine = new SimulationEngine();
