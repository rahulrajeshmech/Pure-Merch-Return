/**
 * Parts Return Tool
 *
 * A web page that searches Gmail for supplier invoices (PDFs) containing a
 * part number, lets the user pick one and records the return in this Google
 * Sheet. Works with any supplier: the PDF is read with Google Drive's text
 * recognition and the invoice number is guessed, then confirmed by the user.
 */

// How many not-yet-returned invoices to show. A few spares are fetched in case
// one turns out to be an invoice already used under a different email.
const SHOW_INVOICES = 15;
const SPARE_INVOICES = 5;
// Stop looking after this many emails, so a very common part can't stall the search.
const MAX_EMAILS_SCANNED = 300;
const SEARCH_EXTRA = 'has:attachment filename:pdf';

const RETURNS = 'Returns';
const BY_INVOICE = 'By Invoice';
const CACHE = '_pdf_cache';
const RETURN_HEADERS = ['Date Returned', 'Part Number', 'Invoice Number', 'Supplier',
  'Email Date', 'Email Subject', 'PDF File', 'Email', 'Key'];
const COL = { date: 1, part: 2, invoice: 3, supplier: 4, key: 9 };

// ---------------------------------------------------------------------------
// Web app

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Parts Returns')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getConfig() {
  const ss = ss_();
  return {
    sheetUrl: ss.getUrl(),
    excelUrl: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx',
  };
}

/**
 * Finds PDF attachments in emails matching the part number, newest first, until
 * there are enough where the part has not been returned yet. Fast: does not open
 * the PDFs (readInvoice does that, one at a time, from the page).
 */
function searchPart(part) {
  part = String(part || '').trim();
  const out = { items: [], returned: [], returnedInvoices: [], show: SHOW_INVOICES };
  if (!part) return out;

  const q = '"' + part.replace(/"/g, '') + '" ' + SEARCH_EXTRA;
  const done = returnedFor_(part);
  out.returnedInvoices = done.invoices;
  const tz = ss_().getSpreadsheetTimeZone();
  const wanted = SHOW_INVOICES + SPARE_INVOICES;

  let pageToken, scanned = 0;
  do {
    const res = Gmail.Users.Messages.list('me', { q: q, maxResults: 50, pageToken: pageToken });
    pageToken = res.nextPageToken;
    const messages = res.messages || [];
    for (let n = 0; n < messages.length && out.items.length < wanted; n++) {
      const m = messages[n];
      scanned++;
      const msg = GmailApp.getMessageById(m.id);
      msg.getAttachments({ includeInlineImages: false }).forEach(function (a, i) {
        if (!isPdf_(a)) return;
        const key = m.id + ':' + i;
        const item = {
          key: key,
          messageId: m.id,
          threadId: m.threadId,
          index: i,
          fileName: a.getName(),
          supplier: supplierName_(msg.getFrom()),
          subject: msg.getSubject(),
          dateIso: msg.getDate().toISOString(),
          dateText: Utilities.formatDate(msg.getDate(), tz, 'd MMM yyyy'),
            returnedOn: done.keys[key] ? done.keys[key].when : '',
          returnedInvoice: done.keys[key] ? done.keys[key].invoice : '',
        };
        (item.returnedOn ? out.returned : out.items).push(item);
      });
    }
  } while (pageToken && out.items.length < wanted && scanned < MAX_EMAILS_SCANNED);
  return out;
}

/** Reads one PDF and returns its guessed invoice number and the line with the part. */
function readInvoice(item, part) {
  let info = cacheGet_(item.key);
  if (!info) {
    const att = GmailApp.getMessageById(item.messageId)
      .getAttachments({ includeInlineImages: false })[item.index];
    const text = pdfText_(att.copyBlob());
    info = { text: text, invoice: guessInvoice_(text, item.subject, item.fileName) };
    cachePut_(item.key, info);
  }
  return {
    invoice: info.invoice,
    found: norm_(info.text).indexOf(norm_(part)) !== -1,
    line: findLine_(info.text, part),
  };
}

/** Saves the return and rebuilds the "By Invoice" tab. */
function recordReturn(item, part, invoice) {
  part = String(part || '').trim().toUpperCase();
  invoice = String(invoice || '').trim().toUpperCase();
  if (!part || !invoice) throw new Error('Part number and invoice number are both needed.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(RETURNS);
    const link = 'https://mail.google.com/mail/u/0/#all/' + item.threadId;
    sh.appendRow([new Date(), part, invoice, item.supplier, new Date(item.dateIso),
      item.subject, item.fileName, '', norm_(part) + '|' + item.key]);
    const row = sh.getLastRow();
    sh.getRange(row, 8).setFormula('=HYPERLINK("' + link + '","Open")');
    if (row > 2) {
      sh.getRange(2, 1, row - 1, RETURN_HEADERS.length).sort({ column: COL.date, ascending: false });
    }
    rebuildByInvoice_();
  } finally {
    lock.releaseLock();
  }
  return { invoice: invoice };
}

// ---------------------------------------------------------------------------
// One-time setup: run this from the Apps Script editor.

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());

  let sh = ss.getSheetByName(RETURNS) || ss.insertSheet(RETURNS, 0);
  sh.getRange(1, 1, 1, RETURN_HEADERS.length).setValues([RETURN_HEADERS])
    .setFontWeight('bold').setBackground('#1d7a3a').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.getRange('A:A').setNumberFormat('d mmm yyyy, h:mm am/pm');
  sh.getRange('E:E').setNumberFormat('d mmm yyyy');
  sh.getRange('B:C').setNumberFormat('@');
  [170, 140, 140, 200, 110, 300, 200, 70].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  sh.hideColumns(COL.key);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), RETURN_HEADERS.length).createFilter();

  if (!ss.getSheetByName(BY_INVOICE)) ss.insertSheet(BY_INVOICE, 1);
  rebuildByInvoice_();

  const cache = ss.getSheetByName(CACHE) || ss.insertSheet(CACHE);
  cache.getRange(1, 1, 1, 3).setValues([['Key', 'Invoice', 'Text']]);
  cache.hideSheet();

  // Remove the default empty "Sheet1" if it is still there.
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) ss.deleteSheet(blank);

  // Touch each service so Google asks for every permission now, not mid-use.
  Gmail.Users.Messages.list('me', { maxResults: 1 });
  Drive.Files.list({ pageSize: 1 });
  Logger.log('Setup done.');
}

