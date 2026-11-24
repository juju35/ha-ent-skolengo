// Rendering of the full and mini cards from the mock Skolengo states (clock frozen on Tuesday 17 November 2026, 10:20).
import assert from "node:assert/strict";
import { test } from "node:test";
import { canceled, config, devices, entities, homeworkDone, homeworkToDo, quiet, states } from "../scripts/mock-states.mjs";
import { load } from "./load.mjs";

const pc = load();

const makeHass = (overrides = {}, extra = {}) => ({ entities, devices, config, states: { ...states, ...overrides }, language: "en", callService() {}, ...extra });

const render = (Card, config = {}, hass = makeHass()) => {
  const card = new Card();
  card.setConfig(config);
  card.hass = hass;
  return card;
};
const html = (card) => card.shadowRoot.innerHTML;
// Values of the sandbox (another realm) compared as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));
// A click on an element of the card, as the shadow root receives it.
const click = (card, dataset) => {
  const el = { dataset };
  let stopped = 0;
  card.shadowRoot.listeners.click({ composedPath: () => [el], stopPropagation: () => stopped++ });
  return stopped;
};

test("every Skolengo device is a student, its entities found by translation_key", () => {
  const students = pc.resolve(makeHass());
  assert.deepEqual(plain(students.map((s) => s.id)), ["skolengo_alex", "skolengo_sam"], "the school's own device is not a student");
  const e = students[0].entities;
  assert.equal(e.lessons_today, "sensor.skolengo_alex_moreau_emploi_du_temps_aujourd_hui");
  assert.equal(e.lessons_next_day, "sensor.skolengo_alex_moreau_emploi_du_temps_jour_suivant");
  assert.equal(e.homework, "sensor.skolengo_alex_moreau_devoirs_a_faire");
  assert.equal(e.grades, "sensor.skolengo_alex_moreau_notes");
  assert.equal(e.overall_average, "sensor.skolengo_alex_moreau_moyenne_generale");
  assert.equal(e.reauth, "binary_sensor.skolengo_alex_moreau_reconnexion_requise");
  assert.equal(e.information, "sensor.skolengo_college_des_tilleuls_news", "the news of the student's school");
  assert.equal(students[1].entities.information, "sensor.skolengo_college_des_tilleuls_news");
  assert.equal(pc.studentName(makeHass(), students[1]), "Sam Moreau");
  assert.equal(pc.roleOf({ entity_id: "sensor.x", translation_key: "next_alarm" }), undefined, "the sensors the cards do not read are left out");
  assert.equal(pc.roleOf({ entity_id: "sensor.skolengo_x_notes", translation_key: null }), undefined);
});

test("Skolengo instants are read in Home Assistant's time zone; homework HTML becomes text", () => {
  assert.deepEqual(plain(pc.zoned("2026-11-17T07:00:00Z", "Europe/Paris")), { day: "2026-11-17", time: "08:00" });
  assert.deepEqual(plain(pc.zoned("2026-11-17T23:30:00Z", "Europe/Paris")), { day: "2026-11-18", time: "00:30" }, "the local day, not the UTC one");
  assert.deepEqual(plain(pc.zoned("2026-11-17", "Europe/Paris")), { day: "2026-11-17", time: "" });
  assert.deepEqual(plain(pc.zoned(null)), { day: "", time: "" });
  const l = plain(pc.normLesson({ subject: "Maths", start: "2026-11-17T12:30:00Z", end: "2026-11-17T13:30:00Z", location: "B1", teachers: ["Mr A", "Ms B"] }, "Europe/Paris"));
  assert.equal(l.start_time, "13:30");
  assert.equal(l.teacher_name, "Mr A, Ms B");
  assert.equal(l.is_afternoon, true);
  assert.equal(pc.htmlText("<p>Read <b>p. 12</b>&nbsp;&amp; 13</p><ul><li>Ex 1</li><li>Ex 2</li></ul>"), "Read p. 12 & 13\n• Ex 1\n• Ex 2");
  assert.equal(pc.htmlText(null), "");
});

