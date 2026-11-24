// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { DEFAULT_COLLAPSED, DEFAULT_MAX_GRADES, TABS, TAB_ICONS, esc, list, valid } from "./core.js";
import { dayLabel, keyOf, shortDay, timeOf, todayKey } from "./dates.js";
import { colorOf, fmtNum, gradeClass, levelClass, parseNum, svgIcon } from "./numbers.js";
import { BASE_STYLE, DIALOG_STYLE, FULL_STYLE } from "./styles.js";
import { SCENE_STYLE } from "./picture.js";
import { SkolengoBase, zoneOf, zoned } from "./lessons.js";

export class SkolengoCard extends SkolengoBase {
  static getConfigElement() {
    return document.createElement("skolengo-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _tabs() {
    const c = this._config.tabs;
    const tabs = (Array.isArray(c) ? c : c ? [c] : TABS).filter((x) => TABS.includes(x));
    return tabs.length ? tabs : TABS;
  }

  _isCollapsed(key) {
    if (this._toggled.has(key)) return this._toggled.get(key);
    const c = this._config.collapsed ?? DEFAULT_COLLAPSED;
    return (Array.isArray(c) ? c : [c]).includes(key);
  }

  _sectionTitle(key, icon, label, count = "") {
    const closed = this._isCollapsed(key);
    return `<div class="section-title" role="button" tabindex="0" data-action="toggle_section" data-section="${key}" aria-expanded="${!closed}">${svgIcon(icon)}<span>${esc(
      label,
    )}</span>${count !== "" ? `<span class="count">· ${esc(count)}</span>` : ""}${svgIcon("chevron_down", "chevron")}</div>`;
  }

  _section(key, icon, label, body, count = "") {
    return `<div class="section">${this._sectionTitle(key, icon, label, count)}${this._isCollapsed(key) ? "" : body}</div>`;
  }

  _render() {
    const ctx = this._context();
    if (ctx.error) return ctx.error;
    const { students, s, days } = ctx;
    const tabs = this._tabs();
    const tab = tabs.includes(this._tab) ? this._tab : tabs.includes(this._config.default_tab) ? this._config.default_tab : tabs[0];
    const todo = this._homework(s).filter((h) => !h.done).length;
    const tabBar =
      tabs.length > 1
        ? `<div class="tabs sections" role="tablist" aria-label="${esc(this._t("sections"))}">${tabs
            .map(
              (x) =>
                `<button class="tab" role="tab" data-action="tab" data-tab="${x}" aria-selected="${x === tab}">${svgIcon(TAB_ICONS[x])}<span>${esc(this._t(x))}</span>${
                  x === "homework" && todo ? `<span class="badge">${todo}</span>` : ""
                }</button>`,
            )
            .join("")}</div>`
        : "";
    const body = { timetable: () => this._timetable(s, days), homework: () => this._homeworkTab(s), grades: () => this._grades(s), school_life: () => this._schoolLife(s) }[tab]();
    return `<style>${BASE_STYLE}${SCENE_STYLE}${FULL_STYLE}${DIALOG_STYLE}${this._bannerStyle()}</style>
      <ha-card>
        ${this._header(s, students, days)}
        ${this._studentTabs(s, students)}
        <div class="content hero-wrap">${this._hero(s, days)}</div>
        ${tabBar}
        <div class="content">${body}</div>
      </ha-card>`;
  }

  _timetable(s, days) {
    const e = s.entities;
    if (!e.lessons_today && !e.lessons_next_day) return `<div class="empty">${esc(this._t("no_lessons"))}</div>`;
    const locale = this._locale();
    const day = this._day === "today" || this._day === "next" ? this._day : this._autoDay(days);
    const lessons = day === "today" ? days.todays : days.next;
    const entity = day === "today" ? e.lessons_today : e.lessons_next_day;
    const tr = (k) => this._t(k);
    const real = lessons.filter((l) => !l.canceled);
    const hours = real.length ? `${real[0].start_time || timeOf(real[0].start_at)} – ${real.at(-1).end_time || timeOf(real.at(-1).end_at)}` : "";
    const btn = (key, label) =>
      `<button class="btn" data-action="day" data-day="${key}" aria-pressed="${day === key}">${esc(label)}</button>`;
    return `<div class="daybar">${btn("today", tr("today"))}${btn("next", dayLabel(tr, locale, days.nextKey))}${hours ? `<span class="hours">${esc(hours)}</span>` : ""}</div>
      ${this._lessonList(lessons, entity)}`;
  }

  _homeworkTab(s) {
    const entity = s.entities.homework;
    if (!entity) return `<div class="empty">${esc(this._t("no_homework"))}</div>`;
    const all = this._homework(s);
    const shown = all.map((h, i) => [h, i]).filter(([h]) => this._config.show_done_homework !== false || !h.done);
    const todo = all.filter((h) => !h.done).length;
    const locale = this._locale();
    const tr = (k) => this._t(k);
    const summary = `<div class="summary">${this._tag(todo ? "active" : "ok", todo ? this._t("to_do", { n: todo }) : this._t("all_done"))}${
      all.length - todo ? this._tag("ok", this._t("done_count", { n: all.length - todo })) : ""
    }</div>`;
    if (!shown.length) return `${all.length ? summary : ""}<div class="empty">${esc(this._t("no_homework"))}</div>`;
    const groups = new Map();
    for (const item of shown) {
      const k = keyOf(item[0].date);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(item);
    }
    const html = [...groups]
      .map(([k, items]) => {
        const left = items.filter(([h]) => !h.done).length;
        return `<div class="hw-day"><div class="label">${svgIcon("calendar")}<span>${esc(k ? dayLabel(tr, locale, k) : "—")}</span>${
          left ? `<span class="aside">${esc(this._t("to_do", { n: left }))}</span>` : ""
        }</div><div class="hw-list">${items.map(([h, i]) => this._hwItem(h, i, entity)).join("")}</div></div>`;
      })
      .join("");
    return `${summary}${html}`;
  }

  // The periods of the school year (terms or semesters, oldest first) and the one shown: picked with the period
  // buttons, else the current one, else the last one already started (between two terms). Without periods, the
  // whole year.
  _periods(s) {
    const src = this._s(s.entities.overall_average) || this._s(s.entities.grades);
    const periods = list(src, "periods").filter((p) => p && typeof p === "object" && p.id);
    const today = todayKey();
    const started = periods.filter((p) => !p.start_date || p.start_date <= today);
    const chosen = periods.find((p) => p.id === this._period) || periods.find((p) => p.current) || started.at(-1) || periods[0];
    return { periods, chosen };
  }

  // What the grades tab shows for the period: its evaluations, its overall average and its averages per subject.
  _gradeData(s, period) {
    const grades = this._s(s.entities.grades);
    const avg = this._s(s.entities.overall_average);
    const id = period?.id;
    // Per period when the integration gives the breakdown: a period it leaves out has no grades yet (it only lists
    // the periods with evaluations), it never falls back to the whole year's.
    const evalsBy = id ? grades?.attributes?.evaluations_by_period : undefined;
    const avgBy = id ? avg?.attributes?.average_by_period : undefined;
    const byPeriod = evalsBy && typeof evalsBy === "object" ? evalsBy[id] || {} : null;
    const avgPeriod = avgBy && typeof avgBy === "object" ? avgBy[id] || {} : null;
    const evaluations = (byPeriod ? byPeriod.evaluations : list(grades, "evaluations")) || [];
    const overall = byPeriod || avgPeriod
      ? parseNum(avgPeriod?.average ?? byPeriod?.average)
      : valid(avg)
        ? parseNum(avg.state)
        : parseNum(grades?.attributes?.average);
    const subjects = (avgPeriod ? avgPeriod.by_subject : list(avg, "by_subject")) || [];
    return {
      evaluations: Array.isArray(evaluations) ? evaluations.filter((x) => x && typeof x === "object") : [],
      overall,
      subjects: Array.isArray(subjects) ? subjects.filter((x) => x && typeof x === "object") : [],
    };
  }

  _periodBar(periods, chosen) {
    const btn = (p) => `<button class="btn" data-action="period" data-period="${esc(p.id)}" aria-pressed="${p === chosen}">${esc(p.label || p.id)}</button>`;
    return `<div class="daybar periodbar" role="group" aria-label="${esc(this._t("period"))}">${periods.map(btn).join("")}</div>`;
  }

  // `brief`: the overall average and the latest grades alone (the panel's Today tab).
  _grades(s, { brief = false } = {}) {
    const locale = this._locale();
    const c = this._config;
    const e = s.entities;
    const tz = zoneOf(this._hass);
    const parts = [];
    const { periods, chosen } = this._periods(s);
    if (!brief && c.show_periods !== false && periods.length > 1) parts.push(this._periodBar(periods, chosen));
    const data = this._gradeData(s, chosen);
    if (data.overall !== null) {
      parts.push(`<div class="overall ${gradeClass(data.overall)} clickable" role="button" tabindex="0" data-entity="${esc(e.overall_average || e.grades)}">
          <div class="big">${esc(fmtNum(data.overall, locale))}<small>/20</small></div>
          <div class="what"><b>${esc(this._t("overall_average"))}</b>${chosen?.label ? `<span>${esc(chosen.label)}</span>` : ""}</div>
        </div>`);
    }
    if (e.grades) {
      const max = Number.isFinite(Number(c.max_grades)) && Number(c.max_grades) > 0 ? Number(c.max_grades) : DEFAULT_MAX_GRADES;
      const marks = this._marks(s, data.evaluations).slice(0, max);
      const rows = marks.length
        ? `<div class="rows">${marks
            .map((g) => {
              const v = parseNum(g.mark);
              const out = parseNum(g.scale) ?? 20;
              const avg = parseNum(g.class_average);
              const coef = c.show_coefficient !== false ? parseNum(g.coefficient) : null;
              const k = zoned(g.date, tz).day;
              const t2 = [k ? shortDay(k, locale) : "", coef !== null ? this._t("coef", { v: fmtNum(coef, locale) }) : "", g.title].filter(Boolean).join(" · ");
              return `<div class="row clickable" role="button" tabindex="0" data-entity="${esc(e.grades)}" style="--sc:${colorOf(g.subject_color)}">
                  <div class="main"><div class="t1"><span class="sdot"></span><span>${esc(g.subject || "—")}</span></div>${t2 ? `<div class="t2">${esc(t2)}</div>` : ""}</div>
                  <div class="end"><span class="grade ${gradeClass(v, out)}">${esc(fmtNum(v, locale))}<small>/${esc(fmtNum(out, locale))}</small></span>${
                    c.show_class_average !== false && avg !== null ? `<small>${esc(this._t("class_avg", { v: fmtNum(avg, locale) }))}</small>` : ""
                  }</div>
                </div>`;
            })
            .join("")}</div>`
        : `<div class="empty">${esc(this._t("no_grades"))}</div>`;
      parts.push(this._section("grades", "star", this._t("latest_grades"), rows));
    }
    if (brief) return parts.join("");
    if (e.overall_average && data.subjects.length) {
      const pct = (x) => Math.max(0, Math.min(100, Math.round((x / 20) * 100)));
      const rows = `<div class="rows">${data.subjects
        .map((a) => {
          const v = parseNum(a.average);
          const cl = parseNum(a.class_average);
          return `<div class="avg clickable ${gradeClass(v)}" role="button" tabindex="0" data-entity="${esc(e.overall_average)}" style="--sc:${colorOf(a.subject_color)}">
              <div class="s"><span class="sdot row-dot" style="width:8px;height:8px;border-radius:50%;background:var(--sc);flex:none"></span><span>${esc(a.subject || "—")}</span></div>
              <div class="track">${v !== null ? `<div class="fill" style="width:${pct(v)}%"></div>` : ""}${
                c.show_class_average !== false && cl !== null ? `<div class="class" style="left:${pct(cl)}%" title="${esc(this._t("class_avg", { v: fmtNum(cl, locale) }))}"></div>` : ""
              }</div>
              <div class="v">${esc(fmtNum(v, locale))}</div>
            </div>`;
        })
        .join("")}</div>${c.show_class_average !== false ? `<div class="legend"><i></i><span>${esc(this._t("class_average"))}</span></div>` : ""}`;
      parts.push(this._section("averages", "average", this._t("averages"), rows));
    }
    // Skill-based evaluations: one chip per skill, in the colour of its mastery level.
    const skilled = data.evaluations.filter((x) => Array.isArray(x.skills) && x.skills.length);
    if (e.grades && skilled.length) {
      const initials = (level) =>
        String(level || "?")
          .split(/\s+/)
          .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
          .map((w) => w[0].toUpperCase())
          .join("")
          .slice(0, 3) || "?";
      const rows = `<div class="rows">${skilled
        .map((ev) => {
          const k = zoned(ev.date, tz).day;
          const acq = ev.skills
            .filter((a) => a && typeof a === "object")
            .map((a) => `<span class="chip ${levelClass(a)}" title="${esc([a.skill, a.level].filter(Boolean).join(" — "))}">${esc(initials(a.level))}</span>`)
            .join("");
          return `<div class="row clickable" role="button" tabindex="0" data-entity="${esc(e.grades)}">
              <div class="main"><div class="t1"><span>${esc(ev.subject || "—")}</span></div><div class="t2">${esc([ev.title, k ? shortDay(k, locale) : ""].filter(Boolean).join(" · "))}</div></div>
              <div class="acq">${acq}</div>
            </div>`;
        })
        .join("")}</div>`;
      parts.push(this._section("evaluations", "eval", this._t("evaluations"), rows));
    }
    return parts.join("") || `<div class="empty">${esc(this._t("no_grades"))}</div>`;
  }

  // `tilesOnly`: the counters alone (the panel's Today tab).
  _schoolLife(s, { tilesOnly = false } = {}) {
    const e = s.entities;
    const locale = this._locale();
    const tz = zoneOf(this._hass);
    const absences = list(this._s(e.absences), "absences").filter((a) => a && typeof a === "object");
    const delays = list(this._s(e.delays), "delays").filter((a) => a && typeof a === "object");
    const exemptions = list(this._s(e.exemptions), "exemptions").filter((a) => a && typeof a === "object");
    const obsState = this._s(e.observations);
    const observations = list(obsState, "observations").filter((o) => o && typeof o === "object");
    const negative = parseNum(obsState?.attributes?.negative) ?? observations.filter((o) => o.tone === "NEGATIVE").length;
    const punishments = list(this._s(e.punishments), "punishments").filter((p) => p && typeof p === "object");
    const news = this._news(s);
    // The school's processing of a record (Skolengo's absence file status): closed (LOCKED) or still pending.
    const pendingOf = (a) => a.status === "NEW" || a.status === "IN_PROGRESS";
    const pending = absences.filter(pendingOf).length;
    const tile = (id, icon, label, v, cls = "") =>
      id
        ? `<div class="tile clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id)}"><div class="k">${svgIcon(icon)}<span>${esc(label)}</span></div><div class="v">${esc(v)}</div></div>`
        : "";
    const parts = [
      `<div class="tiles">${[
        tile(e.absences, "absence", this._t("absences"), absences.length, pending ? "warn" : ""),
        tile(e.delays, "delay", this._t("delays"), delays.length, delays.some(pendingOf) ? "warn" : ""),
        tile(e.observations, "eye", this._t("observations"), observations.length || parseNum(obsState?.state) || 0, negative ? "warn" : ""),
        tile(e.punishments, "gavel", this._t("punishments"), punishments.length, punishments.length ? "crit" : ""),
      ].join("")}</div>`,
    ];
    if (tilesOnly) return parts[0];
    const status = (a) =>
      a.status === "LOCKED" ? this._tag("ok", this._t("status_closed")) : pendingOf(a) ? this._tag("warn", this._t("status_pending")) : "";
    const empty = `<div class="empty">${esc(this._t("nothing"))}</div>`;
    const rows = (items, fn) => (items.length ? `<div class="rows">${items.map(fn).join("")}</div>` : empty);
    const when = (iso) => {
      const z = zoned(iso, tz);
      return z.day ? `${shortDay(z.day, locale)}${z.time ? ` ${z.time}` : ""}` : "";
    };
    const span = (a) => {
      const from = zoned(a.start, tz);
      const to = zoned(a.end, tz);
      return [when(a.start), to.day && to.day !== from.day ? when(a.end) : to.time].filter(Boolean).join(" – ");
    };
    const record = (entity, withStatus) => (a) =>
      `<div class="row clickable" role="button" tabindex="0" data-entity="${esc(entity)}"><div class="main"><div class="t1"><span>${esc(span(a) || "—")}</span></div><div class="t2">${esc(
        [a.reason, a.comment].filter(Boolean).join(" · "),
      )}</div></div>${withStatus && status(a) ? `<div class="end">${status(a)}</div>` : ""}</div>`;
    if (e.absences)
      parts.push(this._section("absences", "absence", this._t("absences"), rows(absences, record(e.absences, true)), pending ? this._t("pending_count", { n: pending }) : ""));
    if (e.delays) parts.push(this._section("delays", "delay", this._t("delays"), rows(delays, record(e.delays, true))));
    if (e.exemptions && exemptions.length) parts.push(this._section("exemptions", "exempt", this._t("exemptions"), rows(exemptions, record(e.exemptions, false))));
    if (e.observations) {
      const body = rows(observations, (o) => {
        const k = zoned(o.date, tz).day;
        const tone = o.tone === "POSITIVE" ? this._tag("ok", this._t("positive")) : o.tone === "NEGATIVE" ? this._tag("warn", this._t("negative")) : "";
        return `<div class="row clickable" role="button" tabindex="0" data-entity="${esc(e.observations)}"><div class="main"><div class="t1"><span>${esc(o.reason || "—")}</span></div><div class="t2">${esc(
          [k ? shortDay(k, locale) : "", o.issuer, o.comment].filter(Boolean).join(" · "),
        )}</div></div>${tone ? `<div class="end">${tone}</div>` : ""}</div>`;
      });
      parts.push(this._section("observations", "eye", this._t("observations"), body, negative ? this._t("negative_count", { n: negative }) : ""));
    }
    if (e.punishments) {
      const body = rows(punishments, (p) => {
        const k = zoned(p.date || p.due, tz).day;
        return `<div class="row clickable" role="button" tabindex="0" data-entity="${esc(e.punishments)}"><div class="main"><div class="t1"><span>${esc(p.category || p.reason || "—")}</span></div><div class="t2">${esc(
          [k ? shortDay(k, locale) : "", p.category ? p.reason : "", p.issuer, p.assigned_work].filter(Boolean).join(" · "),
        )}</div></div></div>`;
      });
      parts.push(this._section("punishments", "gavel", this._t("punishments"), body));
    }
    if (e.information) {
      const body = rows(news.slice(0, 5), (n, i) => {
        const k = zoned(n.date, tz).day;
        return `<div class="row clickable" role="button" tabindex="0" data-action="news" data-index="${i}"><div class="main"><div class="t1"><span>${esc(n.title || "—")}</span></div><div class="t2">${esc(
          [n.author, k ? shortDay(k, locale) : ""].filter(Boolean).join(" · "),
        )}</div></div>${Array.isArray(n.attachments) && n.attachments.length ? svgIcon("paperclip", "clip") : ""}</div>`;
      });
      parts.push(this._section("information", "info", this._t("information"), body));
    }
    return parts.join("");
  }
}