// ---------------------------------------------------------------------------
// Helpers

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Tab "' + name + '" is missing. Run setup() once from the script editor.');
  return sh;
}

/** Spacing, dashes and case are ignored when comparing part/invoice numbers. */
function norm_(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isPdf_(att) {
  return att.getContentType() === 'application/pdf' || /\.pdf$/i.test(att.getName());
}

function supplierName_(from) {
  const m = String(from).match(/^\s*"?([^"<]+?)"?\s*</);
  return (m ? m[1] : String(from).replace(/[<>]/g, '')).trim();
}

/** Already-returned PDFs and invoice numbers for this part. */
function returnedFor_(part) {
  const sh = sheet_(RETURNS);
  const out = { keys: {}, invoices: [] };
  if (sh.getLastRow() < 2) return out;
  const p = norm_(part);
  const tz = ss_().getSpreadsheetTimeZone();
  sh.getRange(2, 1, sh.getLastRow() - 1, RETURN_HEADERS.length).getValues().forEach(function (r) {
    if (norm_(r[COL.part - 1]) !== p) return;
    const when = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'd MMM yyyy') : String(r[0]);
    out.keys[String(r[COL.key - 1]).split('|')[1]] = { when: when, invoice: String(r[COL.invoice - 1]) };
    out.invoices.push({ invoice: norm_(r[COL.invoice - 1]), when: when });
  });
  return out;
}

/** Converts a PDF to text using Google Drive's text recognition (works on scans too). */
function pdfText_(blob) {
  const file = Drive.Files.create(
    { name: 'temp-invoice-read', mimeType: MimeType.GOOGLE_DOCS }, blob, { ocrLanguage: 'en', fields: 'id' });
  try {
    return DocumentApp.openById(file.id).getBody().getText();
  } finally {
    Drive.Files.remove(file.id);
  }
}