test("device and devices pick the students, by name or device id", () => {
  const hass = makeHass();
  assert.deepEqual(plain(pc.findStudents(hass, { device: "Sam Moreau" }).students.map((s) => s.id)), ["skolengo_sam"]);
  assert.deepEqual(plain(pc.findStudents(hass, { devices: ["skolengo_sam", "Skolengo - Alex Moreau"] }).students.map((s) => s.id)), ["skolengo_sam", "skolengo_alex"]);
  assert.equal(pc.findStudents(hass, { device: "Nobody" }).error, "unknown_device");
  assert.equal(pc.findStudents({ entities: {}, devices: {}, states: {} }, {}).error, "no_student");
});

test("the card without a Skolengo student says so", () => {
  const card = render(pc.SkolengoCard, {}, { entities: {}, devices: {}, states: {}, language: "en" });
  assert.match(html(card), /No Skolengo student found/);
  const unknown = render(pc.SkolengoCard, { device: "Nobody" });
  assert.match(html(unknown), /Student not found: Nobody/);
});

test("several students get one tab each, the header naming the one shown", () => {
  const card = render(pc.SkolengoCard);
  assert.match(html(card), /data-action="student" data-id="skolengo_alex" aria-selected="true">Alex Moreau/);
  assert.match(html(card), /<div class="name">Alex Moreau<\/div>/);
  assert.match(html(card), /4e B · Collège des Tilleuls/);
  click(card, { action: "student", id: "skolengo_sam" });
  assert.match(html(card), /<div class="name">Sam Moreau<\/div>/);
  assert.match(html(card), /6e A · Collège des Tilleuls/);
  const single = render(pc.SkolengoCard, { device: "Alex Moreau", title: "Alex" });
  assert.doesNotMatch(html(single), /tabs students/);
  assert.match(html(single), /<div class="name">Alex<\/div>/);
});

test("today's timetable: the lesson going on and the canceled one stand out, in local time", () => {
  const out = html(render(pc.SkolengoCard, { device: "Alex Moreau" }));
  assert.match(out, /aria-pressed="true">Today/);
  assert.match(out, /<div class="lesson now"[^>]*aria-label="10:15, History-Geography"/);
  assert.match(out, /aria-valuenow="8"/, "10:20 in a 10:15-11:15 lesson");
  assert.match(out, /<div class="lesson canceled"[^>]*aria-label="11:15, English, Canceled"/);
  assert.match(out, /<div class="lesson past"[^>]*aria-label="08:00, Mathematics"/);
  assert.match(out, /Ms Faure/);
  assert.match(out, /Lunch break/);
  assert.match(out, /08:00 – 16:30/);
  // The header icon turns red: a lesson of the day is canceled.
  assert.match(out, /<div class="type-icon crit">/);
});

test("the next school day, and show_canceled: false", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", show_canceled: false, show_teacher: false });
  assert.doesNotMatch(html(card), /aria-label="11:15, English/);
  assert.doesNotMatch(html(card), /Mr Garnier/);
  click(card, { action: "day", day: "next" });
  assert.match(html(card), /aria-pressed="true">Tomorrow/);
  assert.match(html(card), /Life and Earth Sciences/);
});

test("once the day is over, the timetable opens on the next school day", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau" }, makeHass(homeworkToDo));
  assert.match(html(card), /aria-pressed="true">Tomorrow/);
});

