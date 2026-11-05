/**
 * Storage for the wedding site: RSVPs + moderated blessings, kept in this Google Sheet.
 * See SETUP.md for the 5-minute deploy steps.
 *
 *  - POST {type:"rsvp"|"blessing", ...}  appends a row (blessings start Approved = FALSE)
 *  - GET  ?type=blessings                returns only rows where Approved is ticked
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

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const now = new Date();

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
