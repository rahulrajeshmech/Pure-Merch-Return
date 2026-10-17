# PureTech

One Google web app and one Google Sheet for the shop, with two sections:

- **📦 Returns**: find which supplier invoice a part was bought on and log the return.
- **👥 Scheduling**: the weekly staff calendar, with a check that enough people are in each day.

The buttons at the top of the page switch between them. The app opens on **Returns**.

The code is in [`apps-script/`](apps-script). It runs inside your own Google account: no server,
no cost, and your email never leaves Google.

## Returns


1. Type a part number.
2. It finds every invoice PDF in your Gmail that contains that part (any supplier, any layout).
3. Tap one invoice and press **RETURN**.
4. It shows the invoice number to write on the part and saves the return to a Google Sheet
   (downloadable as Excel).

It lists 15 invoices where that part has **not** been returned yet, so the same part is never returned
twice against the same invoice. Other parts on that invoice are not affected.

## Scheduling

There are three kinds of worker, each with its own picture and colour: **👷 Full time**, **⏰ Part time**
and **🚚 Driver**. Scheduling has two parts, chosen with the buttons under the PureTech bar.

### 📅 Calendar (for looking)

- One card per day, Monday to Sunday. Use **◀ ▶** to change week and **Today** to come back.
- Each day shows a badge per kind of worker, e.g. `🚚 1/2 ✗`: 1 driver working, 2 needed, so the
  day is short. A short day has a red border, and the red box at the top lists every short day.
- People working are shown as coloured name tags. Changes from the usual week stand out:
  a **greyed, crossed-out** tag means a day off; a **dashed** tag marked **+ COVER** means extra cover.
- A day with no minimum and nobody working shows **Closed**.
- Nothing can be changed here. A short day has a **Fix this day →** link that opens Make changes.

### ✏️ Make changes (for changing)

- **🏖️ Day off**: pick the day, tap the person, optionally pick why (Sick, Holiday, Other), **Save day off**.
  Before saving it shows whether the day will be short.
- **➕ Extra cover**: pick the day, tap someone who isn't working that day, **Save extra cover**.
  People of a kind that is short that day are marked **NEEDED**.
- **🔁 Usual week**: the week that repeats every week.
  - **Your team**: add people, set their kind (👷 / ⏰ / 🚚), mark someone **Away for a while** (hidden
    from the calendar without deleting them), or remove them.
  - **Who usually works each day**: use **− / +** to set the minimum of each kind per day, **+ Add person**
    to put someone on that day, and **×** to take them off. **Same people as Monday** copies Monday.
  - Press **Save usual week**. Days off and extra cover already entered stay as they are.
- Under the buttons, **Changes for …** lists that week's days off and extra cover, each with **Undo**.

## How it works

![How PureTech works: Returns and Scheduling](diagrams/parts-returns-architecture.svg)

For a version you can zoom and click, download
[`diagrams/parts-returns-architecture.html`](diagrams/parts-returns-architecture.html) and open it in Chrome.

## Preview on this computer (no Google account)

To see the page and try changes before copying anything into Google:

1. In the project folder run `node tools/preview.mjs --open`. It builds
   `preview/PureTech-preview.html` and opens it in the browser.
2. It uses demo data: a sample team for Scheduling, and demo invoices for Returns (try part
   numbers `CH8115` or `BP4471`). Nothing reaches Gmail or the Google Sheet.
3. What you do in the preview is remembered in that browser. **Reset demo data** (top right) starts again.
4. After changing any file in `apps-script/`, run step 1 again and reload the page.

## The spreadsheet

The sheet is called **PureTech**. Its tabs are coloured by section: green for Returns, blue for Scheduling.

- **Returns**: one row per return with date returned, part number, invoice number, supplier,
  email date, email subject, PDF file name and a link to the email. Newest first, with filters.
- **By Invoice**: grouped by supplier and invoice, listing each part returned against it.
- **Schedule · Staff**: name, kind of worker, and whether they are on the schedule (tick box).
- **Schedule · Base Week**: the usual week, one row per person with a tick box per weekday.
- **Schedule · Needed**: the minimum of each kind of worker per weekday.
- **Schedule · Changes**: days off and extra cover for particular dates.
- The Schedule tabs can also be edited by hand; the app shows the change when it is reloaded.
- **Download Excel**: link at the top of the tool, or in the sheet use File → Download → Microsoft Excel.

## Setup (one time, about 10 minutes)

Do this signed in to the Google account that **receives the supplier invoices**.

1. Go to <https://sheets.new> and name the sheet **PureTech**.
2. Click **Extensions → Apps Script**. A code editor opens.
3. Click the **gear (Project Settings)** on the left:
   - Tick **Show "appsscript.json" manifest file in editor**.
   - Set **Time zone** to yours.
