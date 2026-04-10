# Budget Before Payday

A tiny mobile-first web app for planning the current period before the next payday.

It lets the user set:

- next payday date
- budget before next payday
- need budget
- want budget

Then it shows:

- total budget
- spent so far
- left before payday
- need used and left
- want used and left

Expenses are stored locally in the browser with `localStorage`, along with the saved pay-period plan. There is no signup, backend, or database.

## Project structure

- `index.html` contains the budget setup UI, dashboard, progress ring, and expense history layout.
- `styles.css` contains the mobile-first styling for the dashboard, progress ring, forms, and lists.
- `app.js` contains the budget calculations, bucket tracking, `localStorage` persistence, and expense history behavior.
- `site.webmanifest` contains install metadata for the static web app.
- `icons/` contains placeholder icons for the installed web app.

## Run locally

```bash
cd "/Users/sheldontenzin/Documents/New project"
python3 -m http.server 4173
```

Then open:

`http://localhost:4173`
