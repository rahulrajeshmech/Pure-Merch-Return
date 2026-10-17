# Pure-Merch-Return

Google Apps Script web app for an auto-parts warehouse. The user types a part number, the tool
searches their Gmail for supplier invoice PDFs containing it, they pick one, press RETURN, and the
return is logged in a Google Sheet. The person using it daily is not technical: keep the UI to big
text, few choices, plain words. Never add steps or settings to their screen without asking.

## Files

- `apps-script/Code.gs` — server: Gmail search (`searchPart`, `partQuery_`), PDF reading via Drive OCR
  (`readInvoice`, `pdfText_`, `guessInvoice_`), saving/undo (`recordReturn`, `undoReturn`), sheet layout
  (`setup`, `rebuildByInvoice_`).
- `apps-script/Index.html` — the whole page (HTML/CSS/JS, talks to the server via `google.script.run`).
- `apps-script/appsscript.json` — manifest (Gmail + Drive advanced services, web app settings).
- `README.md` — setup and usage instructions for the owner. Keep it in sync with behaviour changes.

## Key behaviour

- Part and invoice numbers are compared with `norm_` (uppercase, letters/digits only).
- Shows up to `SHOW_INVOICES` (15) invoices where the part has NOT been returned.
- A return is keyed by `normalisedPart|gmailMessageId:attachmentIndex` (hidden column I of Returns).
- Sheet tabs: `Returns` (one row per return, newest first), `By Invoice` (rebuilt after every change),
  `_pdf_cache` (hidden OCR cache).

## Testing locally (no Google account needed)

- Server helpers: load `Code.gs` in Node with `vm.runInContext` and stub `SpreadsheetApp`,
  `PropertiesService`, `LockService` as needed; call the pure functions (`guessInvoice_`,
  `partQuery_`, `findLine_`, `undoReturn` with a fake sheet).
- Page: inject a fake `google.script.run` (a Proxy returning canned data) before the page script and
  drive it with Playwright.
- `node --check` on a `.js` copy of `Code.gs` for syntax.

## Getting changes into Google (manual, by the owner)

This repo is NOT linked to any Google account, and must not be: do not set up clasp, Google sign-in
or any other connection to the owner's Google account. The owner copies the code across by hand.

After every change:

1. Run the local tests above.
2. Commit and push, so the owner can also copy the files from GitHub.
3. Tell the owner, in plain words, **which files changed** (`Code.gs`, `Index.html`,
   `appsscript.json`) and give these steps:
   1. Open the Parts Returns Google Sheet → **Extensions → Apps Script**.
   2. For each changed file: click it on the left, **Ctrl + A**, **Delete**, paste the new version,
      **Ctrl + S**.
   3. **Deploy → Manage deployments → pencil ✎ → Version: New version → Deploy**.
   4. Reload the tool in Chrome.
   Offer to print a changed file's full contents so they can copy it straight from the terminal.

The owner is not technical: one action per step, no jargon.
