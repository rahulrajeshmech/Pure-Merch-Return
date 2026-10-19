# PureTech › Returns

[← Back to PureTech](../README.md)

Find which supplier invoice a part was bought on, and log the return.

1. Type a part number.
2. It finds every invoice PDF in your Gmail that contains that part (any supplier, any layout).
3. Tap one invoice and press **RETURN**.
4. It shows the invoice number to write on the part and saves the return to the Google Sheet
   (downloadable as Excel).

It lists 15 invoices where that part has **not** been returned yet, so the same part is never returned
twice against the same invoice. Other parts on that invoice are not affected.

## Files

| File | What it does |
|---|---|
| [`Returns.gs`](Returns.gs) | Server side: Gmail search, reading the PDFs, saving and undoing returns, the Returns tabs. |
| [`ReturnsPage.html`](ReturnsPage.html) | The Returns screen: search box, invoice cards, RETURN button. |

## Spreadsheet tabs

- **Returns**: one row per return with date returned, part number, invoice number, supplier,
  email date, email subject, PDF file name and a link to the email. Newest first, with filters.
- **By Invoice**: grouped by supplier and invoice, listing each part returned against it.
- **_pdf_cache** (hidden): text read from each PDF, so it is only read once.

## Good to know

- **Finding invoices** uses Gmail's own search, so it finds what typing the part number into Gmail finds.
  Dashes, spaces and slashes don't matter: `ch8115`, `CH-8115` and `CH 8115` all find the same invoices.
  It shows the **15 newest invoices where that part has not been returned yet**, going as far back as
  needed (up to 300 emails). Invoices already used for that part are hidden behind a
  "Show … already returned" link. Change `SHOW_INVOICES` at the top of `Returns.gs` for a different number.
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
