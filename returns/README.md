# PureTech › Returns

[← Back to PureTech](../README.md)

Find which supplier invoice a part was bought on, and log the return.

1. Type a part number.
2. It finds every invoice PDF in your Gmail that contains that part (any supplier, any layout).
3. Tap one invoice, choose **how many** you are returning with the **−** and **+** buttons, and press **RETURN**.
4. It shows the invoice number to write on the part and the **pallet** to put it on, and saves the
   return to the Google Sheet (downloadable as Excel).

It lists 15 invoices where some of that part can still be returned, so you never return more than
the invoice shipped. Other parts on that invoice are not affected.

## Pallets

Returns are packed onto pallets. The bar at the top of Returns says which pallet new returns go on,
e.g. **Putting returns on Pallet 3 · 12 parts**.

- **NEW PALLET**: press it when a pallet is full. New returns then go on the next pallet.
  (It is greyed out while the current pallet is empty.)
- **See pallets**: every pallet, newest first. Tap one to see what is on it.
  - **Move to pallet…** next to a part moves it to another pallet.
  - **Add more to this pallet** on an earlier pallet makes new returns go on it again. The pallet that
    was in use is marked as finished (or removed, if nothing was on it).
- Returns saved before pallets were added are all on **Pallet 1**.

## Files

| File | What it does |
|---|---|
| [`Returns.gs`](Returns.gs) | Server side: Gmail search, reading the PDFs, saving and undoing returns, the Returns tabs. |
| [`ReturnsPage.html`](ReturnsPage.html) | The Returns screen: search box, invoice cards, RETURN button. |

## Spreadsheet tabs

- **Returns**: one row per return with date returned, pallet, part number, quantity, invoice number,
  email date, PDF file name and a link to the email. Newest first, with filters.
- **By Pallet**: the returns sorted into pallets, newest pallet first: each pallet's dates and total,
  then every part on it with its quantity and invoice number.
- **By Invoice**: grouped by invoice number, listing each part returned against it with its quantity and pallet.
- **_pallets** (hidden): each pallet's number and the dates it was started and finished. Leave it alone;
  use the app to change pallets.
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
  - Later: search the part and click **undo the last return** on that invoice (it may be under
    **Show … already returned**).
  - Either way the row is removed from the spreadsheet and the invoice is free to use again.
    Cross out the invoice number if it was already written on the part.
- **Quantity:** the tool reads how many were shipped from the part's line on the invoice (on Vast-Auto
  invoices, the **SHIPPED** column). An invoice stays in the list until all of them have been returned,
  showing e.g. "2 of 4 already returned — 2 left". If the number was read wrong, press **wrong? change it**;
  if it could not be read, type it in the box. To return more from an invoice that shows as fully returned,
  open **Show … already returned** and use **return more from this invoice**.
- **Undo** removes the last return of that part on that invoice, whatever its quantity.
- Works with a personal Gmail account. Work (Google Workspace) accounts may need the IT admin to allow Apps Script.
