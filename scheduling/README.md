# PureTech › Scheduling

[← Back to PureTech](../README.md)

The weekly staff calendar, with a check that enough people are in each day.

There are three kinds of worker, each with its own picture and colour: **👷 Full time**, **⏰ Part time**
and **🚚 Driver**. Scheduling has two parts, chosen with the buttons under the PureTech bar.
Apart from these three pictures, the app uses plain words, no emoji.

## Calendar (for looking)

- One card per day, Monday to Sunday. Use **◀ ▶** to change week and **Today** to come back.
- Each day shows a badge per kind of worker, e.g. `🚚 1/2 ✗`: 1 driver working, 2 needed, so the
  day is short. A short day has a red border, and the red box at the top lists every short day.
- The cards show only the numbers. If anything differs from the master schedule, the card says how many
  changes there are (e.g. "1 change from the master schedule").
- **Click a day card** to open it. It then lists everyone working that day under **Working** (extra cover
  marked **+ COVER**) and that day's **Changes**: days off (greyed and crossed out, with the reason) and
  extra cover. Click it again to close it. Only one day is open at a time.
- Clicking a short day in the red box at the top opens that day.
- A day with no minimum and nobody working shows **Closed**.
- Nothing can be changed here. An open short day has a **Fix this day →** link that opens Make changes.

## Make changes (for changing)

- **Day off**: pick the day, tap the person, optionally pick why (Sick, Holiday, Other), **Save day off**.
  Before saving it shows whether the day will be short.
- **Extra cover**: pick the day, tap someone who isn't working that day, **Save extra cover**.
  People of a kind that is short that day are marked **NEEDED**.
- **Master scheduling**: the master schedule, which repeats every week.
  - **Your team**: add people, set their kind (👷 / ⏰ / 🚚), mark someone **Away for a while** (hidden
    from the calendar without deleting them), or **Remove** them.
  - **Who works each day**: use **− / +** to set the minimum of each kind per day, **+ Add person**
    to put someone on that day, and **×** to take them off. **Same people as Monday** copies Monday.
  - Press **Save master schedule**. Days off and extra cover already entered stay as they are.
- Under the buttons, **Changes for …** lists that week's days off and extra cover, each with **Undo**.

## Files

| File | What it does |
|---|---|
| [`Schedule.gs`](Schedule.gs) | Server side: works out each day (master schedule + extra cover − days off), saves changes, the Schedule tabs. |
| [`SchedulePage.html`](SchedulePage.html) | The Scheduling screens: Calendar, Make changes, Master scheduling. The worker-type pictures and colours are in `TYPES` at the top of its script. |

## Spreadsheet tabs

- **Schedule · Staff**: name, kind of worker, and whether they are on the schedule (tick box).
- **Schedule · Base Week**: the master schedule, one row per person with a tick box per weekday.
- **Schedule · Needed**: the minimum of each kind of worker per weekday.
- **Schedule · Changes**: days off and extra cover for particular dates.

These tabs can also be edited by hand; the app shows the change when it is reloaded.
