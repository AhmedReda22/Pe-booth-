# PE Booth · Connect Your Voice

Single-screen activation for the PE Booth (Stellar MEA × Boehringer Ingelheim), for a landscape touch LCD.

## Flow (as briefed)

1. **Start screen:** world map and "Choose Where to Connect Your Voice". The visitor taps to start.
2. **Consent:** the full consent text from the brief, a tick box and a finger signature ("by signing below"). The visitor cannot go on without both. **Back** returns to the start screen and nothing is saved.
3. **Details:** Name (required), Email (required, checked), Phone (optional). An on-screen keyboard opens. It has an Arabic layout (ع) for the name field and a number pad for the phone field.
4. **Country and choice:** "Choose Your Country" opens a touch list with search; Egypt and the region come first. "Choose Where To Connect Your Voice" offers **CRM / Stroke / ILD / Others**. If the visitor picks Others, they must type their choice.
5. **Thank you**, then back to the start screen after 9 seconds.

If nobody touches the screen for 75 seconds mid-way, the booth returns to the start screen and the unfinished entry is discarded.

## The data (important)

- Every completed entry is saved **on the booth PC itself**, inside Chrome (IndexedDB, with a second copy in local storage). Nothing is sent anywhere unless an online backup address is set in `content.js` → `sync.url`.
- Each record holds: date and time, name, email, phone, country, choice, the text typed for Others, consent (yes) and its time, the signature image, the event name, the device code and a record ID.
- **Export it from the staff panel:** hold the **top-left corner** of the screen for 2 seconds and enter the PIN (`2026`, change it in `content.js` → `rules.staffPin`).
  - **Export Excel (CSV):** opens in Excel. Arabic names display correctly.
  - **Export full backup:** a JSON file with everything, including the signatures.
  - **Export consent forms:** an HTML page with every record and its signature, printable to PDF.
- Files are saved to the PC's **Downloads** folder.
- **Export at the end of each day** and copy the files to a USB stick. Always open the booth the same way, from the same address and with `start-booth.bat`: the data belongs to that address and Chrome profile.
- If there are two booth PCs, each one keeps its own records. Export from both; the device code in each row tells them apart.
- **Delete all data** in the staff panel asks twice. Use it only after the files have been handed over.

## Running it at the event

**Simplest (no internet):** copy this folder to the booth PC (Windows, Google Chrome) and double-click `start-booth.bat`. It opens the booth full screen from the folder. To quit: **Alt + F4**.

**From the web:** deploy this folder to Vercel and open `https://<your-site>/#screen` (put the address in `start-booth.bat` → `SITE`). `https://<your-site>/` is the review page.

Before the event: the screen must accept touch (a touch LCD, or an IR touch frame on a TV). Turn off sleep, screen saver, notifications and automatic updates.

## Editing (`content.js`)

Texts, the consent text, the country list, timings, the PIN, the signature requirement (`rules.requireSignature`) and the keyboard (`rules.keyboard`: `builtin` for a touch LCD, `system` for a tablet's own keyboard). Lines marked `// UI COPY` still need Stellar / BI approval.

## Files

`index.html` · `app.js` engine · `content.js` texts and rules · `style.css` · `fonts.css` embedded font (Inter, SIL OFL) · `sw.js` offline cache · `start-booth.bat` · `assets/`.
