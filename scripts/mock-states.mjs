// Mock Home Assistant registries and states shaped like the Skolengo integration (infernalK/ha-skolengo), used by the
// tests and the screenshots. Two fictional students of a fictional school; every name, teacher and text is made up.
// The screenshots freeze the clock at NOW (Tuesday 17 November 2026, 10:20 in Paris): a lesson is going on and one is
// canceled later in the morning. Skolengo gives instants in UTC: the cards read them in Home Assistant's time zone.
export const NOW = "2026-11-17T10:20:00+01:00";
export const TODAY = "2026-11-17";
export const NEXT_DAY = "2026-11-18";
export const TIME_ZONE = "Europe/Paris";
export const config = { time_zone: TIME_ZONE };

export const states = {};
export const entities = {};
export const devices = {};

const device = (id, name) => (devices[id] = { id, name: `Skolengo - ${name}`, manufacturer: "Skolengo", identifiers: [["skolengo", id]], name_by_user: null });
const entity = (entity_id, device_id, translation_key, state, attributes = {}) => {
  entities[entity_id] = { entity_id, device_id, platform: "skolengo", translation_key };
  states[entity_id] = { entity_id, state: String(state), attributes };
};

const COLORS = {
  Mathematics: "#4f8fd6",
  French: "#d36b5e",
  "History-Geography": "#e0a64a",
  English: "#7a73d0",
  "Physics-Chemistry": "#3fae8c",
  "Physical Education": "#c46a9a",
  "Life and Earth Sciences": "#5fb88f",
  Technology: "#8a96a8",
  Music: "#e58b3a",
  Spanish: "#c9a227",
  Philosophy: "#6d8fa8",
};

// Paris time (UTC+1 in November) → the UTC instant Skolengo gives.
export const utc = (day, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(...day.split("-").map((x, i) => Number(x) - (i === 1 ? 1 : 0)), h - 1, m)).toISOString().replace(".000Z", "Z");
};

let ids = 0;
const lesson = (day, start, end, subject, room, teacher, extra = {}) => ({
  id: `l${++ids}`,
  subject,
  subject_color: COLORS[subject] || "#888888",
  start: utc(day, start),
  end: utc(day, end),
  location: room,
  canceled: false,
  teachers: [teacher],
  ...extra,
});

const homework = (due, subject, title, html, done, teacher) => ({
  id: `h${++ids}`,
  subject,
  subject_color: COLORS[subject] || "#888888",
  due_date: due,
  done,
  title,
  html,
  teacher,
});

const evaluation = (date, subject, title, mark, period, extra = {}) => ({
  id: `e${++ids}`,
  subject,
  subject_color: COLORS[subject] || "#888888",
  title,
  date: `${date}T08:00:00Z`,
  mark,
  scale: 20,
  coefficient: 1,
  class_average: null,
  skills: [],
  teachers: [],
  period_id: period,
  ...extra,
});

const record = (type, start, end, reason = null, comment = null) => ({
  id: `a${++ids}`,
  type,
  start,
  end,
  status: reason ? "LOCKED" : "NEW",
  reason,
  reason_code: reason ? "MAL" : null,
  comment,
});

const fresh = { up_to_date: true, last_update: "2026-11-17T09:05:00Z" };

const PERIODS = [
  { id: "t1", label: "Term 1", start_date: "2026-09-01", end_date: "2026-11-29", current: true },
  { id: "t2", label: "Term 2", start_date: "2026-11-30", end_date: "2027-03-06", current: false },
];

// ── The school's news (one sensor per school, on the school's own device) ──
const SCHOOL = "skolengo_school";
devices[SCHOOL] = { id: SCHOOL, name: "Skolengo - Collège des Tilleuls", manufacturer: "Skolengo", identifiers: [["skolengo", SCHOOL]], name_by_user: null };
const news = [
  {
    id: "n1",
    date: "2026-11-16T15:00:00Z",
    title: "Winter concert rehearsals",
    summary: "The choir rehearses on Thursdays at lunchtime.",
    content: "The choir rehearses every Thursday at lunchtime in room C02 until the winter concert on 17 December.\nParents are welcome at the concert.",
    url: null,
    author: "Ms Renaud",
    image: null,
    attachments: [{ id: "f1", name: "concert-programme.pdf", mime_type: "application/pdf", size: 120400, path: "/api/skolengo/news_file/entry_alex/f1" }],
  },
  {
    id: "n2",
    date: "2026-11-06T11:00:00Z",
    title: "Parent-teacher meetings",
    summary: "Book a slot before 20 November.",
    content: "The parent-teacher meetings for year 8 take place on 26 November from 17:00. Book a slot before 20 November.",
    url: null,
    author: "Head teacher",
    image: null,
    attachments: [],
  },
];
entity("sensor.skolengo_college_des_tilleuls_news", SCHOOL, "news", news[0].title, { count: news.length, news, ...fresh });

