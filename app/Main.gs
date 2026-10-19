/**
 * PureTech
 *
 * One web app and one Google Sheet for the shop, with two sections:
 *  - Returns (Returns.gs, ReturnsPage.html): find supplier invoices in Gmail and log part returns.
 *  - Scheduling (Schedule.gs, SchedulePage.html): the weekly staff calendar.
 * This file holds the page, the one-time setup and the helpers both sections use.
 */

const APP_NAME = 'PureTech';

// ---------------------------------------------------------------------------
// Web app

function doGet(e) {
  // First time the page is opened (or after an upgrade): create the missing tabs.
  const ss = ss_();
  if (!ss.getSheetByName(RETURNS) || !ss.getSheetByName(SCHED_STAFF)) setup();
  const page = HtmlService.createTemplateFromFile('Index');
  // ?section=scheduling opens the Scheduling section straight away.
  page.section = e && e.parameter && e.parameter.section === 'scheduling' ? 'scheduling' : 'returns';
  return page.evaluate()
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Pastes another HTML file into Index.html (used as <?!= include_('ReturnsPage') ?>). */
function include_(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

function getConfig() {
  const ss = ss_();
  return {
    sheetUrl: ss.getUrl(),
    excelUrl: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx',
  };
}

// ---------------------------------------------------------------------------
// One-time setup. Runs by itself the first time the page is opened; can also be
// run from the Apps Script editor. Safe to run again: it only adds what is missing.

function setup() {
  const ss = ss_();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  if (ss.getName() !== APP_NAME) ss.rename(APP_NAME);

  setupReturns_(ss);
  setupSchedule_(ss);

  // Remove the default empty "Sheet1" if it is still there.
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) ss.deleteSheet(blank);

  Logger.log('Setup done.');
}

// ---------------------------------------------------------------------------
// Shared helpers

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open the Apps Script editor from the sheet (Extensions → Apps Script) and paste the code there.');
  return ss;
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Tab "' + name + '" is missing. Reload the page to recreate it.');
  return sh;
}

/** Spacing, dashes and case are ignored when comparing part/invoice numbers and names. */
function norm_(s) {
  return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
