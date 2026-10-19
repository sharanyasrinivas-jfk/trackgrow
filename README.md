# Meeraq Grow – Habitica-inspired Learning Tracker

A student productivity web app: finish daily quests, hit study goals, keep a streak and
watch your **tree grow** as you earn XP. No build step, no dependencies.

## Run it
Open `index.html` in a browser (double-click), or serve the folder:
```bash
python -m http.server 8000     # then visit http://localhost:8000
```
Click **Load demo data** in the footer to see the charts filled in.

## Features
| Feature | How it works |
|---|---|
| Daily quests | Add tasks (Easy +10 / Medium +20 / Hard +40 XP). Unfinished ones carry over. |
| Study goals | Weekly hour targets per subject; reaching one gives +50 XP. |
| Study timer | 15–60 min timer (or log offline time). 1 minute = 1 XP. |
| Streaks | A day counts if you earn XP or study. Heatmap shows the last 5 weeks. |
| XP and levels | Level n starts at `50 × (n−1)²` XP. |
| Growing tree | Seed → Sprout → Sapling → Young → Mature → Fruit tree. Leaves turn yellow if your streak breaks. |
| Marks | Save test scores (+15 XP), see a trend line and subject averages. |
| Analytics | XP and minutes for 7 days, time by subject, totals. |
| Storage | Saved in the browser (`localStorage`). Export or import a JSON backup. |

## Files
```
index.html   page structure and forms
style.css    layout, theme, responsive rules
app.js       state, XP/streak logic, SVG tree and charts, events
```

## Make it yours
- Change XP rules in `addXP`, `logStudy` and the form options in `index.html`.
- Change level speed in `lvlOf` and the tree stages in `STAGES` (`app.js`).
- Colours are CSS variables at the top of `style.css`.

## Next steps for Meeraq
Add a Django or Node backend for accounts, teacher dashboards, class leaderboards and
cohort-wide analytics. The API-free data model in `app.js` (`S`) maps directly to database tables.

## Git
```bash
git remote add origin <your-repo-url>
git push -u origin main
```