// ── Alex Moreau, 4e B ──
const A = "skolengo_alex";
device(A, "Alex Moreau");
const a = (key, translationKey, state, attrs = {}) => entity(`sensor.skolengo_alex_moreau_${key}`, A, translationKey, state, { ...attrs, ...fresh });
a("classe", "student_class", "4e B", { date_of_birth: null, regime: "Half-board", school: "Collège des Tilleuls" });
const alexToday = [
  lesson(TODAY, "08:00", "09:00", "Mathematics", "B12", "Mr Garnier"),
  lesson(TODAY, "09:00", "10:00", "French", "A04", "Ms Lambert"),
  lesson(TODAY, "10:15", "11:15", "History-Geography", "B07", "Mr Roussel"),
  lesson(TODAY, "11:15", "12:15", "English", "A11", "Ms Perrin", { canceled: true }),
  lesson(TODAY, "13:30", "14:30", "Physics-Chemistry", "Lab 2", "Ms Faure"),
  lesson(TODAY, "14:30", "16:30", "Physical Education", "Gym", "Mr Caron"),
];
const alexNext = [
  lesson(NEXT_DAY, "08:00", "09:00", "Music", "C02", "Ms Renaud"),
  lesson(NEXT_DAY, "09:00", "10:00", "Technology", "C10", "Mr Picard"),
  lesson(NEXT_DAY, "10:15", "11:15", "Mathematics", "B12", "Mr Garnier"),
  lesson(NEXT_DAY, "11:15", "12:15", "Life and Earth Sciences", "Lab 1", "Ms Brunet"),
];
a("emploi_du_temps_aujourd_hui", "timetable_today", alexToday.length, { day: TODAY, lessons: alexToday });
a("emploi_du_temps_jour_suivant", "timetable_next_day", alexNext.length, { day: NEXT_DAY, lessons: alexNext });
const alexHomework = [
  homework(NEXT_DAY, "Mathematics", "Linear equations", "<p>Revise chapter 4 for the test.</p><ul><li>Exercises 12 to 15 page 86</li></ul>", false, "Mr Garnier"),
  homework(NEXT_DAY, "Technology", "Bridge model", "<p>Finish the sketch of the bridge model and bring cardboard.</p>", true, "Mr Picard"),
  homework(NEXT_DAY, "Music", "Winter song", "<p>Learn the first verse of the song.</p>", false, "Ms Renaud"),
  homework("2026-11-19", "French", "Reading", "<p>Read chapters 3 and 4 of the novel and note three questions.</p>", false, "Ms Lambert"),
  homework("2026-11-20", "English", "My favourite place", "<p>Write ten lines about your favourite place.</p>", true, "Ms Perrin"),
];
const split = (list) => ({ assignments: list.filter((h) => !h.done), done_assignments: list.filter((h) => h.done) });
a("devoirs_a_faire", "homework_due", alexHomework.filter((h) => !h.done).length, split(alexHomework));
const alexEvals = [
  evaluation("2026-11-16", "Mathematics", "Fractions quiz", 16.5, "t1", { class_average: 12.4, coefficient: 1 }),
  evaluation("2026-11-12", "French", "Dictation", 13, "t1", { class_average: 11.8, coefficient: 1 }),
  evaluation("2026-11-09", "History-Geography", "The Middle Ages", 9.5, "t1", { class_average: 11.2, coefficient: 2 }),
  evaluation("2026-11-05", "English", "Oral presentation", 17, "t1", { class_average: 13.5, coefficient: 1 }),
  evaluation("2026-10-15", "Physics-Chemistry", "States of matter", 7.5, "t1", { class_average: 10.9, coefficient: 2 }),
  evaluation("2026-11-10", "Life and Earth Sciences", "Lab report", null, "t1", {
    skills: [
      { skill: "Observe", level: "Very good mastery" },
      { skill: "Report", level: "Satisfactory mastery" },
      { skill: "Reason", level: "Fragile mastery" },
    ],
  }),
  evaluation("2026-10-20", "Technology", "Project", null, "t1", {
    skills: [
      { skill: "Design", level: "Satisfactory mastery" },
      { skill: "Build", level: "Insufficient mastery" },
    ],
  }),
];
a("notes", "evaluations", alexEvals.length, {
  evaluations: alexEvals,
  average: 13.21,
  periods: PERIODS,
  evaluations_by_period: { t1: { evaluations: alexEvals, average: 13.21 }, t2: { evaluations: [], average: null } },
});
const subjects = [
  { subject: "Mathematics", subject_color: COLORS.Mathematics, average: 15.2, class_average: 12.1 },
  { subject: "French", subject_color: COLORS.French, average: 12.8, class_average: 11.6 },
  { subject: "History-Geography", subject_color: COLORS["History-Geography"], average: 10.4, class_average: 11.3 },
  { subject: "English", subject_color: COLORS.English, average: 16.1, class_average: 13.2 },
  { subject: "Physics-Chemistry", subject_color: COLORS["Physics-Chemistry"], average: 8.6, class_average: 10.8 },
];
a("moyenne_generale", "average_grade", 13.21, {
  by_subject: subjects,
  periods: PERIODS,
  average_by_period: { t1: { average: 13.21, by_subject: subjects }, t2: { average: null, by_subject: [] } },
});
a("absences", "absences", 2, {
  absences: [
    record("ABSENCE", "2026-11-03T07:00:00Z", "2026-11-03T16:30:00Z", "Illness", "Medical certificate given"),
    record("ABSENCE", "2026-11-13T12:30:00Z", "2026-11-13T14:30:00Z"),
  ],
});
a("retards", "delays", 1, { delays: [record("LATENESS", "2026-11-10T07:00:00Z", "2026-11-10T07:12:00Z", "Bus late")] });
a("dispenses", "exemptions", 1, { exemptions: [record("EXEMPTION", "2026-11-02T07:00:00Z", "2026-11-27T16:00:00Z", "Sprained ankle", "No running")] });
a("observations", "observations", 2, {
  positive: 1,
  negative: 1,
  observations: [
    { id: "o1", date: "2026-11-12T10:00:00Z", tone: "POSITIVE", reason: "Very good participation", issuer: "Ms Lambert", comment: null },
    { id: "o2", date: "2026-11-06T14:00:00Z", tone: "NEGATIVE", reason: "Forgotten equipment", issuer: "Mr Caron", comment: "Sports kit" },
  ],
});
a("punitions", "punishments", 0, { to_realize: 0, punishments: [] });
a("prochain_cours", "next_lesson", "History-Geography", {});
entity("binary_sensor.skolengo_alex_moreau_reconnexion_requise", A, "reauth_required", "off", {});

