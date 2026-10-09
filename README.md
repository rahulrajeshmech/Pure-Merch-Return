# Pure-Merch-Return

A Google tool for supplier returns:

1. Type a part number.
2. It finds every invoice PDF in your Gmail that contains that part (any supplier, any layout).
3. Tap one invoice and press **RETURN**.
4. It shows the invoice number to write on the part and saves the return to a Google Sheet
   (downloadable as Excel).

It lists 15 invoices where that part has **not** been returned yet, so the same part is never returned
twice against the same invoice. Other parts on that invoice are not affected.

The code is in [`apps-script/`](apps-script). It runs inside your own Google account: no server,
no cost, and your email never leaves Google.

## The spreadsheet

- **Returns**: one row per return with date returned, part number, invoice number, supplier,
  email date, email subject, PDF file name and a link to the email. Newest first, with filters.
- **By Invoice**: grouped by supplier and invoice, listing each part returned against it.
- **Download Excel**: link at the top of the tool, or in the sheet use File → Download → Microsoft Excel.

## Setup (one time, about 10 minutes)

Do this signed in to the Google account that **receives the supplier invoices**.

1. Go to <https://sheets.new> and name the sheet **Parts Returns**.
2. Click **Extensions → Apps Script**. A code editor opens.
3. Click the **gear (Project Settings)** on the left:
   - Tick **Show "appsscript.json" manifest file in editor**.
   - Set **Time zone** to yours.
4. Back in the **Editor** (`< >` icon):
   - Open `Code.gs`, delete what's there, paste in [`apps-script/Code.gs`](apps-script/Code.gs).
   - Open `appsscript.json`, delete what's there, paste in [`apps-script/appsscript.json`](apps-script/appsscript.json).
   - Click **+ → HTML**, name it `Index` (no `.html`), delete what's there, paste in
     [`apps-script/Index.html`](apps-script/Index.html).
   - Click **Save** (disk icon).
5. In the toolbar, pick **setup** from the function drop-down and click **Run**.
   - Google asks for permission: **Review permissions** → choose your account →
     **Advanced** → **Go to … (unsafe)** → **Allow**.
     The "unverified" warning is normal for a script you wrote yourself; it only runs in your account.
   - The sheet now has **Returns** and **By Invoice** tabs.
6. Click **Deploy → New deployment** → gear → **Web app**:
   - Execute as: **Me**
   - Who has access: **Only myself**
   - Click **Deploy** and copy the **Web app URL**.
7. On the returns PC, open Chrome **signed in to that same Google account**, open the URL, and
   create a desktop shortcut (Chrome menu ⋮ → **Cast, save and share → Create shortcut**, name it **Returns**).

### Changing the code later

Paste the new code, save, then **Deploy → Manage deployments → ✎ edit → Version: New version → Deploy**.
The URL stays the same.

## Good to know

- **Finding invoices** uses Gmail's own search, so it finds what typing the part number into Gmail finds.
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
- If one invoice had more than one of the same part, open **Show … already returned** and use the small
  **"return again"** link on that invoice.
- Works with a personal Gmail account. Work (Google Workspace) accounts may need the IT admin to allow Apps Script.
