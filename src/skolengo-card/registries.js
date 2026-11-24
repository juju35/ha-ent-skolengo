// ── Registries ──
// Every device with Skolengo student entities is a student (one integration entry per student). The school news
// sensor sits on a device of its own (one per school): it is attached to the students of that school.
import { PLATFORM, roleOf } from "./core.js";

export const _cache = new WeakMap();
export const resolve = (hass) => {
  const ents = hass?.entities || {};
  const hit = _cache.get(ents);
  if (hit && hit.devices === hass.devices) return hit.students;
  const byDevice = new Map();
  const news = [];
  for (const e of Object.values(ents)) {
    if (e.platform !== PLATFORM || !e.device_id) continue;
    const role = roleOf(e);
    if (!role) continue;
    const d = hass.devices?.[e.device_id] || {};
    if (role === "information") {
      news.push({ entity: e.entity_id, school: String(d.name || "").replace(/^Skolengo\s*-\s*/i, "") });
      continue;
    }
    let s = byDevice.get(e.device_id);
    if (!s) {
      s = { id: e.device_id, deviceName: d.name_by_user || d.name || "", entities: {} };
      byDevice.set(e.device_id, s);
    }
    s.entities[role] ??= e.entity_id;
  }
  const students = [...byDevice.values()].sort((a, b) => a.deviceName.localeCompare(b.deviceName));
  // The news of the student's school (the school name of its class sensor), else the only school's news.
  for (const s of students) {
    const school = String(hass.states?.[s.entities.class]?.attributes?.school || "").toLowerCase();
    const own = news.find((n) => school && n.school.toLowerCase() === school) || (news.length === 1 ? news[0] : null);
    if (own) s.entities.information = own.entity;
  }
  // The school name comes from a state: not cached until the class sensors have one (Home Assistant still loading).
  const pending = students.some((s) => s.entities.class && !hass.states?.[s.entities.class]);
  if (!pending) _cache.set(ents, { devices: hass.devices, students });
  return students;
};

// The student's name: the name set on the device, else the device name without its "Skolengo - " prefix.
export const studentName = (hass, s) => {
  const d = hass.devices?.[s.id];
  if (d?.name_by_user) return d.name_by_user;
  return s.deviceName.replace(/^Skolengo\s*-\s*/i, "") || s.id;
};

export const matches = (hass, s, ref) => {
  const r = String(ref).toLowerCase();
  return s.id === ref || s.deviceName.toLowerCase() === r || studentName(hass, s).toLowerCase() === r;
};

// The students a card shows: `device` (one) or `devices` (a list, in its order), else all of them.
export const findStudents = (hass, config) => {
  const all = resolve(hass);
  if (!all.length) return { error: "no_student" };
  const refs = config.devices ? [].concat(config.devices) : config.device ? [config.device] : [];
  if (!refs.length) return { students: all };
  const students = [];
  for (const ref of refs) {
    const s = all.find((x) => matches(hass, x, ref));
    if (!s) return { error: "unknown_device", ref };
    if (!students.includes(s)) students.push(s);
  }
  return { students };
};

export const listStudents = (hass) => resolve(hass).map((s) => ({ value: s.id, label: studentName(hass, s) }));