// ── Sam Moreau, 6e A ──
const S = "skolengo_sam";
device(S, "Sam Moreau");
const s = (key, translationKey, state, attrs = {}) => entity(`sensor.skolengo_sam_moreau_${key}`, S, translationKey, state, { ...attrs, ...fresh });
s("classe", "student_class", "6e A", { school: "Collège des Tilleuls" });
const samToday = [
  lesson(TODAY, "08:00", "10:00", "Spanish", "D03", "Ms Vidal"),
  lesson(TODAY, "10:15", "12:15", "Mathematics", "D05", "Mr Lemoine"),
  lesson(TODAY, "14:00", "16:00", "French", "D02", "Ms Colin"),
];
const samNext = [lesson(NEXT_DAY, "08:00", "10:00", "History-Geography", "D08", "Mr Arnaud"), lesson(NEXT_DAY, "10:00", "12:00", "English", "D11", "Ms Royer")];
s("emploi_du_temps_aujourd_hui", "timetable_today", samToday.length, { day: TODAY, lessons: samToday });
s("emploi_du_temps_jour_suivant", "timetable_next_day", samNext.length, { day: NEXT_DAY, lessons: samNext });
const samHomework = [
  homework(NEXT_DAY, "English", "Debate", "<p>Prepare the debate arguments.</p>", true, "Ms Royer"),
  homework("2026-11-19", "French", "Poem", "<p>Learn the poem by heart.</p>", false, "Ms Colin"),
];
s("devoirs_a_faire", "homework_due", 1, split(samHomework));
s("notes", "evaluations", 1, { evaluations: [evaluation("2026-11-13", "Spanish", "Vocabulary", 15, null, { class_average: 13 })], average: 15, periods: [] });
s("moyenne_generale", "average_grade", 15, { by_subject: [{ subject: "Spanish", subject_color: COLORS.Spanish, average: 15, class_average: 13 }], periods: [] });
s("absences", "absences", 0, { absences: [] });
s("retards", "delays", 0, { delays: [] });

// ── State variants of the screenshots and GIFs ──
const at = (id, attrs) => ({ [id]: { ...states[id], attributes: { ...states[id].attributes, ...attrs } } });
export const AT = "sensor.skolengo_alex_moreau_emploi_du_temps_aujourd_hui";
export const AH = "sensor.skolengo_alex_moreau_devoirs_a_faire";
export const AN = "sensor.skolengo_alex_moreau_notes";
export const NEWS = "sensor.skolengo_college_des_tilleuls_news";
// A lesson going on (the default states): "class".
export const inClass = {};
// Between lessons, with History-Geography canceled: "canceled".
export const canceled = at(AT, { lessons: alexToday.map((l) => (l.subject === "History-Geography" ? { ...l, canceled: true } : l)) });
// School day over (yesterday's lessons): homework still to do for the next day: "homework".
const yesterday = (iso) => iso.replace(TODAY, "2026-11-16");
export const homeworkToDo = at(AT, { lessons: alexToday.map((l) => ({ ...l, canceled: false, start: yesterday(l.start), end: yesterday(l.end) })) });
// School day over, all homework for the next day done: "done".
export const homeworkDone = {
  ...homeworkToDo,
  ...at(AH, split(alexHomework.map((h) => (h.due_date === NEXT_DAY ? { ...h, done: true } : h)))),
};
// The grades of the last days and the news, older: the banner shows the homework only.
export const quiet = {
  ...at(AN, { evaluations: alexEvals.map((e) => ({ ...e, date: e.date.replace("2026-11-16", "2026-11-02") })) }),
  ...at(NEWS, { news: news.map((n) => ({ ...n, date: n.date.replace("2026-11-16", "2026-11-02") })) }),
};
