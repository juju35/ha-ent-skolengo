// The README screenshots (PNG) and animations (GIF) rendered by scripts/screenshots.mjs.
// Every capture has a twin in the other theme ("-dark" for a light capture, "-light" for a dark one)
// that shows exactly the same state: only the theme differs (checked by test/screenshots.test.mjs).
import { canceled, homeworkDone, homeworkToDo, inClass } from "./mock-states.mjs";

// The light capture and its dark twin.
const both = (file, type, width, config = {}, extra = {}) => [
  { file, type, theme: "light", width, config, ...extra },
  { file: `${file}-dark`, type, theme: "dark", width, config, ...extra },
];

const ALEX = { device: "Alex Moreau" };

export const shots = [
  ...both("card", "skolengo-card", 460),
  ...both("card-next-day", "skolengo-card", 460, ALEX, { clicks: ['[data-action="day"][data-day="next"]'] }),
  ...both("card-homework", "skolengo-card", 460, ALEX, { clicks: ['[data-action="tab"][data-tab="homework"]'] }),
  ...both("card-homework-popup", "skolengo-card", 460, ALEX, { clicks: ['[data-action="tab"][data-tab="homework"]', '[data-action="homework"][data-index="0"]'] }),
  ...both("card-grades", "skolengo-card", 460, { ...ALEX, collapsed: [] }, { clicks: ['[data-action="tab"][data-tab="grades"]'] }),
  ...both("card-school-life", "skolengo-card", 460, { ...ALEX, collapsed: [] }, { clicks: ['[data-action="tab"][data-tab="school_life"]'] }),
  // A school news opened from the school life tab.
  ...both("card-news-popup", "skolengo-card", 460, { ...ALEX, collapsed: [] }, { clicks: ['[data-action="tab"][data-tab="school_life"]', '[data-action="news"][data-index="0"]'] }),
  ...both("mini-card", "skolengo-mini-card", 380, ALEX),
  ...both("mini-card-students", "skolengo-mini-card", 380, {}, { clicks: ['[data-action="student"][data-id="skolengo_sam"]'] }),
  // The mini card expanded by its detail button: the full card, at the full card's width.
  ...both("mini-card-zoom", "skolengo-mini-card", 460, ALEX, { clicks: ['[data-action="zoom"]'] }),
  // The optional sidebar panel (its Today and Grades tabs), within the 1000 px viewport.
  ...both("panel", "skolengo-panel", 960),
  ...both("panel-grades", "skolengo-panel", 960, ALEX, { clicks: ['[data-action="tab"][data-tab="grades"]'] }),
];

// One GIF per animated state of the picture (see sceneSvg in the bundled card source (test/source.mjs)).
export const gifs = [
  ...both("anim-class", "skolengo-mini-card", 380, ALEX, { overrides: inClass }),
  ...both("anim-canceled", "skolengo-mini-card", 380, ALEX, { overrides: canceled }),
  ...both("anim-homework", "skolengo-mini-card", 380, ALEX, { overrides: homeworkToDo }),
  ...both("anim-done", "skolengo-mini-card", 380, ALEX, { overrides: homeworkDone }),
];
