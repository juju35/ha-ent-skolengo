// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { ACCENTS, VERSION } from "./core.js";
import { SkolengoCard } from "./full-card.js";
import { SkolengoMiniCard } from "./mini-card.js";
import { SkolengoCardEditor, SkolengoMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("skolengo-card", SkolengoCard);
define("skolengo-mini-card", SkolengoMiniCard);
define("skolengo-card-editor", SkolengoCardEditor);
define("skolengo-mini-card-editor", SkolengoMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "skolengo-card",
    name: "Skolengo Card",
    description: "Timetable (canceled and changed lessons highlighted), homework, grades, averages and school life of the Skolengo integration, for one or several students.",
  },
  {
    type: "skolengo-mini-card",
    name: "Skolengo Mini Card",
    description: "Next lesson and homework for the next school day of a Skolengo student.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-ent-skolengo" });
}

console.info(`%c SKOLENGO-CARD %c v${VERSION} `, `color: white; background: ${ACCENTS[0]}; font-weight: 700;`, `color: ${ACCENTS[0]}; background: white; font-weight: 700;`);