// Labels suppliers commonly put before the invoice number. The value must contain a digit.
const INVOICE_PATTERNS = [
  /(?:tax\s*)?invoice\s*(?:no|number|num|nbr|#)\.?\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9\-\/]*)/gi,
  /\binv(?:oice)?\.?\s*(?:no\.?\s*)?[#:]\s*([A-Z0-9][A-Z0-9\-\/]*)/gi,
  /\b(?:bill|document|doc)\s*(?:no|number)\.?\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/]*)/gi,
];
const LOOSE_PATTERN = /\binv(?:oice)?[\s_\-#:.]*([A-Z0-9\-\/]*\d[A-Z0-9\-\/]*)/gi;

/** Best guess at the invoice number: PDF text first, then email subject, then file name. */
function guessInvoice_(text, subject, fileName) {
  const sources = [
    [text, INVOICE_PATTERNS],
    [subject, INVOICE_PATTERNS.concat([LOOSE_PATTERN])],
    [String(fileName || '').replace(/\.pdf$/i, ''), [LOOSE_PATTERN]],
  ];
  for (let s = 0; s < sources.length; s++) {
    const str = String(sources[s][0] || '');
    const patterns = sources[s][1];
    for (let p = 0; p < patterns.length; p++) {
      const re = new RegExp(patterns[p].source, patterns[p].flags);
      let m;
      while ((m = re.exec(str))) {
        const v = m[1].replace(/[\-\/]+$/, '');
        if (/\d/.test(v) && v.length >= 3) return v.toUpperCase();
      }
    }
  }
  return '';
}

/** The PDF line mentioning the part, so the user can see it really is on the invoice. */
function findLine_(text, part) {
  const p = norm_(part);
  const lines = String(text || '').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (norm_(lines[i]).indexOf(p) !== -1) {
      return lines[i].replace(/\s+/g, ' ').trim().slice(0, 160);
    }
  }
  return '';
}

function cacheGet_(key) {
  const sh = ss_().getSheetByName(CACHE);
  if (!sh || sh.getLastRow() < 2) return null;
  const hit = sh.getRange('A:A').createTextFinder(key).matchEntireCell(true).findNext();
  if (!hit) return null;
  const r = sh.getRange(hit.getRow(), 1, 1, 3).getValues()[0];
  return { invoice: String(r[1]), text: String(r[2]) };
}

function cachePut_(key, info) {
  const sh = ss_().getSheetByName(CACHE);
  if (!sh) return;
  // A cell holds at most 50,000 characters; the part list is near the top anyway.
  sh.appendRow([key, info.invoice, "'" + info.text.slice(0, 45000)]);
}

/** Rebuilds the "By Invoice" tab: one block per supplier invoice, listing the parts returned. */
function rebuildByInvoice_() {
  const ss = ss_();
  const src = ss.getSheetByName(RETURNS);
  const out = ss.getSheetByName(BY_INVOICE);
  if (!src || !out) return;
  out.clear();

  const rows = src.getLastRow() < 2 ? [] :
    src.getRange(2, 1, src.getLastRow() - 1, RETURN_HEADERS.length).getValues();

  const groups = {};
  rows.forEach(function (r) {
    const k = r[COL.supplier - 1] + '\u0000' + r[COL.invoice - 1];
    (groups[k] = groups[k] || []).push(r);
  });
  const keys = Object.keys(groups).sort(function (a, b) {
    return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
  });

  const values = [['Supplier', 'Invoice Number', 'Part Number', 'Date Returned']];
  const groupRows = [];
  keys.forEach(function (k) {
    const g = groups[k].sort(function (a, b) { return String(a[1]).localeCompare(String(b[1])); });
    groupRows.push(values.length + 1);
    values.push([g[0][COL.supplier - 1], g[0][COL.invoice - 1],
      g.length + (g.length === 1 ? ' part returned' : ' parts returned'), '']);
    g.forEach(function (r) { values.push(['', '', r[COL.part - 1], r[COL.date - 1]]); });
  });

  out.getRange(1, 1, values.length, 4).setValues(values);
  out.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#1d7a3a').setFontColor('#ffffff');
  groupRows.forEach(function (r) {
    out.getRange(r, 1, 1, 4).setFontWeight('bold').setBackground('#e3f5e8');
  });
  out.getRange('D:D').setNumberFormat('d mmm yyyy');
  out.setFrozenRows(1);
  [220, 160, 160, 130].forEach(function (w, i) { out.setColumnWidth(i + 1, w); });
}
