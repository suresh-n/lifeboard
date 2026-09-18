/**
 * Milestones — Apps Script backend
 * ---------------------------------
 * Same pattern as your expense-ledger backend: a single Sheet as the
 * database, doGet for JSONP reads, doPost for writes, and a shared-secret
 * token so the "Anyone" web app deployment isn't silently public.
 *
 * SETUP
 * 1. Create a Google Sheet. Add a tab named "Tasks" with this header row
 *    in row 1 (exact spelling, any order doesn't matter as long as the
 *    header names match):
 *      id | title | category | priority | status | dueDate | notes | order | createdAt | updatedAt
 * 2. Extensions > Apps Script, paste this file in as Code.gs.
 * 3. Project Settings > Script Properties > add a property:
 *      AUTH_TOKEN = <a long random string you make up>
 *    Put that same string into the app's Settings > Auth token field.
 * 4. Deploy > New deployment > type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    (This is what makes the URL reachable from GitHub Pages. The token
 *    check below is what keeps it from being usable by strangers who
 *    happen to find the URL.)
 * 5. Copy the deployment URL into the app's Settings panel.
 */

const SHEET_NAME = 'Tasks';
const COLUMNS = ['id','title','category','priority','status','dueDate','notes','order','createdAt','updatedAt'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(COLUMNS);
  }
  return sheet;
}

function checkToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('AUTH_TOKEN');
  if (!expected) return true; // no token configured yet — allow, but you should set one
  return token === expected;
}

function readAllTasks_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const header = values[0];
  return values.slice(1).filter(r => r[0]).map(row => {
    const obj = {};
    header.forEach((key, i) => obj[key] = row[i]);
    return obj;
  });
}

function findRowById_(sheet, id) {
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // sheet row number
  }
  return -1;
}

/* ---------------- doGet: JSONP read ---------------- */
function doGet(e) {
  const token = e.parameter.token || '';
  const callback = e.parameter.callback;

  let payload;
  if (!checkToken_(token)) {
    payload = { error: 'unauthorized' };
  } else {
    payload = readAllTasks_();
  }

  const body = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${body})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- doPost: create / update / delete ---------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // sync lock — same protection as the expense-ledger app

  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (!checkToken_(body.token || '')) {
      return jsonOut_({ error: 'unauthorized' });
    }

    const sheet = getSheet_();
    const action = body.action;
    const t = body.task || {};

    if (action === 'create') {
      sheet.appendRow(COLUMNS.map(c => t[c] !== undefined ? t[c] : ''));
      return jsonOut_({ ok: true, action: 'create', id: t.id });
    }

    if (action === 'update') {
      const row = findRowById_(sheet, t.id);
      if (row === -1) {
        sheet.appendRow(COLUMNS.map(c => t[c] !== undefined ? t[c] : ''));
      } else {
        sheet.getRange(row, 1, 1, COLUMNS.length).setValues([COLUMNS.map(c => t[c] !== undefined ? t[c] : '')]);
      }
      return jsonOut_({ ok: true, action: 'update', id: t.id });
    }

    if (action === 'delete') {
      const row = findRowById_(sheet, t.id);
      if (row !== -1) sheet.deleteRow(row);
      return jsonOut_({ ok: true, action: 'delete', id: t.id });
    }

    return jsonOut_({ error: 'unknown action' });
  } catch (err) {
    return jsonOut_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
