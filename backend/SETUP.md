# Connect storage (Google Sheets)

RSVPs and blessings are saved to a Google Sheet you own. Takes about 5 minutes.

1. Create a new Google Sheet (name it e.g. "Wedding responses").
2. Menu **Extensions → Apps Script**. Delete the sample code, paste the whole of
   `google-apps-script.gs` from this folder, and save.
3. Click **Deploy → New deployment → type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click Deploy and approve the permission prompts. Copy the **Web app URL**.
4. In the project root, copy `.env.example` to `.env` and set
   `VITE_API_URL=<the Web app URL>`. Restart `npm run dev` (and rebuild before deploying).
5. Submit a test RSVP and a test blessing on the site. Two tabs ("RSVPs", "Blessings")
   are created automatically on the first submission.

## Edit panel (change text, photos and illustrations without code)

6. In the Apps Script editor: **Project Settings (gear) → Script properties → Add property**
   `ADMIN_KEY` = a password only the editors know. Save.
7. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.**
   Approve the new permission prompt: the script now needs Google Drive to store uploaded photos.
8. Open the site with `?edit` at the end of the address (e.g. `https://your-site/?edit`), enter the
   password, change anything, press **Preview** to check it, then **Publish**.

Published content is kept in a "Content" tab of the Sheet (do not edit it by hand). Uploaded
photos go to a Drive folder "Wedding site photos" and are shared as view-only links.

## Moderating blessings

New blessings arrive with the **Approved** box unticked and are NOT shown publicly.
Tick the box on a row and it appears on the wall (the site shows the latest 50 approved).

## Notes

- If you edit the script later, use **Deploy → Manage deployments → Edit → New version**;
  the URL stays the same.
- "Anyone" access only lets people submit and read approved blessings through this script.
  The Sheet itself stays private to you.
- Without `VITE_API_URL` the site falls back to local-only storage in each guest's
  browser, and nothing reaches you.
