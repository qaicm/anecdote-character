# Anecdote to Character

A lightweight web app for teachers to turn anecdotal records into character descriptions and character reports, based on the school's five values (Faithful, Akhlaq-Adab, Intelligence, Independence, Leadership) and their 23 sub-values.

**Workflow**

1. **Anecdotal records** — date, time, location, what happened, how it ended, tagged with one sub-value as a strength or an area for development.
2. **Character description** — strengths, areas for development and recommendations, drafted from the records.
3. **Character report** — grades for the five values, Social and Spiritual narratives, an automatic quality check, and PDF or Word download.

**Architecture**

- Frontend: static HTML, CSS and JavaScript hosted on GitHub Pages (this repository).
- Backend: Google Apps Script web app with Google Sheets as the database (not stored in this repository).
- `js/config.js` holds the only setting: the Apps Script `/exec` URL. Until it is set, the app runs in demo mode and stores data in the browser.

See **PANDUAN-INSTALASI.md** for installation instructions (in Indonesian).
