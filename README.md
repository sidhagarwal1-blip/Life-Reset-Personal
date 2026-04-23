# Life Reset Personal

This repo contains:

- `index.html` + `styles.css` + `app.js`: the hosted HTML app for daily use
- `mobile-app/`: an Expo scaffold for a future native version

The HTML app is the friend-ready version. It is designed to be published as a static site on GitHub Pages with no backend, no accounts, and no install required.

## What the hosted HTML app does

- 66-day onboarding and plan generation
- Real calendar-based daily progression
- Daily quests with XP and streaks
- Status labels for `Completed`, `Due today`, `Missed`, and `Upcoming`
- Journal and recent history
- Pomodoro timer
- Workout counter
- Guided breathing prompt
- Reminder settings for the browser version
- JSON export and import
- Reset all local data for a fresh start
- Clear save/storage status in the UI

## How your friend should use it

1. Open the website in the same browser each day.
2. Build a 66-day plan once.
3. Do the quests marked for today.
4. Save a journal entry if useful.
5. Export JSON weekly or before switching laptops or browsers.

Important:

- Data is stored in that browser on that laptop using `localStorage`
- It is not cloud synced
- Closing the browser is fine; clearing browser data is not
- Browser reminders only work while the page is open

## Local testing

Quick test:

1. Open `index.html` directly in a browser

Better test:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

Testing with a local server is closer to how GitHub Pages will serve it.

## Publish with GitHub Pages

If you are new to GitHub, use this flow:

1. Create a new GitHub repository.
2. Upload these root files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Commit to the `main` branch.
4. In GitHub, open:
   - `Settings`
   - `Pages`
5. Under `Build and deployment`:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
6. Save.
7. Wait for GitHub Pages to publish the site URL.

There is no build step for the HTML app.

## What files matter for the hosted version

- `index.html`: markup and structure
- `styles.css`: visual design
- `app.js`: storage, day logic, reminders, export/import

## Mobile app scaffold

The `mobile-app/` folder is still a scaffold for later work. It is not needed for GitHub Pages hosting.
