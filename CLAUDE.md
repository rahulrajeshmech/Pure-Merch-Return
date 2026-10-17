# PureTech (repo: Pure-Merch-Return)

Google Apps Script web app for an auto-parts warehouse, called **PureTech**: one web app and one
Google Sheet (also named PureTech) with two sections:

- **Returns**: the user types a part number, the tool searches the shared Gmail for supplier invoice
  PDFs containing it, they pick one, press RETURN, and the return is logged in the Sheet.
- **Scheduling**: a weekly staff calendar (Full time 👷 / Part time ⏰ / Driver 🚚) with a minimum of
  each kind per weekday, a repeating master schedule, and dated days off / extra cover on top.

Everyone uses one shared PC and Google account; there are no logins or edit protection. The people
using it are not technical: keep the UI to big text, few choices, plain words. Never add steps or
settings to their screen without asking. The schedule must look like a calendar (day cards, coloured
emoji tags), never like a spreadsheet grid. The only emoji anywhere in the app are the three worker
types; everything else is plain words (plain ✓ ✗ ◀ ▶ → symbols are fine).

## Files

Apps Script `.gs` files share one global scope. Script and HTML files must not share a name.

- `apps-script/Main.gs` — `doGet` (template page; `?section=scheduling` opens Scheduling), `include_`,
  `getConfig`, `setup` (renames the sheet to PureTech, calls each section's setup), shared helpers
  `ss_`, `sheet_`, `norm_`.
- `apps-script/Code.gs` — Returns server: Gmail search (`searchPart`, `partQuery_`), PDF reading via
  Drive OCR (`readInvoice`, `pdfText_`, `guessInvoice_`), saving/undo (`recordReturn`, `undoReturn`),
  tabs (`setupReturns_`, `rebuildByInvoice_`).
- `apps-script/Schedule.gs` — Scheduling server: `getWeek`, `setDayOff`, `addExtra`, `removeChange`,
  `saveMasterSchedule`; pure `buildWeek_` (no Google calls) works out each day; `setupSchedule_`.
- `apps-script/Index.html` — page shell: PureTech bar, section buttons, shared CSS and the `$`, `esc`,
  `call` helpers; pastes in the two section files with `<?!= include_('…') ?>`.
- `apps-script/ReturnsPage.html` — Returns section (CSS scoped under `.returns`).
- `apps-script/SchedulePage.html` — Scheduling section (CSS under `.scheduling`, classes `sc-*`, JS
  wrapped in the `Scheduling` module so its names don't clash with the Returns script). Emoji and
  colours per worker type are in `TYPES` at the top of the script.
- `apps-script/appsscript.json` — manifest (Gmail + Drive advanced services, web app settings).
- `README.md` — setup and usage instructions for the owner. Keep it in sync with behaviour changes.

## Key behaviour

- Part and invoice numbers are compared with `norm_` (uppercase, letters/digits only).
- Shows up to `SHOW_INVOICES` (15) invoices where the part has NOT been returned.
- A return is keyed by `normalisedPart|gmailMessageId:attachmentIndex` (hidden column I of Returns).
- Sheet tabs: `Returns` (one row per return, newest first), `By Invoice` (rebuilt after every change),
  `_pdf_cache` (hidden OCR cache); then `Schedule · Staff`, `Schedule · Base Week`, `Schedule · Needed`,
  `Schedule · Changes`. `doGet` runs `setup` if any of these is missing.
- Scheduling: people are matched by `norm_(name)`. A day's workers = master schedule + Extra − Off (a day
  off wins). Dates are `yyyy-mm-dd` strings worked out in UTC. Renaming someone in Master scheduling
  renames their rows in Changes. Calendar is view-only; all input is in Make changes.

## Testing locally (no Google account needed)

- Server: load `Main.gs` + `Code.gs` + `Schedule.gs` together in Node with `vm.runInContext` and stub
  `SpreadsheetApp`, `PropertiesService`, `LockService`, `Utilities` as needed; call the pure functions
  (`guessInvoice_`, `partQuery_`, `findLine_`, `buildWeek_`) and the schedule functions against fake
  sheets. Values crossing the vm boundary (arrays, Dates) are from another realm: compare via JSON and
  create Dates inside the context.
- Page: build `Index.html` as Apps Script would (replace `<?= section ?>` and the `include_` lines with
  the files), inject a fake `google.script.run` (a Proxy) before the first script, and drive it with
  Playwright. Bridging the fake to the vm context with `page.exposeFunction` tests page and server together.
- `node --check` on `.js` copies of the `.gs` files for syntax.

## Local preview for the owner

`node tools/preview.mjs [--open]` builds `preview/PureTech-preview.html` (git-ignored) from the real
`apps-script/` files. `tools/preview-fake.js` stands in for Google: the real `.gs` code runs in its
own scope on pretend sheets kept in localStorage; Gmail/Drive OCR are replaced by `DEMO_EMAILS`
(the real `guessInvoice_`/`findLine_`/`returnedFor_` still run). Rebuild after every change so the
owner can reload and look. If the server code starts using a new Google service, add it to the fake.

## Getting changes into Google (manual, by the owner)

This repo is NOT linked to any Google account. Do not set up clasp, Google sign-in or any other
connection to the owner's Google account unless the owner explicitly asks for it in their own words
(see "Linking to Google later" below). Until then, the owner copies the code across by hand.

After every change:

1. Run the local tests above.
2. Commit and push, so the owner can also copy the files from GitHub.
3. Tell the owner, in plain words, **which files changed** (any of `Main.gs`, `Code.gs`, `Schedule.gs`,
   `Index.html`, `ReturnsPage.html`, `SchedulePage.html`, `appsscript.json`) and which are **new** (they
   must be created first with **+ → Script** or **+ → HTML**, named without the extension), and give
   these steps:
   1. Open the PureTech Google Sheet → **Extensions → Apps Script**.
   2. For each changed file: click it on the left, **Ctrl + A**, **Delete**, paste the new version,
      **Ctrl + S**.
   3. **Deploy → Manage deployments → pencil ✎ → Version: New version → Deploy**.
   4. Reload the tool in Chrome.
   Offer to print a changed file's full contents so they can copy it straight from the terminal.

The owner is not technical: one action per step, no jargon.

## Linking to Google later (only when the owner asks)

Google's clasp tool can upload and deploy the code directly:

1. Owner turns on "Google Apps Script API" at https://script.google.com/home/usersettings.
2. `npx @google/clasp login`, signed in to the Google account that receives the invoices.
3. Owner copies the Script ID from the Apps Script editor (gear → Project Settings); create
   `apps-script/.clasp.json` with `{"scriptId": "<id>", "rootDir": "."}`.
4. Upload: `cd apps-script && npx @google/clasp push`.
5. Publish at the same URL: `npx @google/clasp deployments` to find the web app deployment ID
   (not `@HEAD`), then `npx @google/clasp deploy -i <deploymentId> -d "<what changed>"`.

To unlink again: `npx @google/clasp logout` and delete `apps-script/.clasp.json`.