test("homework: grouped by day, done or to do, with the details in a popup at the top of the card", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "homework" });
  const out = html(card);
  assert.match(out, /3 to do/);
  assert.match(out, /2 done/);
  assert.match(out, /Tomorrow/);
  assert.match(out, /Thursday, 19 November|Thursday 19 November|Thursday, November 19/);
  assert.match(out, /<div class="hw done"[^>]*aria-label="Technology, Done"/);
  assert.match(out, /<div class="hw"[^>]*aria-label="Mathematics, To do"/);
  assert.match(out, /Linear equations/, "the homework's title");
  click(card, { action: "homework", entity: "sensor.skolengo_alex_moreau_devoirs_a_faire", index: "0" });
  assert.match(html(card), /<ha-card class="dialog-open">/);
  assert.match(html(card), /role="dialog"[^>]*aria-label="Mathematics"/);
  assert.match(html(card), /Revise chapter 4 for the test\.\n• Exercises 12 to 15 page 86/);
  assert.match(html(card), /class="m-teacher"[\s\S]*Mr Garnier/);
  click(card, { action: "popup_close" });
  assert.doesNotMatch(html(card), /<ha-card class="dialog-open">/);
  const hidden = html(render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "homework", show_done_homework: false }));
  assert.doesNotMatch(hidden, /Technology/);
});

test("grades: overall average, latest grades out of their scale, averages with the class marker, skill evaluations", () => {
  const out = html(render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "grades", collapsed: [], max_grades: 3 }));
  assert.match(out, /13\.21<small>\/20/);
  assert.match(out, /<span>Term 1<\/span>/);
  assert.match(out, /grade ok">16\.5<small>\/20/);
  assert.match(out, /Nov 16 · Coef\. 1 · Fractions quiz/);
  assert.match(out, /grade crit">7\.5|grade warn">9\.5/);
  assert.doesNotMatch(out, /Oral presentation/, "max_grades: 3");
  assert.match(out, /Class 12\.4/);
  assert.match(out, /class="avg clickable warn"[\s\S]*?Physics-Chemistry/);
  assert.match(out, /class="class" style="left:61%"/, "class average 12.1/20");
  assert.match(out, /chip ok"[^>]*title="Observe — Very good mastery">VGM/);
  assert.match(out, /chip warn"[^>]*title="Reason — Fragile mastery">FM/);
  assert.match(out, /chip crit"[^>]*title="Build — Insufficient mastery">IM/);
  const hidden = html(render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "grades", collapsed: [], show_coefficient: false, show_class_average: false }));
  assert.doesNotMatch(hidden, /Coef\./);
  assert.doesNotMatch(hidden, /Class 12\.4|class="class"/);
  const fr = html(render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "grades", collapsed: [], language: "fr" }));
  assert.match(fr, /13,21<small>\/20/);
});

test("period buttons switch the grades tab to another period; show_periods: false removes them", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "grades", collapsed: [] });
  let out = html(card);
  assert.match(out, /class="daybar periodbar" role="group" aria-label="Period"/);
  assert.match(out, /data-period="t1" aria-pressed="true">Term 1<\/button><button class="btn" data-action="period" data-period="t2" aria-pressed="false">Term 2</);
  click(card, { action: "period", period: "t2" });
  out = html(card);
  assert.match(out, /data-period="t2" aria-pressed="true"/);
  assert.doesNotMatch(out, /13\.21<small>/, "no average yet for Term 2");
  assert.match(out, /No grades yet/);
  click(card, { action: "period", period: "t1" });
  assert.match(html(card), /Fractions quiz/);
  const off = html(render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "grades", show_periods: false }));
  assert.doesNotMatch(off, /class="daybar periodbar"/);
  const sam = html(render(pc.SkolengoCard, { device: "Sam Moreau", default_tab: "grades" }));
  assert.doesNotMatch(sam, /class="daybar periodbar"/, "no periods");
  assert.match(sam, /15<small>\/20/);
});

