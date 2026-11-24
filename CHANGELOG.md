# Changelog

## 1.0.0 - 2026-11-24

### Features
- First release: Skolengo Card (`custom:skolengo-card`) and Skolengo Mini Card (`custom:skolengo-mini-card`) for the community Skolengo integration (infernalK/ha-skolengo), with entities discovered from the registries by `translation_key`, one or several students.
- Timetable of today and of the next school day (canceled lessons struck through, lesson going on with its progress, lunch break), read in Home Assistant's time zone.
- Homework grouped by due day, done or to do, with a popup showing its text and teacher.
- Grades per term: overall average, latest grades with coefficient and class average, averages per subject with the class marker, skill-based evaluations by mastery level, period buttons.
- School life: absences and late arrivals (justified or not), exemptions, observations, punishments and the school news, whose attachments open through a signed Home Assistant link.
- Illustrated header following the student's day (homework, new grade, recent news, done), animated school picture, light and dark themes, 22 languages.
- Optional sidebar panel (`panel_custom`): Today, Timetable, Homework, Grades and School life tabs, illustrated top bar folding on scroll, student choice remembered, refresh button and a sidebar badge with the homework still to do.
