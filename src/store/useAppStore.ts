import { create } from 'zustand';
import { Language, Role, User } from '../types';
import { db } from '../services/db';
import { translations } from '../i18n/translations';
import { simulationEngine } from '../services/simulation';

interface AppState {
  isAuthenticated: boolean;
  currentRole: Role;
  currentUser: User;
  currentLanguage: Language;
  season: 'normal' | 'summer';
  isOffline: boolean;
  activeTourStep: number | null; // 0 to 6 or null
  unreadCount: number;
  isAquaBotOpen: boolean;
  isNotifCenterOpen: boolean;
  selectedBookingId?: string;

  // Actions
  login: (userOrId: User | string) => boolean;
  registerUser: (newUser: User) => void;
  logout: () => void;
  setRole: (role: Role) => void;
  setLanguage: (lang: Language) => void;
  setSeason: (season: 'normal' | 'summer') => void;
  setOffline: (offline: boolean) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  closeTour: () => void;
  toggleAquaBot: () => void;
  toggleNotifCenter: () => void;
  setSelectedBookingId: (id: string) => void;
  refreshUnreadCount: () => void;
  t: (key: string) => string;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: false, // Strict login wall on load
  currentRole: 'resident',
  currentUser: db.getData().users[0],
  currentLanguage: 'en',
  season: 'normal',
  isOffline: false,
  activeTourStep: null,
  unreadCount: db.getData().notifications.filter((n) => !n.read).length,
  isAquaBotOpen: false,
  isNotifCenterOpen: false,
  selectedBookingId: 'BK-2026-9041',

  login: (userOrId: User | string) => {
    let targetUser: User | undefined;
    if (typeof userOrId === 'string') {
      const users = db.getData().users;
      const cleanQuery = userOrId.trim().toLowerCase();
      targetUser = users.find(
        (u) =>
          u.id === userOrId ||
          (u.email && u.email.toLowerCase() === cleanQuery) ||
          (u.phone && u.phone.replace(/\s+/g, '') === cleanQuery.replace(/\s+/g, ''))
      );
    } else {
      targetUser = userOrId;
    }

    if (!targetUser) return false;

    if (targetUser.role === 'driver') {
      simulationEngine.setAutopilot(false);
    } else {
      simulationEngine.setAutopilot(true);
    }

    set({
      isAuthenticated: true,
      currentUser: targetUser,
      currentRole: targetUser.role,
      currentLanguage: targetUser.language || get().currentLanguage,
    });
    return true;
  },

  registerUser: (newUser: User) => {
    db.addUser(newUser);
    if (newUser.role === 'driver') {
      simulationEngine.setAutopilot(false);
    } else {
      simulationEngine.setAutopilot(true);
    }
    set({
      isAuthenticated: true,
      currentUser: newUser,
      currentRole: newUser.role,
      currentLanguage: newUser.language || get().currentLanguage,
    });
  },

  logout: () => {
    set({ isAuthenticated: false });
  },

  setRole: (role: Role) => {
    const data = db.getData();
    let targetUser = data.users.find((u) => u.role === role);
    if (!targetUser) targetUser = data.users[0];

    // Pause autopilot if human switches to driver to allow manual control
    if (role === 'driver') {
      simulationEngine.setAutopilot(false);
    } else {
      simulationEngine.setAutopilot(true);
    }

    set({ currentRole: role, currentUser: targetUser });
  },

  setLanguage: (lang: Language) => {
    set({ currentLanguage: lang });
    db.update((d) => {
      const u = d.users.find((user) => user.id === get().currentUser.id);
      if (u) u.language = lang;
    });
  },

  setSeason: (season: 'normal' | 'summer') => {
    simulationEngine.setSeason(season);
    set({ season });
  },

  setOffline: (offline: boolean) => {
    simulationEngine.setSimulateOffline(offline);
    set({ isOffline: offline });
  },

  startTour: () => set({ activeTourStep: 0, currentRole: 'resident' }),
  nextTourStep: () => {
    const current = get().activeTourStep;
    if (current === null) return;
    if (current >= 6) {
      set({ activeTourStep: null });
    } else {
      const next = current + 1;
      // Switch roles appropriately according to the tour narrative
      if (next === 2) get().setRole('driver');
      else if (next === 3) get().setRole('resident');
      else if (next === 4) get().setRole('driver');
      else if (next === 5) get().setRole('municipal');
      else if (next === 6) get().setRole('ops');
      set({ activeTourStep: next });
    }
  },
  prevTourStep: () => {
    const current = get().activeTourStep;
    if (current === null || current <= 0) return;
    const prev = current - 1;
    if (prev === 0 || prev === 1) get().setRole('resident');
    else if (prev === 2) get().setRole('driver');
    else if (prev === 3) get().setRole('resident');
    else if (prev === 4) get().setRole('driver');
    else if (prev === 5) get().setRole('municipal');
    set({ activeTourStep: prev });
  },
  closeTour: () => set({ activeTourStep: null }),

  toggleAquaBot: () => set((state) => ({ isAquaBotOpen: !state.isAquaBotOpen })),
  toggleNotifCenter: () => {
    set((state) => {
      if (!state.isNotifCenterOpen) {
        // Mark all as read
        db.update((d) => {
          d.notifications.forEach((n) => (n.read = true));
        });
      }
      return {
        isNotifCenterOpen: !state.isNotifCenterOpen,
        unreadCount: 0,
      };
    });
  },

  setSelectedBookingId: (id: string) => set({ selectedBookingId: id }),

  refreshUnreadCount: () => {
    const count = db.getData().notifications.filter((n) => !n.read).length;
    set({ unreadCount: count });
  },

  t: (key: string) => {
    const lang = get().currentLanguage;
    return translations[lang]?.[key] || translations.en[key] || key;
  },
}));
