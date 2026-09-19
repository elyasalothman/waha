export type FamilyRoleId = "one" | "two" | "three";

export type FamilyRole = {
  id: FamilyRoleId;
  title: string;
  name: string;
};

export type FamilyTask = {
  id: string;
  title: string;
  done: boolean;
  date: string;
};

export type FamilyAppointment = {
  id: string;
  title: string;
  at: string;
};

export type FamilyToday = {
  roles: FamilyRole[];
  tasks: FamilyTask[];
  appointments: FamilyAppointment[];
};

export const FAMILY_TODAY_KEY = "waha:family-today";

export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function tomorrowIso(now = new Date()) {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return todayIso(t);
}

export function seedFamilyToday(): FamilyToday {
  return {
    roles: [
      { id: "one", title: "رب الأسرة", name: "" },
      { id: "two", title: "ربة المنزل", name: "" },
      { id: "three", title: "الابن / الابنة", name: "" },
    ],
    tasks: [],
    appointments: [],
  };
}

export function normalizeFamilyToday(raw: unknown): FamilyToday {
  const seed = seedFamilyToday();
  if (!raw || typeof raw !== "object") return seed;
  const rec = raw as Partial<FamilyToday>;
  const roles = Array.isArray(rec.roles)
    ? seed.roles.map((role) => {
        const found = rec.roles?.find((r) => r && r.id === role.id);
        return found && typeof found.name === "string" ? { ...role, name: found.name, title: found.title || role.title } : role;
      })
    : seed.roles;
  const tasks = Array.isArray(rec.tasks)
    ? rec.tasks.filter((t): t is FamilyTask => !!t && typeof t.id === "string" && typeof t.title === "string")
    : [];
  const appointments = Array.isArray(rec.appointments)
    ? rec.appointments.filter((a): a is FamilyAppointment => !!a && typeof a.id === "string" && typeof a.title === "string")
    : [];
  return { roles, tasks, appointments };
}

export function todaysTasks(store: FamilyToday, day: string) {
  return store.tasks.filter((t) => t.date === day);
}

export function tomorrowAppointments(store: FamilyToday, day: string) {
  return store.appointments.filter((a) => a.at.startsWith(day));
}
