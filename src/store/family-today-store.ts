import { create } from "zustand";
import {
  FAMILY_TODAY_KEY,
  normalizeFamilyToday,
  seedFamilyToday,
  type FamilyAppointment,
  type FamilyRoleId,
  type FamilyTask,
  type FamilyToday,
} from "@/lib/family-today";

type State = FamilyToday & {
  ready: boolean;
  hydrate: () => void;
  setRole: (id: FamilyRoleId, name: string) => void;
  addTask: (title: string, date: string) => void;
  toggleTask: (id: string) => void;
  addAppointment: (title: string, at: string) => void;
  removeAppointment: (id: string) => void;
};

function persist(state: FamilyToday) {
  try {
    localStorage.setItem(FAMILY_TODAY_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export const useFamilyTodayStore = create<State>((set, get) => ({
  ...seedFamilyToday(),
  ready: false,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(FAMILY_TODAY_KEY);
      set({ ...normalizeFamilyToday(raw ? JSON.parse(raw) : null), ready: true });
    } catch {
      set({ ...seedFamilyToday(), ready: true });
    }
  },
  setRole: (id, name) => {
    const roles = get().roles.map((r) => (r.id === id ? { ...r, name } : r));
    const next = { roles, tasks: get().tasks, appointments: get().appointments };
    persist(next);
    set(next);
  },
  addTask: (title, date) => {
    const text = title.trim();
    if (!text) return;
    const task: FamilyTask = { id: crypto.randomUUID(), title: text, done: false, date };
    const next = { roles: get().roles, tasks: [task, ...get().tasks], appointments: get().appointments };
    persist(next);
    set(next);
  },
  toggleTask: (id) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    const next = { roles: get().roles, tasks, appointments: get().appointments };
    persist(next);
    set(next);
  },
  addAppointment: (title, at) => {
    const text = title.trim();
    if (!text || !at) return;
    const item: FamilyAppointment = { id: crypto.randomUUID(), title: text, at };
    const next = { roles: get().roles, tasks: get().tasks, appointments: [item, ...get().appointments] };
    persist(next);
    set(next);
  },
  removeAppointment: (id) => {
    const next = {
      roles: get().roles,
      tasks: get().tasks,
      appointments: get().appointments.filter((a) => a.id !== id),
    };
    persist(next);
    set(next);
  },
}));
