// ── Lessons ──
// The lessons, homework, grades and news of the Skolengo sensors as the cards draw them, and the base of the cards.
import { esc, intlLocale, list, t, valid } from "./core.js";
import { addDays, dayLabel, keyOf, now, timeOf, todayKey } from "./dates.js";
import { colorOf, fmtNum, parseNum, svgIcon } from "./numbers.js";
import { findStudents, studentName } from "./registries.js";
import { BASE_STYLE, CLOSE_GUARD_MS, isOutside, watchOutside } from "./styles.js";
import { sceneSvg } from "./picture.js";
import { BANNER_STYLE, deskSvg, isNight } from "./illustrated-header.js";

export let bannerUid = 0;

export const lessonState = (l, nowMs) => {
  const start = Date.parse(l.start_at);
  const end = Date.parse(l.end_at);
  const running = !l.canceled && start <= nowMs && nowMs < end;
  return {
    canceled: l.canceled === true,
    running,
    past: Number.isFinite(end) && end <= nowMs,
    progress: running ? Math.round(((nowMs - start) / (end - start)) * 100) : 0,
  };
};

// Skolengo gives instants (`2026-11-17T07:00:00Z`): their day and time are read in Home Assistant's time zone.
export const ZONED = {};
export const zoned = (iso, tz) => {
  if (typeof iso !== "string" || !iso) return { day: "", time: "" };
  if (!/T\d{2}:\d{2}/.test(iso)) return { day: keyOf(iso), time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: keyOf(iso), time: timeOf(iso) };
  const id = tz || "";
  try {
    ZONED[id] ??= new Intl.DateTimeFormat("en-CA", { timeZone: tz || undefined, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  } catch (_err) {
    ZONED[id] ??= new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  }
  const p = Object.fromEntries(ZONED[id].formatToParts(d).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
};
// Home Assistant's time zone, or the browser's when the user's profile asks for local time.
export const zoneOf = (hass) => (hass?.locale?.time_zone === "local" ? undefined : hass?.config?.time_zone || undefined);

// A lesson of the `lessons` attribute (timetable sensors) as the cards draw it.
export const normLesson = (l, tz) => {
  const a = zoned(l.start, tz);
  const b = zoned(l.end, tz);
  const teachers = Array.isArray(l.teachers) ? l.teachers.filter(Boolean) : [];
  return {
    id: l.id,
    start_at: l.start,
    end_at: l.end,
    day: a.day,
    start_time: a.time,
    end_time: b.time,
    lesson: l.subject || "",
    classroom: l.location || "",
    teacher_name: teachers.join(", "),
    background_color: l.subject_color,
    canceled: l.canceled === true,
  };
};

// A gap of 30 min or more around noon between two lessons (one ending by 14:00, the next starting from 11:00).
export const isLunchBreak = (prev, l) => {
  if (!prev?.end_time || !l?.start_time) return false;
  const gap = Date.parse(l.start_at) - Date.parse(prev.end_at);
  return gap >= 30 * 60000 && prev.end_time <= "14:00" && l.start_time >= "11:00";
};

export const lessonsOf = (s, tz) =>
  list(s, "lessons")
    .filter((l) => l && typeof l === "object")
    .map((l) => normLesson(l, tz))
    .sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)));

// Named HTML entities a French homework text uses; numeric ones are decoded whatever they are.
export const ENTITIES = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", eacute: "é", egrave: "è", ecirc: "ê", euml: "ë", agrave: "à",
  acirc: "â", ccedil: "ç", icirc: "î", iuml: "ï", ocirc: "ô", ugrave: "ù", ucirc: "û", uuml: "ü", oelig: "œ", aelig: "æ",
  Eacute: "É", Egrave: "È", Ecirc: "Ê", Agrave: "À", Ccedil: "Ç", Ocirc: "Ô", OElig: "Œ", laquo: "«", raquo: "»",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", ndash: "–", mdash: "—", euro: "€", deg: "°", middot: "·", bull: "•",
};
export const decodeEntities = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, code) => {
    if (code[0] !== "#") return ENTITIES[code] ?? m;
    const n = code[1] === "x" || code[1] === "X" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
  });

