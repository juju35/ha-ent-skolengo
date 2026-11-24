# ha-ent-skolengo

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-ent-skolengo/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-ent-skolengo/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-ent-skolengo/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-ent-skolengo/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-ent-skolengo/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-ent-skolengo/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-ent-skolengo)](https://github.com/juju35/ha-ent-skolengo/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-ent-skolengo/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/brand/icon.png" alt="Skolengo Card" width="120"></p>

<p align="center"><a href="https://github.com/infernalK/ha-skolengo"><img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/images/skolengo.png" alt="Skolengo integration" height="40"></a></p>

Lovelace cards for Home Assistant showing the school life of your children from **Skolengo**, the school ENT used by many French secondary schools: today's and the next school day's **timetable** (canceled lessons stand out), **homework** (done or to do), latest **grades** and **averages** per term, **skill-based evaluations** and **school life** (absences, late arrivals, exemptions, observations, punishments, school news), for one or several students. An optional **sidebar panel** shows the same on a full page.

The cards work on top of the community [Skolengo integration](https://github.com/infernalK/ha-skolengo) by infernalK. Entities are **discovered automatically** from the Home Assistant registries: every Skolengo student is found with its sensors, you don't pick them one by one, and it works whatever your Home Assistant language or entity ids.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-ent-skolengo&category=plugin)

| Skolengo Card | Skolengo Mini Card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card.png" alt="skolengo card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card.png" alt="skolengo mini card" width="380"><br><img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-class.gif" alt="lesson in progress animation" width="380"> |

## Features

- Two cards: a full **Skolengo Card** (`custom:skolengo-card`) and a compact **Skolengo Mini Card** (`custom:skolengo-mini-card`)
- **Several students** (one integration entry per student, parent accounts included): one text tab per student, the header naming the one shown; or pick them with `device` / `devices`
- **Illustrated header** (90 px, full and mini card): a desk with the school bag and a pile of exercise books, following the student's day — homework to do (the pen writes on the sheet), a new grade of the last days (the teacher's stamp lands on the test paper), a recent school news (an envelope with its count), homework done (a green check) or no homework (books closed, pencil at rest) — over a parquet strip, in day and night versions (night with a dark Home Assistant theme; `illustration_theme` forces one). The round header icon takes the colour of the status: red when a lesson of the day is canceled, the accent while there is something to do, green when the homework is done, grey when there is none. `illustration: false` brings back the classic header with its status chip
- Animated picture of the school, following the day: lesson going on, lesson canceled, homework to do, homework done (see [Animations](#animations)); beside it the lesson going on or the next one, the canceled lessons still to come and the homework for the next school day
- **Timetable** tab: today and the next school day, the lesson going on with a pulsing dot and its progress, past lessons dimmed, **canceled lessons struck through in red**, the lunch break between the morning and the afternoon, rooms and teachers, each subject in its Skolengo colour. Times are read in Home Assistant's time zone
- **Homework** tab: grouped by due day, a check circle for the homework done and an empty one for the homework to do; a click opens its title, its full text (Skolengo's formatting turned into plain text) and its teacher in a popup at the top of the card
- **Grades** tab: overall average of the term, latest grades on their own scale with their coefficient and the class average, averages per subject with a bar and the class marker, skill-based evaluations with one chip per skill in the colour of its mastery level; **period buttons** to switch between the terms or semesters
- **School life** tab: counters (absences, late arrivals, observations, punishments), absences and late arrivals justified or not, exemptions, positive and negative observations, punishments, and the **school news** — a click opens the article with its attachments (opened through Home Assistant)
- Collapsible sections (chevron to the right when folded, down when unfolded), folded back by a click elsewhere on the page
- Mini card: next lesson, the canceled lessons of the day still to come and the homework for the next school day; the detail button (top right) switches it to the full card's content and back, a click anywhere outside the card brings the compact view back
- Click any value to open its Home Assistant history (more-info dialog)
- Visual editor in the dashboard UI for both cards (no YAML needed)
- Light and dark mode, 22 languages (see [Translations](#translations))
- Single file, no external dependency

## Supported integrations

| Integration | What the cards show |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/images/skolengo.png" alt="" width="16"> [Skolengo](https://github.com/infernalK/ha-skolengo) (custom, `skolengo`) | Everything: class and school, today's and the next school day's timetable, homework, grades and averages per term, skill-based evaluations, absences, late arrivals, exemptions, observations, punishments and school news |

The cards read these sensors, found by their `translation_key`: `student_class`, `timetable_today`, `timetable_next_day`, `homework_due`, `evaluations`, `average_grade`, `absences`, `delays`, `exemptions` (disabled by default in the integration), `observations`, `punishments` and the school's `news` sensor (one per school, on the school's own device: each student gets the news of its school). A sensor that is missing or disabled simply hides its part of the card. The grades of a term come from the `evaluations_by_period` and `average_by_period` attributes; without periods, the whole year is shown.

> [!NOTE]
> Skolengo gives no way to tick a homework from Home Assistant: the cards show it as done or to do as Skolengo reports it. The school's grade endpoints can be unreliable at some schools: the Grades tab then simply says there are no grades yet.

## Prerequisites

Home Assistant 2024.8 or later, with the [Skolengo integration](https://github.com/infernalK/ha-skolengo) configured for at least one student.

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-ent-skolengo&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-ent-skolengo` — Type: **Dashboard**
3. Open **Skolengo Card** and click **Install**
4. Check that **Settings → Dashboards → ⋮ → Resources** lists `/local/community/ha-ent-skolengo/skolengo-card.js`, then clear your browser cache and refresh

### Manual

1. Download `skolengo-card.js` and the `skolengo-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-ent-skolengo/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/skolengo-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## Configuration

### Card types

| Card | Type |
|---|---|
| Skolengo Card | `custom:skolengo-card` |
| Skolengo Mini Card | `custom:skolengo-mini-card` |

### Visual editor

Edit a dashboard, click **Add card** and search for **Skolengo Card** or **Skolengo Mini Card**. All students are shown by default; pick some of them (full card) or one (mini card) in the list, choose the tabs and their order, the default tab, the sections folded by default, what to show, and the language. The preview updates live, and options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:skolengo-card
```

```yaml
type: custom:skolengo-mini-card
```

### Full options

```yaml
type: custom:skolengo-card
devices:
  - Alex Moreau
  - Sam Moreau
tabs:
  - timetable
  - homework
  - grades
  - school_life
default_tab: timetable
illustration: true
illustration_theme: auto
show_title: true
show_subtitle: true
show_picture: true
show_room: true
show_teacher: true
show_canceled: true
show_done_homework: true
show_class_average: true
show_coefficient: true
show_periods: true
max_grades: 5
collapsed:
  - evaluations
  - information
language: fr
```

```yaml
type: custom:skolengo-mini-card
device: Alex Moreau
title: Alex
show_picture: true
show_room: true
zoom: true
language: fr
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `device` | both | All students | One student: its name (the device name without `Skolengo - `, or the name you gave the device) or its device id |
| `devices` | both | All students | Several students, in the order of their tabs (set by the visual editor of the full card) |
| `title` | both | Student name | Card title, when the card shows one student |
| `illustration` | both | `true` | Illustrated header (desk scene following the homework, grades and school information, with the status on the wall); `false` shows the classic header with the status chip |
| `illustration_theme` | both | `auto` | Day or night version of the illustration: `auto` (follows the Home Assistant theme: night with a dark theme, day with a light theme), `day` or `night` |
| `show_title` | both | `true` | Show the title in the header (e.g. `false` under a section heading of your own) |
| `show_subtitle` | both | `true` | Show the class and the school under the title |
| `show_picture` | both | `true` | Show the animated picture of the school |
| `show_room` | both | `true` | Show the rooms of the lessons |
| `show_teacher` | both | `true` | Show the teachers of the lessons |
| `show_canceled` | both | `true` | Show the canceled lessons in the timetable (they stay in the alerts beside the picture) |
| `tabs` | both | all four | Tabs shown, in this order, among `timetable`, `homework`, `grades` and `school_life` (one tab only: no tab bar) |
| `default_tab` | both | `timetable` | Tab shown when the card opens |
| `show_done_homework` | both | `true` | Show the homework already done (checked) in the Homework tab |
| `show_class_average` | both | `true` | Show the class average of each grade and the class marker on the averages |
| `show_coefficient` | both | `true` | Show the coefficient of each grade, beside its date |
| `show_periods` | both | `true` | Show the period buttons of the Grades tab (only when the school has several terms or semesters) |
| `max_grades` | both | `5` | Number of latest grades shown (the integration keeps 30 per period) |
| `collapsed` | both | `[evaluations, information]` | Sections folded by default, among `grades`, `averages`, `evaluations`, `absences`, `delays`, `exemptions`, `observations`, `punishments` and `information` (the school news) (`[]` to unfold everything). Click a section title (or Tab to it and press Enter or Space) to fold or unfold it; a click elsewhere on the page folds them back |
| `zoom` | mini | `true` | Detail button at the top right of the mini card: it shows the full card's content (with the same options, so `tabs`, `collapsed`… can be set on the mini card too, in its visual editor as well) and switches back to the compact view; a click outside the card also brings the compact view back. `false` removes the button |
| `language` | both | Auto | Force language: `fr`, `en`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

## Sidebar panel (optional)

The same bundle also holds a **Skolengo** page for the sidebar. The cards never need it: add it only if you want it. It draws its own full-page layout (it does not embed the cards): an **illustrated top bar** across the page (the cards' 90 px banner — wall, desk following the student's day, parquet strip; the night picture with a dark Home Assistant theme only, `illustration_theme: day|night` forces it) whose title is the **student shown**, with the status pill, the class and the school, the students as a segmented choice (first names) and a round **refresh** button (asks the integration for fresh data of that student), then text tabs: **Today** (the student, the lesson going on or the next one, the timetable, the homework for the next school day, the latest grades and the school life counters), **Timetable** (today and the next school day side by side), **Homework**, **Grades** and **School life** (laid out in columns). The tab is in the address (`/skolengo/homework`), and with several students the segmented choice in the bar switches the student — and the title with it (the one picked is remembered by the browser).

**Sidebar badge**: the panel's sidebar item shows the number of homework still to do (all the panel's students, the same count as the Homework tab badge), like Home Assistant's notifications count. It is drawn whenever the bundle is loaded — the panel or a dashboard with a Skolengo card; to have it from the first page you open, also load the bundle on every page:

```yaml
frontend:
  extra_module_url:
    - /local/community/ha-ent-skolengo/skolengo-card.js
```

Declare it in `configuration.yaml`, pointing at the file the Marketplace installed, then restart Home Assistant:

```yaml
panel_custom:
  - name: skolengo-panel
    sidebar_title: Skolengo
    sidebar_icon: mdi:school
    url_path: skolengo
    module_url: /local/community/ha-ent-skolengo/skolengo-card.js
    # require_admin: true   # to keep it for administrators
    config:                 # optional, the card options below
      devices: [Alex Moreau, Sam Moreau]
      default_tab: today    # today, timetable, homework, grades or school_life
      max_grades: 10        # 10 by default on the panel
```

`config` takes the options of the full card (`device`, `devices`, `title`, `show_room`, `show_teacher`, `show_canceled`, `show_done_homework`, `show_class_average`, `show_coefficient`, `show_periods`, `show_picture`, `max_grades`, `illustration_theme`, `language`), plus `default_tab`, which can also be `today`. Sections are always unfolded on the panel.

| Today | Grades (dark theme) |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/panel.png" alt="panel today" width="480"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/panel-grades-dark.png" alt="panel grades dark" width="480"> |

## Screenshots

All screenshots use made-up students, schools and teachers, with the clock set on a Tuesday at 10:20.

### Timetable

Today, with the lesson going on (pulsing dot and progress bar) and English canceled; the next school day:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card.png" alt="timetable" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-dark.png" alt="timetable dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-next-day.png" alt="next school day" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-next-day-dark.png" alt="next school day dark" width="400"> |

### Homework

Grouped by due day, done or to do; a click opens the full text and the teacher at the top of the card:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-homework.png" alt="homework" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-homework-dark.png" alt="homework dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-homework-popup.png" alt="homework details" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-homework-popup-dark.png" alt="homework details dark" width="400"> |

### Grades

Overall average of the term with the period buttons, latest grades on their own scale with their coefficient and the class average (green from 14/20, blue from 10, orange from 8, red below), averages per subject with the class marker, skill-based evaluations with their mastery levels:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-grades.png" alt="grades" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-grades-dark.png" alt="grades dark" width="400"> |

### School life

Counters, absences and late arrivals (justified or not), exemptions, observations, punishments and the school news; a news opens with its attachments:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-school-life.png" alt="school life" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-school-life-dark.png" alt="school life dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-news-popup.png" alt="school news" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/card-news-popup-dark.png" alt="school news dark" width="400"> |

### Mini card

The lesson going on or the next one, the canceled lessons still to come and the homework for the next school day; with several students, one tab each:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card.png" alt="mini card" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card-dark.png" alt="mini card dark" width="380"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card-students.png" alt="mini card with two students" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card-students-dark.png" alt="mini card with two students dark" width="380"> |

Expanded by its detail button: the full card.

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card-zoom.png" alt="mini card expanded" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/mini-card-zoom-dark.png" alt="mini card expanded, dark" width="400"> |

### Sidebar panel

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/panel.png" alt="panel today" width="480"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/panel-dark.png" alt="panel today dark" width="480"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/panel-grades.png" alt="panel grades" width="480"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/panel-grades-dark.png" alt="panel grades dark" width="480"> |

### Animations

The picture of the school follows the student's day, on both cards, and settles back to a still picture when nothing is going on. Each state plays its own animation, and every one of them honours `prefers-reduced-motion`.

A lesson is going on: the clock hand turns, the flag waves and the classroom windows glow:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-class.gif" alt="lesson in progress animation" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-class-dark.gif" alt="lesson in progress animation dark" width="380"> |

A lesson of the day still to come is canceled: a red badge pops up on the school and shakes, the windows go dark:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-canceled.gif" alt="lesson canceled animation" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-canceled-dark.gif" alt="lesson canceled animation dark" width="380"> |

The school day is over and homework is still to do for the next one: a pencil writes line after line in the open book:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-homework.gif" alt="homework to do animation" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-homework-dark.gif" alt="homework to do animation dark" width="380"> |

All the homework for the next school day is done: a green check is drawn and sparkles twinkle:

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-done.gif" alt="homework done animation" width="380"> | <img src="https://raw.githubusercontent.com/juju35/ha-ent-skolengo/main/screenshots/anim-done-dark.gif" alt="homework done animation dark" width="380"> |

## How it works

The cards read the Home Assistant entity and device registries instead of entity ids: every entity of the `skolengo` platform is matched by its `translation_key` and grouped by the device it belongs to, one device per student (`Skolengo - <name>`). Entity ids can therefore be in any language or renamed without breaking the cards. The school news sensor sits on the school's own device and is given to the students of that school (by the school name of their class sensor). The lessons, homework, grades and the rest come from the attributes of the sensors, as the integration writes them.

- **Times**: Skolengo gives instants in UTC; the cards read their day and time in Home Assistant's time zone.
- **Next school day**: the integration's `timetable_next_day` sensor (the next day with lessons, after a weekend or a holiday). The timetable opens on today while a lesson is still to come, then on the next school day.
- **Picture**: lesson going on → *class*; else a canceled lesson still to come that day → *canceled*; else homework to do for the next school day → *homework*; else all of it done → *done*; else still.
- **Justified**: an absence or a late arrival is shown as justified once the school has recorded its reason.
- **Attachments** of the school news are served by the integration behind Home Assistant's login: the card asks Home Assistant for a short-lived signed link before opening them.

## Development

```bash
npm install
npm run build        # bundles src/i18n.js + src/skolengo-card.js + src/skolengo-panel.js into dist/skolengo-card.js (+ one translation file per language)
npm run check        # builds and checks the card (run in CI)
npm test             # unit tests (node --test)
npm run screenshots  # renders the cards and the panel (and one GIF per animated state, needs ffmpeg) with mock data into screenshots/
```

The source is split into ES modules under `src/i18n/` (entry `src/i18n/index.js`), `src/skolengo-card/` (entry `src/skolengo-card/index.js`), `src/skolengo-panel/` (entry `src/skolengo-panel/index.js`); `npm run build` assembles them (`scripts/bundle.mjs`) into the single file the Marketplace serves.

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built files to the release, which is where the Marketplace installs it from. The screenshots are rendered by the **Screenshots** workflow on every pull request and committed to its branch.

### Releasing

1. Bump `version` in `package.json` (and `package-lock.json`, `npm install`)
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-ent-skolengo/blob/main/CHANGELOG.md)
3. Merge with a `feat` or `fix` title: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog sections since the previous tag as notes, and attaches `skolengo-card.js` and its translation files (other bumps: `gh workflow run release.yml`)

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски | `sr` |
| Srpski (latinica) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (European; also used for `pt-BR`) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## Credits

Built on the community [Skolengo integration](https://github.com/infernalK/ha-skolengo) by infernalK. Skolengo is a trademark of its owner; this project is not affiliated with Skolengo nor with the authors of the Skolengo integration.

## License

[MIT](https://github.com/juju35/ha-ent-skolengo/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