4. Back in the **Editor** (`< >` icon):
   - Open `Code.gs`, delete what's there, paste in [`apps-script/Code.gs`](apps-script/Code.gs).
   - Open `appsscript.json`, delete what's there, paste in [`apps-script/appsscript.json`](apps-script/appsscript.json).
   - Click **+ → Script**, name it `Main` (no `.gs`), delete what's there, paste in
     [`apps-script/Main.gs`](apps-script/Main.gs). Do the same for `Schedule` with
     [`apps-script/Schedule.gs`](apps-script/Schedule.gs).
   - Click **+ → HTML**, name it `Index` (no `.html`), delete what's there, paste in
     [`apps-script/Index.html`](apps-script/Index.html). Do the same for `ReturnsPage` with
     [`apps-script/ReturnsPage.html`](apps-script/ReturnsPage.html) and `SchedulePage` with
     [`apps-script/SchedulePage.html`](apps-script/SchedulePage.html).
   - Click **Save** (disk icon).
5. Click **Deploy → New deployment** → gear → **Web app**:
   - Execute as: **Me**
   - Who has access: **Only myself**
   - Click **Deploy**. If it asks to **Authorize access**: choose your account → **Advanced** →
     **Go to … (unsafe)** → **Allow**. The "unverified" warning is normal for a script you added
     yourself; it only runs in your account.
   - Copy the **Web app URL**.
6. Open that URL. The first time, Google may ask for permission again (same steps as above).
   The tool then creates the Returns and Schedule tabs in your sheet by itself.
7. On the returns PC, open Chrome **signed in to that same Google account**, open the URL, and
   create a desktop shortcut (Chrome menu ⋮ → **Cast, save and share → Create shortcut**, name it **PureTech**).
8. Optional: for a shortcut that opens straight on Scheduling, add `?section=scheduling` to the end of
   the Web app URL, open that, and create a second shortcut named **Staff schedule**.

### Upgrading from the old "Parts Returns" tool

Use the same Google Sheet and Apps Script project, so the returns already logged and the web-app URL stay.

1. Open the Parts Returns Google Sheet → **Extensions → Apps Script**.
2. Replace `Code.gs` and `Index` as in "Updating to a new version" below.
3. Add the four new files: **+ → Script** named `Main` and `Schedule`, **+ → HTML** named `ReturnsPage`
   and `SchedulePage`, pasting in the file with the same name from [`apps-script/`](apps-script).
   Press **Ctrl + S**.
4. **Deploy → Manage deployments → pencil ✎ → Version: New version → Deploy**.
5. Reload the tool. The first time it renames the sheet to **PureTech** and adds the Schedule tabs.
6. Open **👥 Scheduling → ✏️ Make changes → 🔁 Usual week** to add the team.

### Updating to a new version of the code

1. Open the Google Sheet → **Extensions → Apps Script**.
2. For each changed file (for example `Code.gs`, `SchedulePage.html`): click it on the left, select all (**Ctrl + A**),
   delete, paste the new version, and press **Ctrl + S**.
3. Click **Deploy → Manage deployments**. Click the **pencil ✎** on the right, set **Version** to
   **New version**, and click **Deploy**.
4. Reload the tool in Chrome. The URL and desktop shortcut stay the same.

Skipping step 3 means the tool keeps running the old code.

## Good to know (Returns)

- **Finding invoices** uses Gmail's own search, so it finds what typing the part number into Gmail finds.
  Dashes, spaces and slashes don't matter: `ch8115`, `CH-8115` and `CH 8115` all find the same invoices.
  It shows the **15 newest invoices where that part has not been returned yet**, going as far back as
  needed (up to 300 emails). Invoices already used for that part are hidden behind a
  "Show … already returned" link. Change `SHOW_INVOICES` at the top of `Code.gs` for a different number.
- **Reading the PDF** uses Google Drive's text recognition, so any supplier layout works, scans included.
  Each PDF takes a few seconds the first time; after that it is remembered (hidden `_pdf_cache` tab).
- **Invoice number** is a best guess from the PDF ("Invoice No", "Invoice #", "Bill No", …), then the
  email subject, then the file name. When an invoice is selected the number is shown in a box so it can
  be corrected; if no number was found, it must be typed in.
- Each card shows the line from the PDF that contains the part, and warns if the part could not be
  seen in that PDF.
- **Undo a mistake:**
  - Straight after saving: press **UNDO — that was a mistake** on the "Write this on the part" screen.
  - Later: search the part, click **Show … already returned**, and click **undo this return** on that invoice.
  - Either way the row is removed from the spreadsheet and the invoice is free to use again.
    Cross out the invoice number if it was already written on the part.
- If one invoice had more than one of the same part, open **Show … already returned** and use the small
  **"return again"** link on that invoice.
- Works with a personal Gmail account. Work (Google Workspace) accounts may need the IT admin to allow Apps Script.