test("school life: counters and folding sections, folded back by a click elsewhere", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "school_life" });
  let out = html(card);
  assert.match(out, /Late arrivals/);
  assert.match(out, /Illness · Medical certificate given/);
  assert.match(out, /1 unjustified/);
  assert.match(out, /Sprained ankle/, "exemptions");
  assert.match(out, /Very good participation[\s\S]*?Positive/);
  assert.match(out, /Forgotten equipment[\s\S]*?Negative/);
  assert.match(out, /1 negative/);
  assert.match(out, /data-section="information" aria-expanded="false"/, "folded by default");
  assert.doesNotMatch(out, /Parent-teacher meetings/);
  click(card, { action: "toggle_section", section: "information" });
  out = html(card);
  assert.match(out, /data-section="information" aria-expanded="true"/);
  assert.match(out, /Parent-teacher meetings/);
  assert.match(out, /data-action="news" data-index="0"/);
  const sam = html(render(pc.SkolengoCard, { device: "Sam Moreau", default_tab: "school_life" }));
  assert.doesNotMatch(sam, /Observations|Exemptions/, "sensors the student does not have");
});

test("a school news opens in a popup, its attachments signed by Home Assistant before opening", async () => {
  const calls = [];
  const opened = [];
  const hass = makeHass({}, { callWS: async (msg) => {
      calls.push(msg);
      return { path: `${msg.path}?authSig=x` };
    }, });
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "school_life", collapsed: [] }, hass);
  click(card, { action: "news", index: "0" });
  const out = html(card);
  assert.match(out, /role="dialog"[^>]*aria-label="Winter concert rehearsals"/);
  assert.match(out, /Ms Renaud/);
  assert.match(out, /Parents are welcome at the concert/);
  assert.match(out, /data-action="file" data-path="\/api\/skolengo\/news_file\/entry_alex\/f1"[\s\S]*concert-programme\.pdf/);
  pc.window.open = (url) => {
    opened.push(url);
    return null;
  };
  await card._openFile("/api/skolengo/news_file/entry_alex/f1");
  assert.deepEqual(plain(calls), [{ type: "auth/sign_path", path: "/api/skolengo/news_file/entry_alex/f1", expires: 60 }]);
  assert.deepEqual(opened.slice(-1), ["/api/skolengo/news_file/entry_alex/f1?authSig=x"]);
  await card._openFile("https://evil.example/x");
  assert.equal(calls.length, 1, "only the integration's own files");
});

test("folding: a tap elsewhere (pointer), not a drag that ends outside; leaving the page folds back too", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "school_life" });
  card.connectedCallback();
  const open = () => /data-section="information" aria-expanded="true"/.test(html(card));
  click(card, { action: "toggle_section", section: "information" });
  assert.ok(open());
  // Pressed in the card and released outside of it (a slider dragged out): nothing folds.
  card._outside.tap({ composedPath: () => [card] });
  assert.ok(open());
  // A tap on a spot that sends no click (iOS): the pointer alone folds it.
  card._outside.tap({ composedPath: () => [] });
  assert.ok(!open());
  // Left unfolded and back on the page: folded.
  click(card, { action: "toggle_section", section: "information" });
  card.disconnectedCallback();
  card.connectedCallback();
  assert.ok(!open());
  card.disconnectedCallback();
  // The mini card goes back to its compact view, on a tap elsewhere and when it leaves the page.
  const mini = render(pc.SkolengoMiniCard, { device: "Alex Moreau" });
  mini.connectedCallback();
  click(mini, { action: "zoom" });
  mini._unzoom.tap({ composedPath: () => [] });
  assert.doesNotMatch(html(mini), /tabs sections/);
  click(mini, { action: "zoom" });
  mini.disconnectedCallback();
  mini.connectedCallback();
  assert.doesNotMatch(html(mini), /tabs sections/);
  mini.disconnectedCallback();
});

