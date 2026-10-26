import {
  Booking,
  Complaint,
  CrowdReport,
  Driver,
  GateLog,
  LedgerEntry,
  NotificationItem,
  OutboxAction,
  Pool,
  ScheduleEvent,
  Society,
  SourceCheckIn,
  User,
  Vehicle,
  Vendor,
  WaterSource,
  Zone,
} from '../types';
import {
  SEED_BOOKINGS,
  SEED_COMPLAINTS,
  SEED_CROWD_REPORTS,
  SEED_DRIVERS,
  SEED_GATE_LOGS,
  SEED_LEDGER_ENTRIES,
  SEED_NOTIFICATIONS,
  SEED_POOLS,
  SEED_SCHEDULES,
  SEED_SOCIETIES,
  SEED_SOURCE_CHECKINS,
  SEED_USERS,
  SEED_VEHICLES,
  SEED_VENDORS,
  SEED_WATER_SOURCES,
  SEED_ZONES,
} from '../data/seed';

const STORAGE_KEY = 'aquaflow_db_v1';

export interface DatabaseSchema {
  users: User[];
  zones: Zone[];
  waterSources: WaterSource[];
  sourceCheckIns: SourceCheckIn[];
  vendors: Vendor[];
  vehicles: Vehicle[];
  drivers: Driver[];
  bookings: Booking[];
  pools: Pool[];
  schedules: ScheduleEvent[];
  crowdReports: CrowdReport[];
  complaints: Complaint[];
  societies: Society[];
  gateLogs: GateLog[];
  ledger: LedgerEntry[];
  notifications: NotificationItem[];
  outbox: OutboxAction[];
  isOfflineSimulated: boolean;
  season: 'normal' | 'summer';
  usedNonces: string[];
}

function getInitialData(): DatabaseSchema {
  return {
    users: [...SEED_USERS],
    zones: [...SEED_ZONES],
    waterSources: [...SEED_WATER_SOURCES],
    sourceCheckIns: [...SEED_SOURCE_CHECKINS],
    vendors: [...SEED_VENDORS],
    vehicles: [...SEED_VEHICLES],
    drivers: [...SEED_DRIVERS],
    bookings: [...SEED_BOOKINGS],
    pools: [...SEED_POOLS],
    schedules: [...SEED_SCHEDULES],
    crowdReports: [...SEED_CROWD_REPORTS],
    complaints: [...SEED_COMPLAINTS],
    societies: [...SEED_SOCIETIES],
    gateLogs: [...SEED_GATE_LOGS],
    ledger: [...SEED_LEDGER_ENTRIES],
    notifications: [...SEED_NOTIFICATIONS],
    outbox: [],
    isOfflineSimulated: false,
    season: 'normal',
    usedNonces: [],
  };
}

class MockDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        return JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data, initializing seed:', e);
    }
    const initial = getInitialData();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(state = this.data): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public addUser(user: User): User {
    this.update((d) => {
      // Remove any existing user with same id or phone
      const existingIdx = d.users.findIndex((u) => u.id === user.id || (user.phone && u.phone === user.phone));
      if (existingIdx >= 0) {
        d.users[existingIdx] = user;
      } else {
        d.users.push(user);
      }
    });
    return user;
  }

  public update(updater: (draft: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.saveToStorage();
    return this.data;
  }

  public reset(): DatabaseSchema {
    this.data = getInitialData();
    this.saveToStorage();
    return this.data;
  }
}

export const db = new MockDatabase();