// The text of a homework's HTML (Skolengo's description), without its tags.
export const htmlText = (html) => {
  if (!html) return "";
  const text = decodeEntities(
    String(html)
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
      .replace(/<\s*(br|\/p|\/div|\/li|\/h\d)\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]*>/g, ""),
  );
  return text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n");
};

// The homework of the `homework_due` sensor: to do (`assignments`) then done (`done_assignments`).
export const homeworkOf = (st, tz) =>
  [...list(st, "assignments"), ...list(st, "done_assignments")]
    .filter((h) => h && typeof h === "object")
    .map((h) => ({
      id: h.id,
      date: zoned(h.due_date, tz).day,
      done: h.done === true,
      subject: h.subject || "",
      background_color: h.subject_color,
      short_description: h.title || "",
      description: htmlText(h.html),
      teacher: h.teacher || "",
    }));

export const FOCUS_SELECTOR = "[data-action], [data-entity]";
export const focusKey = (el) => {
  const data = Object.entries({ ...el.dataset });
  return data.length ? `${el.tagName}|${JSON.stringify(data)}` : "";
};

export class SkolengoBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._toggled = new Map();
    this._uid = ++bannerUid;
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    // No rewrite of the card between the press and the release: Home Assistant updates the card several times a
    // second, and a rewrite under the pointer replaces the element pressed, so that the click lands on the card
    // itself and does nothing. The pending render is done once released (after the click).
    this._onPressStart = () => {
      this._byPointer = true;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    };
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      setTimeout(() => {
        this._pressing = false;
        if (!this._dirty) return;
        this._dirty = false;
        this._update();
      }, 0);
    };
    this.shadowRoot.addEventListener("pointerdown", this._onPressStart);
    // Enter / Space on an element with the button role acts as a click, as on a <button>.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
      this._byPointer = false;
      if ((ev.key !== "Enter" && ev.key !== " ") || ev.target?.getAttribute?.("role") !== "button") return;
      ev.preventDefault();
      ev.target.click();
    });
    // Escape closes the popup, listened on the window while it is open.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._popup) return;
      ev.stopPropagation();
      this._closePopup();
    };
  }

  set hass(hass) {
    this._hass = hass;
    const deps = this._deps();
    const prev = this._lastDeps;
    if (deps && prev && deps.length === prev.length && deps.every((d, i) => d === prev[i])) return;
    this._lastDeps = deps;
    this._update();
  }

  get hass() {
    return this._hass;
  }

  // What a render reads from hass: registries, language, theme, the students' states, and the minute (the lesson
  // going on and its progress move on their own).
  _deps() {
    const h = this._hass;
    if (!h || !this._config) return null;
    const { students } = findStudents(h, this._config);
    if (!students) return null;
    const ids = students.flatMap((s) => Object.values(s.entities));
    return [h.entities, h.devices, h.language, h.locale, h.themes?.darkMode, Math.floor(now() / 60000), ...ids.map((id) => h.states[id])];
  }

  // A click elsewhere on the page folds the sections back to their defaults and closes the popup.
  connectedCallback() {
    this._onOutside ??= (ev) => {
      if ((!this._toggled.size && !this._popup) || !isOutside(this, ev)) return;
      this._toggled = new Map();
      if (this._popup) this._closePopup();
      else this._update();
    };
    this._outside ??= watchOutside(this, (ev) => this._onOutside(ev));
    this._outside.on();
    if (this._popup) window.addEventListener("keydown", this._onKey);
    // A new width (or the web font loaded): the status pill is fitted again, in the next frame.
    if (typeof ResizeObserver === "function") {
      this._resize ??= new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        cancelAnimationFrame(this._fitFrame);
        this._fitFrame = requestAnimationFrame(() => this._fitPill());
      });
      this._resize.observe(this);
    }
    document.fonts?.ready?.then(() => this._fitPill());
    // Back on the page after leaving it: rendered again in its default state.
    this._update();
    clearInterval(this._tick);
    this._tick = setInterval(() => {
      if (this._hass) this.hass = this._hass;
    }, 30000);
  }

  disconnectedCallback() {
    clearInterval(this._tick);
    this._tick = null;
    this._outside?.off();
    this._resize?.disconnect();
    this._fitWidth = null;
    window.removeEventListener("keydown", this._onKey);
    this._pressing = false;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // Left (another dashboard view, a conditional card hidden): back to the defaults, so that the card does not come
    // back unfolded or with its popup open.
    this._toggled = new Map();
    this._popup = null;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._lastDeps = null;
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _locale() {
    return intlLocale(this._hass, this._config);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  _update() {
    if (!this._hass || !this._config) return;
    // A press in progress: drawn once released (see _onPressStart).
    if (this._pressing) {
      this._dirty = true;
      return;
    }
    this.toggleAttribute?.("dark", !!this._hass.themes?.darkMode);
    let html = this._render();
    if (this._popup) {
      const popup = this._popupHtml();
      if (popup) html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${popup}</ha-card>`);
      else this._popup = null;
    }
    if (html === this._html) return;
    const kept = this._popup || this._byPointer ? null : this._focusedSpot();
    this._html = html;
    this.shadowRoot.innerHTML = html;
    this._fitPill();
    if (kept) this._restoreFocus(kept);
    if (this._popup) this.shadowRoot.querySelector('.modal [data-action="popup_close"]')?.focus?.({ preventScroll: true });
  }

  // The status pill goes right after the title only when the whole title and the whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.below, the subtitle kept to one line, its whole text in its tooltip).
  // When the label does not fit that line either, or the banner has no room for the lines above its ground strip, the
  // pill keeps its dot only (.dot-only, back beside the title when the dot fits there). Measured after render, so that
  // it holds in every language.
  _fitPill() {
    const root = this.shadowRoot;
    if (!root?.querySelectorAll || typeof getComputedStyle !== "function") return;
    for (const t of root.querySelectorAll(".titles")) {
      const chip = t.querySelector(".trow > .chip");
      t.classList.remove("below", "dot-only");
      if (!chip?.getClientRects().length) continue;
      const row = chip.parentElement;
      const name = row.querySelector(".name");
      const fits = () => {
        let title = 0;
        if (name && getComputedStyle(name).display !== "none") {
          const range = document.createRange();
          range.selectNodeContents(name);
          const cs = getComputedStyle(name);
          title = Math.max(name.scrollWidth, range.getBoundingClientRect().width) + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0) +
            (parseFloat(getComputedStyle(row).columnGap) || 0);
        }
        return title + chip.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5;
      };
      if (fits()) continue;
      t.classList.add("below");
      for (const sub of t.querySelectorAll(".sub, .status")) sub.title = sub.scrollWidth > sub.clientWidth ? sub.textContent.trim() : "";
      const text = chip.querySelector(".chip-text");
      const banner = t.closest(".banner");
      const tb = t.getBoundingClientRect();
      const bb = banner?.getBoundingClientRect();
      const ground = banner ? parseFloat(getComputedStyle(banner).getPropertyValue("--g")) || 0 : 0;
      const tall = !!bb && (tb.top < bb.top - 0.5 || tb.bottom > bb.bottom - ground + 0.5);
      if (!tall && !(text && text.scrollWidth > text.clientWidth + 0.5)) continue;
      t.classList.add("dot-only");
      t.classList.remove("below");
      if (!fits()) t.classList.add("below");
    }
  }

  // The focused element, as what finds it again in the next render (its tag, data attributes and rank).
  _focusedSpot() {
    const el = this.shadowRoot.activeElement;
    if (!el?.dataset) return null;
    const key = focusKey(el);
    if (!key) return null;
    const index = this._focusables(key).indexOf(el);
    return index < 0 ? null : { key, index };
  }

  _focusables(key) {
    return [...this.shadowRoot.querySelectorAll(FOCUS_SELECTOR)].filter((n) => focusKey(n) === key);
  }

  _restoreFocus({ key, index }) {
    this._focusables(key)[index]?.focus?.({ preventScroll: true });
  }

  _onClick(ev) {
    // The click ends the press: what it changes is drawn at once.
    this._pressing = false;
    if (ev.detail === 0) this._byPointer = false;
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._popup && now() - (this._popupClosedAt ?? 0) < CLOSE_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    // Popup open: only its Close button, its links (the attachments, signed first) and the backdrop itself act.
    if (this._popup) {
      if (path.some((n) => n.tagName === "A")) return;
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "file") return this._openFile(el.dataset.path);
      if (action === "popup_close" || (action === "popup_backdrop" && path[0] === el)) this._closePopup();
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const d = el.dataset;
    switch (d.action) {
      case "zoom":
        return this._toggleZoom(ev);
      case "student":
        this._student = d.id;
        return this._update();
      case "tab":
        this._tab = d.tab;
        if (this._setZoom && !this._zoomed) return this._setZoom(true);
        return this._update();
      case "day":
        this._day = d.day;
        return this._update();
      case "period":
        this._period = d.period;
        return this._update();
      case "toggle_section":
        this._toggled = new Map(this._toggled).set(d.section, !this._isCollapsed(d.section));
        return this._update();
      case "homework":
        return this._openPopup({ entity: d.entity, index: Number(d.index) });
      case "news":
        return this._openPopup({ news: Number(d.index) });
      default:
        if (d.entity) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: d.entity }, bubbles: true, composed: true }));
    }
  }

  _openPopup(popup) {
    this._popup = popup;
    window.addEventListener("keydown", this._onKey);
    this._update();
  }

  // An attachment of a school news: served by the Skolengo integration behind Home Assistant's login, so its path is
  // signed for a short while before it opens in a new tab.
  async _openFile(path) {
    if (!/^\/api\/skolengo\//.test(String(path || ""))) return;
    // The tab is opened during the click (later, Safari blocks it), without `noopener` (window.open then returns
    // null): the opener link is cut by hand before the signed address is loaded in it.
    const win = window.open("", "_blank");
    // The file opens in that tab later: cut its link back to this page (reverse tabnabbing).
    if (win) win.opener = null;
    if (win) win.opener = null;
    try {
      const { path: signed } = await this._hass.callWS({ type: "auth/sign_path", path, expires: 60 });
      if (win) win.location.href = signed;
      else window.open(signed, "_blank", "noopener");
    } catch (_err) {
      win?.close();
    }
  }

  _closePopup() {
    this._popup = null;
    this._popupClosedAt = now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
  }

  _toggleZoom() {}

  // ── Data of the student shown ──
  // The students of the card, the one shown and its days, or the error card.
  _context() {
    const found = findStudents(this._hass, this._config);
    if (found.error) return { error: this._errorCard(found.error, found.ref) };
    const s = this._current(found.students);
    return { students: found.students, s, days: this._days(s) };
  }

  _current(students) {
    return students.find((s) => s.id === this._student) || students[0];
  }

  // Today's lessons, and the next school day's (Skolengo's "next day" sensor, else tomorrow's).
  _days(s) {
    const e = s.entities;
    const today = todayKey();
    const tz = zoneOf(this._hass);
    const todays = lessonsOf(this._s(e.lessons_today), tz).filter((l) => !l.day || l.day === today);
    const next = lessonsOf(this._s(e.lessons_next_day), tz);
    const nextKey = next[0]?.day || addDays(today, 1);
    return { today, todays, nextKey, next: nextKey === today ? [] : next };
  }

  // The day the timetable opens on: today while a lesson is still to come or going on, else the next school day.
  _autoDay(days) {
    const t0 = now();
    return days.todays.some((l) => !l.canceled && Date.parse(l.end_at) > t0) ? "today" : "next";
  }

  // The lesson going on or the next one (not canceled), today or else on the next school day, with the changes of
  // that day still to come.
  _nextLesson(s, days) {
    const t0 = now();
    const upcoming = (ls) => ls.filter((l) => Date.parse(l.end_at) > t0);
    let day = "today";
    let rest = upcoming(days.todays);
    if (!rest.some((l) => !l.canceled)) {
      day = "next";
      rest = days.next;
    }
    const lesson = rest.find((l) => !l.canceled);
    const changes = rest.filter((l) => l !== lesson && l.canceled);
    const entity = day === "today" ? s.entities.lessons_today : s.entities.lessons_next_day;
    return { day, lesson, changes, entity };
  }

  // What the picture shows (see sceneSvg).
  _sceneState(s, days, next) {
    if (next.lesson && lessonState(next.lesson, now()).running) return "class";
    if (next.changes.some((l) => l.canceled)) return "canceled";
    const hw = this._homework(s).filter((h) => keyOf(h.date) === days.nextKey);
    if (hw.some((h) => !h.done)) return "homework";
    if (hw.length) return "done";
    return "idle";
  }

  // Picture, current or next lesson, the changes of that day still to come and the homework for the next school day.
  _hero(s, days) {
    const locale = this._locale();
    const tr = (k) => this._t(k);
    const next = this._nextLesson(s, days);
    const l = next.lesson;
    const lines = [];
    if (l) {
      const st = lessonState(l, now());
      const start = l.start_time || timeOf(l.start_at);
      const end = l.end_time || timeOf(l.end_at);
      const when = st.running
        ? this._t("now_until", { end })
        : next.day === "next"
          ? `${dayLabel(tr, locale, days.nextKey)} · ${start} – ${end}`
          : this._t("next_at", { start, end });
      const room = this._config.show_room !== false ? l.classroom || "" : "";
      lines.push(`<div class="line${st.running ? " accent" : ""}">${svgIcon("clock")}<span>${esc(when)}</span></div>`);
      if (room) lines.push(`<div class="line">${svgIcon("room")}<span>${esc(room)}</span></div>`);
    }
    for (const c of next.changes.slice(0, 2))
      lines.push(`<div class="alert-line crit">${svgIcon("cancel")}<span>${esc(`${c.start_time} ${c.lesson || "—"} — ${this._t("canceled")}`)}</span></div>`);
    if (s.entities.homework) {
      const hw = this._homework(s).filter((h) => keyOf(h.date) === days.nextKey);
      const left = hw.filter((h) => !h.done).length;
      const text = !hw.length
        ? this._t("no_homework_for", { day: dayLabel(tr, locale, days.nextKey) })
        : left
          ? this._t("homework_left", { n: left, day: dayLabel(tr, locale, days.nextKey) })
          : this._t("homework_done", { day: dayLabel(tr, locale, days.nextKey) });
      lines.push(`<div class="line clickable" role="button" tabindex="0" data-action="tab" data-tab="homework">${svgIcon(left ? "homework" : "check")}<span>${esc(text)}</span></div>`);
    }
    const state = this._sceneState(s, days, next);
    const picture =
      this._config.show_picture !== false
        ? `<div class="picture clickable" role="button" tabindex="0" aria-label="${esc(this._t(`scene_${state}`))}" data-entity="${esc(next.entity || s.entities.homework || "")}">${sceneSvg(state)}</div>`
        : "";
    const subject = l ? l.lesson || "—" : this._t("no_more_lessons");
    return `<div class="hero">${picture}<div class="info"><div class="big">${esc(subject)}</div>${lines.join("")}</div></div>`;
  }

  // The evaluations with a numeric mark (latest first), and the school news (newest first).
  _marks(s, items) {
    return (items ?? list(this._s(s.entities.grades), "evaluations")).filter((x) => x && typeof x === "object" && parseNum(x.mark) !== null);
  }

  _news(s) {
    return list(this._s(s.entities.information), "news").filter((n) => n && typeof n === "object");
  }

  _homework(s) {
    return homeworkOf(this._s(s.entities.homework), zoneOf(this._hass));
  }

  _iconState(days) {
    const ls = [...days.todays, ...days.next];
    return ls.some((l) => l.canceled) ? "crit" : "";
  }

  // Status pill on the title row, in the colour of the header icon (`icon`, see _iconState / _bannerState): the
  // canceled lesson that makes it red, otherwise the homework still to do.
  _chip(s, days, icon) {
    const st = this._s(s.entities.homework);
    if (!st) return "";
    if (!valid(st)) return this._chipHtml("idle", this._t("unavailable"), st.entity_id);
    if (icon === "crit") return this._chipHtml("crit", this._t("canceled"), st.entity_id);
    const todo = this._homework(s).filter((h) => !h.done).length;
    // The panel (no header icon): active while homework is left, ok once all is done.
    const cls = days ? icon || "accent" : todo ? "active" : "ok";
    return this._chipHtml(cls, todo ? this._t("to_do", { n: todo }) : this._t("all_done"), st.entity_id);
  }

  _chipHtml(cls, text, entity) {
    return `<span class="chip clickable ${cls}" role="button" tabindex="0" data-entity="${esc(entity)}" title="${esc(text)}" aria-label="${esc(text)}"><span class="dot"></span><span class="chip-text">${esc(text)}</span></span>`;
  }

  _subtitle(s) {
    const cls = this._s(s.entities.class);
    if (!valid(cls)) return "";
    return [cls.state, cls.attributes?.school].filter(Boolean).join(" · ");
  }

  // What the banner shows (see deskSvg), its status line, the entity that line opens and the icon's state colour.
  _bannerState(s, days) {
    const e = s.entities;
    const locale = this._locale();
    const tr = (k) => this._t(k);
    const day = dayLabel(tr, locale, days.nextKey);
    const hw = this._homework(s).filter((h) => keyOf(h.date) === days.nextKey);
    const left = hw.filter((h) => !h.done).length;
    const alert = this._iconState(days);
    const next = this._nextLesson(s, days);
    const running = !!(next.lesson && lessonState(next.lesson, now()).running);
    const pick = (scene, text, entity, calm) => ({ scene, text, entity, icon: alert || (running ? "" : calm) });
    if (left) return { ...pick("homework", this._t("homework_left", { n: left, day }), e.homework, ""), count: left };
    // A grade of the last three days (Skolengo dates a grade by its test, published a few days later at most).
    // A grade of the last three days (Skolengo dates a grade by its test, published a few days later at most).
    const tz = zoneOf(this._hass);
    const g = this._marks(s).find((x) => zoned(x.date, tz).day >= addDays(days.today, -2));
    if (g) {
      const value = fmtNum(g.mark, locale);
      const text = this._t("new_grade", { grade: `${value}/${fmtNum(parseNum(g.scale) ?? 20, locale)}` });
      return { ...pick("grade", text, e.grades, ""), stamp: value.slice(0, 4) };
    }
    // School news of the last three days.
    const fresh = this._news(s).filter((n) => zoned(n.date, tz).day >= addDays(days.today, -2)).length;
    if (fresh) return { ...pick("message", this._t("news_new", { n: fresh }), e.information, ""), count: fresh };
    if (hw.length) return pick("done", this._t("homework_done", { day }), e.homework, "ok");
    return pick("none", e.homework ? this._t("no_homework_for", { day }) : "", e.homework, "idle");
  }

  _header(s, students, days) {
    const c = this._config;
    // The title is the student shown (the one of the selected tab when the card shows several).
    const title = (students.length === 1 && c.title) || studentName(this._hass, s);
    const sub = this._subtitle(s);
    if (c.illustration !== false) return this._banner(s, days, title, sub);
    const state = this._iconState(days);
    return `
      <div class="header">
        <div class="type-icon${state ? ` ${state}` : ""}">${svgIcon("school")}</div>
        <div class="titles">
          <div class="trow"><div class="name">${esc(title)}</div>${this._chip(s, days, state)}</div>
          ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
        </div>
        ${this._zoomButton()}
      </div>`;
  }

  // The illustrated header: the icon and the texts on the wall, the desk at the right, the parquet under it all.
  _banner(s, days, title, sub) {
    const b = this._bannerState(s, days);
    const hwState = this._s(s.entities.homework);
    const unavailable = hwState && !valid(hwState) && b.scene === "none";
    const text = unavailable ? this._t("unavailable") : b.text;
    const icon = unavailable ? "idle" : b.icon;
    const status = text
      ? b.entity
        ? `<div class="status clickable" role="button" tabindex="0" data-entity="${esc(b.entity)}" title="${esc(text)}">${esc(text)}</div>`
        : `<div class="status">${esc(text)}</div>`
      : "";
    const zoom = this._zoomButton();
    return `
      <div class="banner${isNight(this._hass, this._config) ? " night" : ""}${zoom ? " zoomable" : ""}">
        ${deskSvg(b.scene, this._uid, b.stamp, b.count)}
        <div class="htext">
          <div class="type-icon${icon ? ` ${icon}` : ""}">${svgIcon("school")}</div>
          <div class="titles">
            <div class="trow"><div class="name">${esc(title)}</div>${this._chip(s, days, icon)}</div>
            ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
            ${status}
          </div>
        </div>
        ${zoom}
      </div>`;
  }

  _bannerStyle() {
    return this._config.illustration === false ? "" : BANNER_STYLE;
  }

  _zoomButton() {
    return "";
  }

  // One text tab per student when the card shows several.
  _studentTabs(s, students) {
    if (students.length < 2) return "";
    return `<div class="tabs students" role="tablist" aria-label="${esc(this._t("students"))}">${students
      .map(
        (x) =>
          `<button class="tab" role="tab" data-action="student" data-id="${esc(x.id)}" aria-selected="${x === s}">${esc(studentName(this._hass, x))}</button>`,
      )
      .join("")}</div>`;
  }

  _errorCard(key, ref) {
    const text = key === "unknown_device" ? `${this._t(key)}: ${ref}` : this._t(key);
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(text)}</div></ha-card>`;
  }

  // ── Lessons ──
  _lesson(l, entity, { compact = false } = {}) {
    const c = this._config;
    const st = lessonState(l, now());
    const cls = st.canceled ? "canceled" : st.running ? "now" : "";
    const meta = [];
    if (c.show_room !== false && l.classroom) meta.push(`<span>${svgIcon("room")}${esc(l.classroom)}</span>`);
    const teacher = l.teacher_name;
    if (c.show_teacher !== false && teacher && !compact) meta.push(`<span class="narrow-hide">${svgIcon("teacher")}${esc(teacher)}</span>`);
    const chip = st.canceled ? this._tag("crit", this._t("canceled"), "cancel") : "";
    const subject = l.lesson || "—";
    const label = [l.start_time, subject, st.canceled ? this._t("canceled") : ""].filter(Boolean).join(", ");
    const classes = ["lesson", cls || (st.past ? "past" : "")].filter(Boolean).join(" ");
    return `<div class="${classes}" style="--sc:${colorOf(l.background_color)}" role="button" tabindex="0" data-entity="${esc(entity)}" aria-label="${esc(label)}">
        <div class="time"><span>${esc(l.start_time || timeOf(l.start_at))}</span><span class="end">${esc(l.end_time || timeOf(l.end_at))}</span>${st.running ? '<span class="pulse"></span>' : ""}</div>
        <div class="stripe"></div>
        <div class="body"><div class="subj">${esc(subject)}</div>${meta.length ? `<div class="meta">${meta.join("")}</div>` : ""}${
          st.running ? `<div class="progress" role="progressbar" aria-valuenow="${st.progress}" aria-valuemin="0" aria-valuemax="100"><div style="width:${st.progress}%"></div></div>` : ""
        }</div>
        ${chip}
      </div>`;
  }

  _tag(cls, text, icon) {
    return `<span class="chip ${cls}" title="${esc(text)}">${icon ? svgIcon(icon) : '<span class="dot"></span>'}<span class="chip-text">${esc(text)}</span></span>`;
  }

  // The lessons of a day with the lunch break between the morning and the afternoon.
  _lessonList(lessons, entity) {
    const shown = this._config.show_canceled === false ? lessons.filter((l) => !l.canceled) : lessons;
    if (!shown.length) return `<div class="empty">${esc(this._t("no_lessons"))}</div>`;
    const out = [];
    shown.forEach((l, i) => {
      if (isLunchBreak(shown[i - 1], l)) out.push(`<div class="break">${svgIcon("food")}<span>${esc(this._t("lunch_break"))}</span></div>`);
      out.push(this._lesson(l, entity));
    });
    return `<div class="lessons">${out.join("")}</div>`;
  }

  // ── Homework ──
  _hwItem(h, index, entity) {
    const status = this._t(h.done ? "done" : "not_done");
    return `<div class="hw${h.done ? " done" : ""}" style="--sc:${colorOf(h.background_color)}" role="button" tabindex="0" data-action="homework" data-entity="${esc(entity)}" data-index="${index}" aria-label="${esc(`${h.subject || "—"}, ${status}`)}">
        ${svgIcon(h.done ? "check" : "circle")}
        <div class="main"><div class="subj"><span class="sdot"></span><span>${esc(h.subject || "—")}</span></div>${
          h.short_description || h.description ? `<div class="desc">${esc(h.short_description || h.description)}</div>` : ""
        }</div>
        <span></span>
      </div>`;
  }

  _popupHtml() {
    if (this._popup.news !== undefined) return this._newsPopup(this._popup.news);
    const { entity, index } = this._popup;
    const h = homeworkOf(this._s(entity), zoneOf(this._hass))[index];
    if (!h) return "";
    const locale = this._locale();
    const due = keyOf(h.date);
    return `<div class="backdrop" data-action="popup_backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(h.subject || "—")}">
          <div class="m-title" style="--sc:${colorOf(h.background_color)}"><span class="sdot"></span><span>${esc(h.subject || "—")}</span></div>
          <div class="m-sub">${due ? `<span>${esc(this._t("due", { day: dayLabel((k) => this._t(k), locale, due) }))}</span>` : ""}${this._tag(
            h.done ? "ok" : "active",
            this._t(h.done ? "done" : "not_done"),
          )}</div>
          ${h.short_description && h.description ? `<div class="m-head">${esc(h.short_description)}</div>` : ""}
          <div class="msg">${esc(h.description || h.short_description || "")}</div>
          ${h.teacher ? `<div class="m-teacher">${svgIcon("teacher")}<span>${esc(h.teacher)}</span></div>` : ""}
          <div class="modal-actions"><button class="btn" data-action="popup_close">${svgIcon("close")}<span>${esc(this._t("close"))}</span></button></div>
        </div>
      </div>`;
  }

  // A school news: its title, date and author, its text and its attachments.
  _newsPopup(index) {
    const ctx = this._context();
    const n = ctx.error ? null : this._news(ctx.s)[index];
    if (!n) return "";
    const day = zoned(n.date, zoneOf(this._hass)).day;
    const files = (Array.isArray(n.attachments) ? n.attachments : []).filter((f) => f && typeof f.path === "string");
    const sub = [day ? dayLabel((k) => this._t(k), this._locale(), day) : "", n.author].filter(Boolean).join(" · ");
    return `<div class="backdrop" data-action="popup_backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(n.title || this._t("information"))}">
          <div class="m-title"><span class="sdot"></span><span>${esc(n.title || this._t("information"))}</span></div>
          ${sub ? `<div class="m-sub"><span>${esc(sub)}</span></div>` : ""}
          <div class="msg">${esc(n.content || n.summary || "")}</div>
          ${
            files.length
              ? `<div class="files"><div class="label"><span>${esc(this._t("files"))}</span></div>${files
                  .map((f) => `<button class="flink" data-action="file" data-path="${esc(f.path)}">${svgIcon("paperclip")}<span>${esc(f.name || this._t("files"))}</span></button>`)
                  .join("")}</div>`
              : ""
          }
          <div class="modal-actions"><button class="btn" data-action="popup_close">${svgIcon("close")}<span>${esc(this._t("close"))}</span></button></div>
        </div>
      </div>`;
  }
}