test("no rewrite under a press: drawn by the click, or once released; focus kept for the keyboard only", async () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "school_life" });
  const before = html(card);
  card.shadowRoot.listeners.pointerdown({});
  card._html = "";
  card._update();
  assert.equal(html(card), before, "no rewrite under the pointer");
  // The click renders at once.
  click(card, { action: "toggle_section", section: "information" });
  assert.match(html(card), /data-section="information" aria-expanded="true"/);
  // A press with no click: drawn once released.
  card.shadowRoot.listeners.pointerdown({});
  card._toggled = new Map();
  card._update();
  assert.match(html(card), /aria-expanded="true"/, "held");
  card._onPressEnd();
  await new Promise((r) => setTimeout(r, 5));
  assert.match(html(card), /data-section="information" aria-expanded="false"/);
  // After a pointer press, no focus put back on a rewrite; after a key, kept.
  let spots = 0;
  card._focusedSpot = () => (spots++, null);
  card._html = "";
  card._update();
  assert.equal(spots, 0, "pointer: focus not kept");
  card.shadowRoot.listeners.keydown({ key: "Tab", target: {} });
  card._html = "";
  card._update();
  assert.equal(spots, 1, "keyboard: focus kept");
});

test("tabs: the list and order of the tabs, and the default one", () => {
  const out = html(render(pc.SkolengoCard, { device: "Alex Moreau", tabs: ["grades", "homework"] }));
  assert.match(out, /data-tab="grades" aria-selected="true"[\s\S]*data-tab="homework" aria-selected="false"/);
  assert.doesNotMatch(out, /data-tab="timetable"/);
  const one = html(render(pc.SkolengoCard, { device: "Alex Moreau", tabs: ["homework"] }));
  assert.doesNotMatch(one, /tabs sections/);
});

