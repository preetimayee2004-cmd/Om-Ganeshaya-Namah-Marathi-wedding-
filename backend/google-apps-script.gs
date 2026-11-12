/**
 * Storage for the wedding site: RSVPs + moderated blessings, kept in this Google Sheet.
 * See SETUP.md for the 5-minute deploy steps.
 *
 *  - POST {type:"rsvp"|"blessing", ...}  appends a row (blessings start Approved = FALSE)
 *  - GET  ?type=blessings                returns only rows where Approved is ticked
 *  - GET  ?type=content                  returns the site content published from the Edit panel
 *  - POST {type:"content", key, content} saves that content      (key = Script property ADMIN_KEY)
 *  - POST {type:"upload", key, name, mime, data} stores a photo in Drive and returns its URL
 */

const HEADERS = {
  RSVPs: ["Timestamp", "Name", "Attending", "Guests", "Phone", "Message"],
  Blessings: ["Timestamp", "Name", "Message", "Approved"],
};

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEADERS[name]);
    sh.setFrozenRows(1);
    if (name === "Blessings") {
      // Tick-box column so moderation is one click per row.
      sh.getRange("D2:D1000").insertCheckboxes();
    }
  }
  return sh;
}

// Stop spreadsheet formula injection ("=HYPERLINK(...)") and cap length.
function clean_(v, max) {
  let s = String(v == null ? "" : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Edit panel ----------
const CONTENT_SHEET = "Content";
const CHUNK = 40000; // a cell holds up to 50,000 characters, so long JSON is split over rows
const PHOTO_FOLDER = "Wedding site photos";

function adminOk_(key) {
  const real = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY");
  if (!real) return "nokey";
  return String(key || "") === real ? "" : "key";
}

function saveContent_(content) {
  const json = JSON.stringify(content);
  let sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if (!sh) sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet(CONTENT_SHEET);
  sh.clear();
  const rows = [];
  for (let i = 0; i < json.length; i += CHUNK) rows.push(["'" + json.slice(i, i + CHUNK)]);
  if (rows.length) sh.getRange(1, 1, rows.length, 1).setValues(rows);
  sh.getRange(1, 2).setValue(new Date());
}

function readContent_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if (!sh || sh.getLastRow() < 1) return null;
  const json = sh.getRange(1, 1, sh.getLastRow(), 1).getValues().map(function (r) { return String(r[0]); }).join("");
  try { return JSON.parse(json); } catch (_) { return null; }
}

function uploadPhoto_(d) {
  const mime = /^image\/(jpeg|png|webp)$/.test(d.mime) ? d.mime : "image/jpeg";
  const folders = DriveApp.getFoldersByName(PHOTO_FOLDER);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PHOTO_FOLDER);
  const name = String(d.name || "photo").replace(/[^\w. -]/g, "").slice(0, 80) || "photo";
  const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.data), mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://lh3.googleusercontent.com/d/" + file.getId() + "=w2000";
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const now = new Date();

    if (d.type === "content" || d.type === "upload") {
      const bad = adminOk_(d.key);
      if (bad) return json_({ ok: false, error: bad });
      if (d.type === "content") {
        if (!d.content || typeof d.content !== "object") return json_({ ok: false, error: "invalid" });
        saveContent_(d.content);
        return json_({ ok: true });
      }
      if (!d.data) return json_({ ok: false, error: "invalid" });
      return json_({ ok: true, url: uploadPhoto_(d) });
    }

    if (d.type === "rsvp") {
      const name = clean_(d.name, 40);
      if (name.length < 2) return json_({ ok: false, error: "name" });
      const attending = d.attending === "yes" ? "Yes" : d.attending === "no" ? "No" : "";
      if (!attending) return json_({ ok: false, error: "attending" });
      const guests = attending === "Yes" ? Math.min(10, Math.max(1, parseInt(d.guests, 10) || 1)) : 0;
      sheet_("RSVPs").appendRow([now, name, attending, guests, clean_(d.phone, 20), clean_(d.message, 300)]);
      return json_({ ok: true });
    }

    if (d.type === "blessing") {
      const name = clean_(d.name, 40);
      const message = clean_(d.message, 300);
      if (name.length < 2 || message.length < 10) return json_({ ok: false, error: "invalid" });
      sheet_("Blessings").appendRow([now, name, message, false]);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: "type" });
  } catch (err) {
    return json_({ ok: false, error: "server" });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.type === "content") {
    return json_({ content: readContent_() });
  }
  if (e && e.parameter && e.parameter.type === "blessings") {
    const rows = sheet_("Blessings").getDataRange().getValues().slice(1);
    const approved = rows
      .filter(function (r) { return r[3] === true; })
      .slice(-50)
      .map(function (r) { return { name: String(r[1]), message: String(r[2]) }; });
    return json_({ blessings: approved });
  }
  return json_({ ok: true });
}
