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

## Uploading to Google (clasp)

The Apps Script project is bound to the owner's "Parts Returns" sheet. With clasp set up
(`apps-script/.clasp.json` holds the script ID, created by `clasp clone`/manually):

1. `cd apps-script && npx @google/clasp push` — uploads the code (answer yes to overwrite the manifest).
2. `npx @google/clasp deployments` — find the web app deployment ID (not the `@HEAD` one).
3. `npx @google/clasp deploy -i <deploymentId> -d "<what changed>"` — publishes it at the same URL.

Always run the local tests before pushing, and tell the owner to reload the tool afterwards.