test("the picture follows the day: class, canceled, homework, done", () => {
  const state = (overrides) => html(render(pc.SkolengoMiniCard, { device: "Alex Moreau" }, makeHass(overrides))).match(/class="scene (\w+)"/)[1];
  assert.equal(state({}), "class");
  assert.equal(state(canceled), "canceled");
  assert.equal(state(homeworkToDo), "homework");
  assert.equal(state(homeworkDone), "done");
  const none = html(render(pc.SkolengoMiniCard, { device: "Alex Moreau", show_picture: false }));
  assert.doesNotMatch(none, /class="scene/);
});

test("every animated state has its animation, the still one none", () => {
  for (const s of ["class", "canceled", "homework", "done"]) assert.match(pc.sceneSvg(s), new RegExp(`class="scene ${s}"`));
  assert.match(pc.sceneSvg("class"), /windows lit/);
  assert.match(pc.sceneSvg("homework"), /class="pencil"/);
  assert.match(pc.sceneSvg("done"), /class="check"/);
  assert.match(pc.sceneSvg("canceled"), /class="shake"/);
  assert.doesNotMatch(pc.sceneSvg("idle"), /pencil|check|shake|lit/);
});

test("mini card: next lesson, upcoming changes, homework of the next school day", () => {
  const card = render(pc.SkolengoMiniCard, { device: "Alex Moreau" });
  const out = html(card);
  assert.match(out, /<div class="big">History-Geography<\/div>/);
  assert.match(out, /Now · until 11:15/);
  assert.match(out, /11:15 English — Canceled/);
  assert.match(out, /Homework · Tomorrow/);
  assert.match(out, /aria-label="Mathematics, To do"/);
  assert.doesNotMatch(out, /French/, "homework of another day");
  // On the canceled variant, the next lesson is the afternoon one.
  const later = html(render(pc.SkolengoMiniCard, { device: "Alex Moreau" }, makeHass(canceled)));
  assert.match(later, /<div class="big">Physics-Chemistry<\/div>/);
  assert.match(later, /Next · 13:30 – 14:30/);
});

test("mini card: the detail button switches to the full card and back", () => {
  const card = render(pc.SkolengoMiniCard, { device: "Alex Moreau" });
  assert.match(html(card), /class="zoom" data-action="zoom"/);
  click(card, { action: "zoom" });
  assert.match(html(card), /tabs sections/);
  assert.deepEqual(plain(card.getGridOptions()), { columns: 12, min_columns: 6, rows: "auto" });
  click(card, { action: "zoom" });
  assert.doesNotMatch(html(card), /tabs sections/);
  assert.doesNotMatch(html(render(pc.SkolengoMiniCard, { zoom: false })), /data-action="zoom"/);
});

test("show_title and show_subtitle hide the header texts", () => {
  const card = render(pc.SkolengoCard, { show_title: false, show_subtitle: false });
  assert.ok(card.attrs.has("hide-title") && card.attrs.has("hide-subtitle"));
});

test("dark theme switches the accent", () => {
  const card = render(pc.SkolengoCard, {}, makeHass({}, { themes: { darkMode: true } }));
  assert.ok(card.attrs.has("dark"));
});

test("a value click opens Home Assistant's more-info", () => {
  const card = render(pc.SkolengoCard, { device: "Alex Moreau" });
  click(card, { entity: "sensor.skolengo_alex_moreau_grades" });
  assert.equal(card.events.at(-1).type, "hass-more-info");
  assert.equal(card.events.at(-1).detail.entityId, "sensor.skolengo_alex_moreau_grades");
});

test("an unavailable homework sensor shows a grey chip (classic header)", () => {
  const id = "sensor.skolengo_alex_moreau_devoirs_a_faire";
  const out = html(render(pc.SkolengoCard, { device: "Alex Moreau", illustration: false }, makeHass({ [id]: { entity_id: id, state: "unavailable", attributes: {} } })));
  assert.match(out, /chip clickable idle[^>]*title="Unavailable"/);
  assert.doesNotMatch(out, /class="banner/);
});

// ── Illustrated header ──
const ALEX = { device: "Alex Moreau" };
const HW = "sensor.skolengo_alex_moreau_devoirs_a_faire";
const GRADES = "sensor.skolengo_alex_moreau_notes";
const withAttr = (id, attrs) => ({ [id]: { ...states[id], attributes: { ...states[id].attributes, ...attrs } } });
const noHomework = withAttr(HW, { assignments: [], done_assignments: [] });
const banner = (out) => out.match(/<div class="banner[\s\S]*?<\/svg>[\s\S]*?<div class="type-icon[^"]*"/)[0];

test("the illustrated header shows homework to do: the pen writes, the icon in the accent colour", () => {
  for (const Card of [pc.SkolengoCard, pc.SkolengoMiniCard]) {
    const out = html(render(Card, ALEX, makeHass(homeworkToDo)));
    assert.match(out, /<svg class="pc-desk homework"/);
    assert.match(out, /class="pen"/);
    assert.match(out, /<div class="pc-ground"/);
    assert.match(banner(out), /<div class="type-icon"$/);
    assert.match(out, /class="status clickable"[^>]*data-entity="sensor.skolengo_alex_moreau_devoirs_a_faire"[^>]*>Tomorrow: \d homework to do</);
  }
});

test("the illustrated header shows a grade of the last days stamped on the paper", () => {
  const out = html(render(pc.SkolengoCard, ALEX, makeHass(homeworkDone)));
  assert.match(out, /<svg class="pc-desk grade"/);
  assert.match(out, /class="stamp"[\s\S]*?>16\.5<\/text>/);
  assert.match(out, />New grade · 16\.5\/20</);
  assert.doesNotMatch(html(render(pc.SkolengoCard, ALEX, makeHass({ ...homeworkDone, ...quiet }))), /pc-desk grade/, "an older grade");
});

test("the illustrated header shows a recent school news, then done and no homework", () => {
  let out = html(render(pc.SkolengoCard, ALEX, makeHass({ ...homeworkDone, [GRADES]: quiet[GRADES] })));
  assert.match(out, /<svg class="pc-desk message"/);
  assert.match(out, />1 new school news</);
  out = html(render(pc.SkolengoCard, ALEX, makeHass({ ...homeworkDone, ...quiet })));
  assert.match(out, /<svg class="pc-desk done"/);
  assert.match(banner(out), /type-icon ok"$/);
  out = html(render(pc.SkolengoCard, ALEX, makeHass({ ...homeworkToDo, ...noHomework, ...quiet })));
  assert.match(out, /<svg class="pc-desk none"/);
  assert.match(banner(out), /type-icon idle"$/);
  assert.match(out, />Tomorrow: no homework</);
});

test("the header icon turns red on a canceled lesson whatever the picture", () => {
  const out = html(render(pc.SkolengoCard, ALEX, makeHass(canceled)));
  assert.match(banner(out), /type-icon crit"$/);
});

test("the illustrated header has the status pill on the title row, in the colour of the icon", () => {
  const pill = (over) => html(render(pc.SkolengoMiniCard, ALEX, makeHass(over))).match(/<div class="trow"><div class="name">[^<]*<\/div><span class="chip clickable ([a-z]+)"[^>]*title="([^"]*)"/);
  assert.deepEqual(pill(canceled).slice(1), ["crit", "Canceled"]);
  assert.deepEqual(pill(homeworkToDo).slice(1), ["accent", "3 to do"]);
  assert.deepEqual(pill({ ...homeworkDone, ...quiet }).slice(1), ["ok", "1 to do"]);
  assert.deepEqual(pill({ [HW]: { ...states[HW], state: "unavailable" } }).slice(1), ["idle", "Unavailable"]);
});

test("night: illustration_theme first, then the dark theme alone (a light theme stays day after sunset)", () => {
  const sun = (state) => ({ "sun.sun": { entity_id: "sun.sun", state, attributes: {} } });
  const night = (config, over, extra) => /class="banner night"/.test(html(render(pc.SkolengoCard, { ...ALEX, ...config }, makeHass(over, extra))));
  assert.equal(night({}, {}), false);
  assert.equal(night({}, {}, { themes: { darkMode: true } }), true);
  assert.equal(night({}, sun("below_horizon")), false, "light theme after sunset: day");
  assert.equal(night({}, sun("above_horizon"), { themes: { darkMode: true } }), true);
  assert.equal(night({}, sun("above_horizon"), { themes: { darkMode: false } }), false);
  assert.equal(night({}, sun("unavailable"), { themes: { darkMode: true } }), true);
  assert.equal(night({ illustration_theme: "day" }, sun("above_horizon"), { themes: { darkMode: true } }), false);
  assert.equal(night({ illustration_theme: "night" }, sun("above_horizon"), { themes: { darkMode: false } }), true);
  assert.equal(night({ illustration_theme: "night" }, sun("above_horizon")), true);
  assert.equal(night({ illustration_theme: "day" }, sun("below_horizon")), false);
});

test("each card has its own SVG ids", () => {
  const ids = [render(pc.SkolengoCard, ALEX), render(pc.SkolengoMiniCard, ALEX)].map((c) => html(c).match(/id="(pc-bag-\d+)"/)[1]);
  assert.notEqual(ids[0], ids[1]);
});

test("the card is translated, numbers and dates in the card's language", () => {
  const out = html(render(pc.SkolengoCard, { device: "Alex Moreau", default_tab: "grades", language: "fr" }));
  assert.match(out, /Moyenne générale/);
  assert.match(out, /13,21/);
  assert.match(out, /Emploi du temps/);
  assert.match(out, /Dernières notes|Notes/);
});

test("numbers with a comma, and grade levels", () => {
  assert.equal(pc.parseNum("13,45"), 13.45);
  assert.equal(pc.parseNum("Abs"), null);
  assert.equal(pc.gradeClass(16), "ok");
  assert.equal(pc.gradeClass(11), "active");
  assert.equal(pc.gradeClass(9), "warn");
  assert.equal(pc.gradeClass(3, 10), "crit");
  assert.equal(pc.esc('<a href="x">'), "&lt;a href=&quot;x&quot;&gt;");
});

test("acquisition levels: the negative wordings are not taken for acquired", () => {
  assert.equal(pc.levelClass({ level: "Très bonne maîtrise", abbreviation: "A+" }), "ok");
  assert.equal(pc.levelClass({ level: "Maîtrise satisfaisante", abbreviation: "A" }), "ok");
  assert.equal(pc.levelClass({ level: "Acquis" }), "ok");
  assert.equal(pc.levelClass({ level: "En cours d'acquisition" }), "warn");
  assert.equal(pc.levelClass({ level: "Maîtrise fragile", abbreviation: "C" }), "warn", "the text decides over the abbreviation");
  assert.equal(pc.levelClass({ level: "Non acquis" }), "crit");
  assert.equal(pc.levelClass({ level: "Maîtrise insuffisante" }), "crit");
  assert.equal(pc.levelClass({ abbreviation: "R" }), "crit");
  assert.equal(pc.levelClass({ level: "?" }), "idle");
});

test("the school news is the one of the student's school, else the only school's", () => {
  const hass = makeHass();
  const other = { ...hass.devices, other: { id: "other", name: "Skolengo - Lycée du Parc" } };
  const ents = { ...entities, "sensor.skolengo_lycee_du_parc_news": { entity_id: "sensor.skolengo_lycee_du_parc_news", device_id: "other", platform: "skolengo", translation_key: "news" } };
  const sts = { ...states, "sensor.skolengo_alex_moreau_classe": { ...states["sensor.skolengo_alex_moreau_classe"], attributes: { school: "Lycée du Parc" } } };
  const [alex, sam] = pc.resolve({ ...hass, devices: other, entities: ents, states: sts });
  assert.equal(alex.entities.information, "sensor.skolengo_lycee_du_parc_news");
  assert.equal(sam.entities.information, "sensor.skolengo_college_des_tilleuls_news");
});

test("the class sensor is waited for: the students are not cached while its state is missing", () => {
  const cls = "sensor.skolengo_alex_moreau_classe";
  const { [cls]: _skip, ...without } = states;
  const first = pc.resolve({ entities, devices, states: without });
  assert.equal(first[0].entities.class, cls);
  const later = { entities, devices, states };
  assert.equal(pc.resolve(later)[0].entities.information, "sensor.skolengo_college_des_tilleuls_news", "resolved again once the state is there");
});

test("both cards and their editors are registered, with a stub config and the visual editor", () => {
  assert.deepEqual(plain(pc.SkolengoCard.getStubConfig()), {});
  assert.deepEqual(plain(pc.window.customCards.map((c) => c.type)), ["skolengo-card", "skolengo-mini-card"]);
  assert.ok(pc.SkolengoCardEditor && pc.SkolengoMiniCardEditor);
});

test("mini editor: every option of the full card used by the detailed view, with labels, plus zoom", () => {
  const names = (Editor) => {
    const ed = new Editor();
    ed._hass = makeHass({}, { language: "fr" });
    ed._config = {};
    return ed._schema().flatMap((f) => (f.schema ? f.schema.map((x) => x.name) : [f.name]));
  };
  const full = names(pc.SkolengoCardEditor);
  const mini = names(pc.SkolengoMiniCardEditor);
  for (const name of full.filter((n) => n !== "devices")) assert.ok(mini.includes(name), name);
  for (const name of ["device", "zoom", "tabs", "default_tab", "max_grades", "collapsed", "show_periods"]) assert.ok(mini.includes(name), name);
  assert.ok(!mini.includes("devices"));
  for (const name of mini) assert.ok(pc.STRINGS.fr[name], name);
  assert.deepEqual(plain(pc.SkolengoMiniCardEditor.defaults), plain(pc.SkolengoCardEditor.defaults));
});
