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
