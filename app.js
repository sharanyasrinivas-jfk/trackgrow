/* Meeraq Grow – learning tracker. Plain JS, no build step. Data lives in localStorage. */
const $ = (s) => document.querySelector(s), $$ = (s) => [...document.querySelectorAll(s)];
const KEY = "meeraq-grow-v1", iso = (d) => d.toLocaleDateString("sv"), today = () => iso(new Date());
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const fresh = () => ({ xp: 0, subjects: ["Math", "Science", "English", "Coding"], tasks: [], goals: [], sessions: [], marks: [], log: {} });
let S; try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY))); } catch { S = fresh(); }

// ---------- XP, levels, streaks ----------
const lvlOf = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;           // level n starts at 50*(n-1)^2 XP
const STAGES = [[1, "Seed"], [2, "Sprout"], [3, "Sapling"], [5, "Young tree"], [8, "Mature tree"], [12, "Fruit tree"]];
let toastTimer, levelUp = false;
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2300); }
function addXP(n, why) {
  const before = lvlOf(S.xp); S.xp = Math.max(0, S.xp + n);
  const d = (S.log[today()] ??= { xp: 0, min: 0 }); d.xp = Math.max(0, d.xp + n);
  if (lvlOf(S.xp) > before) { levelUp = true; toast(`Level up! You are now level ${lvlOf(S.xp)} 🌳`); }
  else if (why) toast(`${n > 0 ? "+" : ""}${n} XP · ${why}`);
}
function streak() {
  const active = (k) => S.log[k] && (S.log[k].xp > 0 || S.log[k].min > 0);
  const d = new Date(); let n = 0;
  if (!active(iso(d))) d.setDate(d.getDate() - 1);                   // today not done yet: streak is still alive
  while (active(iso(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const minsFor = (sub, wk) => S.sessions.filter((s) => s.subject === sub && s.date >= wk).reduce((a, s) => a + s.min, 0);
function checkGoals() {
  const wk = weekStart();
  S.goals.forEach((g) => { if (g.paid !== wk && minsFor(g.subject, wk) >= g.hours * 60) { g.paid = wk; addXP(50, `goal reached: ${g.subject}`); } });
}
const save = () => { localStorage.setItem(KEY, JSON.stringify(S)); render(); };

// ---------- charts (inline SVG) ----------
function bars(vals, labels, color) {
  const W = 320, H = 130, mx = Math.max(...vals, 1), bw = W / vals.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 20}">` + vals.map((v, i) => {
    const h = (v / mx) * H;
    return `<rect x="${i * bw + 7}" y="${H - h}" width="${bw - 14}" height="${h}" rx="4" fill="${color}"><title>${labels[i]}: ${v}</title></rect>` +
      `<text x="${i * bw + bw / 2}" y="${H + 15}" text-anchor="middle">${labels[i]}</text>`;
  }).join("") + "</svg>";
}
function line(vals, tips) {
  if (vals.length < 2) return '<p class="muted">Save two or more marks to see your trend.</p>';
  const W = 320, H = 130, x = (i) => 12 + (i * (W - 24)) / (vals.length - 1), y = (v) => H - (v / 100) * H + 5;
  const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 15}"><line x1="0" x2="${W}" y1="${y(50)}" y2="${y(50)}" stroke="#dfe6d8" stroke-dasharray="4"/>` +
    `<polyline points="${pts}" fill="none" stroke="#3f8f4e" stroke-width="3" stroke-linejoin="round"/>` +
    vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#f2b632" stroke="#fff" stroke-width="2"><title>${esc(tips[i])}</title></circle>`).join("") +
    `<text x="2" y="${y(100) + 10}">100%</text><text x="2" y="${y(50) - 3}">50%</text></svg>`;
}
const lastDays = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d; });

// ---------- the tree ----------
function renderTree() {
  const L = lvlOf(S.xp), p = Math.min(L, 14), alive = streak() > 0 || S.xp === 0;
  let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;   // seeded: tree keeps its shape as it grows
  let g = `<circle cx="245" cy="55" r="26" fill="var(--sun)"/><path d="M0 262Q150 240 300 262V300H0Z" fill="#8fbf7a"/><ellipse cx="150" cy="268" rx="${40 + p * 4}" ry="9" fill="#6f9a5f"/>`;
  if (L < 2) g += `<ellipse cx="150" cy="262" rx="9" ry="6" fill="var(--bark)"/>`;
  else {
    const th = 26 + p * 9, w = 3 + p * 0.8, top = 266 - th, R = 12 + p * 3.6, n = Math.min(3 + p * 3, 54);
    const cols = alive ? ["#3f8f4e", "#58a85f", "#2f7a43"] : ["#a3a74e", "#b9b45a", "#8d9344"];
    g += `<path d="M${150 - w} 268L${150 - w * 0.55} ${top}L${150 + w * 0.55} ${top}L${150 + w} 268Z" fill="var(--bark)"/>`;
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.283, d = Math.sqrt(rnd()) * R * 1.15;
      g += `<circle cx="${(150 + Math.cos(a) * d * 1.2).toFixed(1)}" cy="${(top - R * 0.3 + Math.sin(a) * d * 0.9).toFixed(1)}" r="${(8 + rnd() * 7 + p * 0.8).toFixed(1)}" fill="${cols[i % 3]}" opacity=".92"/>`;
    }
    if (L >= 8) for (let i = 0; i < Math.min(L - 5, 14); i++) {
      const a = rnd() * 6.283, d = Math.sqrt(rnd()) * R;
      g += `<circle cx="${(150 + Math.cos(a) * d * 1.2).toFixed(1)}" cy="${(top - R * 0.3 + Math.sin(a) * d * 0.9).toFixed(1)}" r="4.5" fill="${i % 2 ? "var(--coral)" : "var(--sun)"}"/>`;
    }
  }
  const tree = $("#tree"); tree.innerHTML = g;
  if (levelUp) { tree.classList.remove("pop"); void tree.getBoundingClientRect(); tree.classList.add("pop"); levelUp = false; }
  const name = [...STAGES].reverse().find(([l]) => L >= l)[1], next = STAGES.find(([l]) => l > L);
  $("#stage").textContent = `${name} · Level ${L}`;
  $("#next").textContent = (alive ? "" : "Your tree needs water – finish a quest or study today to revive it. ") +
    (next ? `Grows into a ${next[1].toLowerCase()} at level ${next[0]}.` : "Fully grown – keep it thriving!");
}
function renderHeader() {
  const L = lvlOf(S.xp), lo = 50 * (L - 1) ** 2, hi = 50 * L * L;
  $("#lvl").textContent = L; $("#streak").textContent = streak();
  $("#xpfill").style.width = ((S.xp - lo) / (hi - lo)) * 100 + "%";
  $("#xptxt").textContent = `${S.xp - lo} / ${hi - lo} XP to level ${L + 1}`;
  $("#heat").innerHTML = lastDays(35).map((d) => {
    const x = S.log[iso(d)], v = (x?.xp || 0) + (x?.min || 0), l = v === 0 ? 0 : v < 20 ? 1 : v < 50 ? 2 : v < 100 ? 3 : 4;
    return `<i class="h${l}" title="${iso(d)}: ${x?.xp || 0} XP, ${x?.min || 0} min"></i>`;
  }).join("");
}

// ---------- sections ----------
function renderTasks() {
  const t = today(), list = S.tasks.filter((x) => !x.done || x.date === t);   // unfinished tasks carry over
  $("#tasklist").innerHTML = list.length ? list.map((x) =>
    `<li class="${x.done ? "done" : ""}"><label><input type="checkbox" data-t="${x.id}" ${x.done ? "checked" : ""}><span>${esc(x.text)}</span></label><em class="chip">${esc(x.subject)}</em><b>+${x.xp}</b><button class="x" data-del="${x.id}" aria-label="Delete task">×</button></li>`).join("")
    : '<li class="muted">No quests yet. Add one to start growing your tree.</li>';
  const d = S.tasks.filter((x) => x.date === t);
  $("#todaysum").textContent = `${d.filter((x) => x.done).length}/${d.length} done today`;
}
function renderGoals() {
  const wk = weekStart();
  $("#goallist").innerHTML = S.goals.length ? S.goals.map((g) => {
    const m = minsFor(g.subject, wk), p = Math.min(100, Math.round((m / (g.hours * 60)) * 100));
    return `<li><div><b>${esc(g.subject)}</b> · ${g.hours} h this week <span class="muted">(${(m / 60).toFixed(1)} h done)</span><div class="bar"><i style="width:${p}%"></i></div></div><em class="chip">${p >= 100 ? "✓ +50 XP" : p + "%"}</em><button class="x" data-gdel="${g.id}" aria-label="Delete goal">×</button></li>`;
  }).join("") : '<li class="muted">No goals yet. Pick a subject and a weekly target.</li>';
}
function renderMarks() {
  const ms = [...S.marks].sort((a, b) => a.date.localeCompare(b.date)), pc = (m) => Math.round((m.score / m.max) * 100);
  $("#marklist").innerHTML = ms.slice().reverse().slice(0, 8).map((m) =>
    `<li><div><b>${esc(m.title)}</b> <em class="chip">${esc(m.subject)}</em> <small class="muted">${m.date}</small></div><b>${m.score}/${m.max} · ${pc(m)}%</b><button class="x" data-mdel="${m.id}" aria-label="Delete mark">×</button></li>`).join("") || '<li class="muted">No marks saved yet.</li>';
  $("#markchart").innerHTML = line(ms.map(pc), ms.map((m) => `${m.title}: ${pc(m)}%`));
  const by = {}; ms.forEach((m) => (by[m.subject] ??= []).push(pc(m)));
  $("#avgs").innerHTML = Object.entries(by).map(([s, a]) => `<span class="chip">${esc(s)} avg ${Math.round(a.reduce((x, y) => x + y) / a.length)}%</span>`).join("");
}
function renderStats() {
  const days = lastDays(7), lab = days.map((d) => d.toLocaleDateString("en", { weekday: "short" }));
  $("#xpchart").innerHTML = bars(days.map((d) => S.log[iso(d)]?.xp || 0), lab, "#3f8f4e");
  $("#minchart").innerHTML = bars(days.map((d) => S.log[iso(d)]?.min || 0), lab, "#f2b632");
  const by = {}; S.sessions.forEach((s) => (by[s.subject] = (by[s.subject] || 0) + s.min));
  const mx = Math.max(1, ...Object.values(by));
  $("#subjchart").innerHTML = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([s, m]) =>
    `<div class="hb"><span>${esc(s)}</span><div class="bar"><i style="width:${(m / mx) * 100}%"></i></div><small>${(m / 60).toFixed(1)} h</small></div>`).join("") || '<p class="muted">Log a study session to see time by subject.</p>';
  const tot = S.sessions.reduce((a, s) => a + s.min, 0), avg = S.marks.length ? Math.round(S.marks.reduce((a, m) => a + (m.score / m.max) * 100, 0) / S.marks.length) + "%" : "–";
  $("#kpis").innerHTML = [["Total XP", S.xp], ["Level", lvlOf(S.xp)], ["Study time", (tot / 60).toFixed(1) + " h"], ["Quests done", S.tasks.filter((t) => t.done).length], ["Avg mark", avg]].map(([k, v]) => `<div><b>${v}</b>${k}</div>`).join("");
}
function render() {
  $$(".subj").forEach((s) => { const v = s.value; s.innerHTML = S.subjects.map((x) => `<option>${esc(x)}</option>`).join(""); if (S.subjects.includes(v)) s.value = v; });
  renderHeader(); renderTree(); renderTasks(); renderGoals(); renderMarks(); renderStats();
  if (!T) $("#clock").textContent = fmt($("#dur").value * 60000);
}

// ---------- study timer ----------
let T = null;
const fmt = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
function tick() { if (!T) return; const left = T.end - Date.now(); $("#clock").textContent = fmt(left); if (left <= 0) stopTimer(); }
function startTimer() { const m = +$("#dur").value; T = { start: Date.now(), end: Date.now() + m * 60000, subject: $("#tsub").value }; $("#startbtn").hidden = true; $("#stopbtn").hidden = false; tick(); }
function stopTimer() {
  if (!T) return;
  const m = Math.round((Math.min(Date.now(), T.end) - T.start) / 60000), sub = T.subject;
  T = null; $("#startbtn").hidden = false; $("#stopbtn").hidden = true;
  if (m >= 1) logStudy(sub, m); else { toast("Under a minute – not logged."); render(); }
}
function logStudy(subject, min) {
  S.sessions.push({ date: today(), min, subject });
  (S.log[today()] ??= { xp: 0, min: 0 }).min += min;
  addXP(min, `${min} min of ${subject}`); checkGoals(); save();
}
setInterval(tick, 1000);

// ---------- events ----------
const fd = (e) => Object.fromEntries(new FormData(e.target));
$("#taskform").onsubmit = (e) => { e.preventDefault(); const f = fd(e); S.tasks.push({ id: uid(), text: f.text.trim(), subject: f.subject, xp: +f.xp, done: false, date: today() }); e.target.reset(); save(); };
$("#goalform").onsubmit = (e) => { e.preventDefault(); const f = fd(e); S.goals.push({ id: uid(), subject: f.subject, hours: +f.hours }); e.target.reset(); checkGoals(); save(); };
$("#markform").onsubmit = (e) => { e.preventDefault(); const f = fd(e); S.marks.push({ id: uid(), subject: f.subject, title: f.title.trim(), score: +f.score, max: +f.max, date: f.date }); addXP(15, "mark saved"); e.target.reset(); $("#markform [name=max]").value = 100; $("#markform [name=date]").value = today(); save(); };
$("#logform").onsubmit = (e) => { e.preventDefault(); logStudy($("#tsub").value, Math.round(+fd(e).min)); e.target.reset(); };
$("#tasklist").onchange = (e) => { const t = S.tasks.find((x) => x.id === e.target.dataset.t); if (!t) return; t.done = e.target.checked; addXP(t.done ? t.xp : -t.xp, t.done ? "quest complete" : ""); save(); };
document.addEventListener("click", (e) => {
  const d = e.target.dataset || {};
  if (d.del) S.tasks = S.tasks.filter((x) => x.id !== d.del);
  else if (d.gdel) S.goals = S.goals.filter((x) => x.id !== d.gdel);
  else if (d.mdel) S.marks = S.marks.filter((x) => x.id !== d.mdel);
  else if (d.tab) { $$(".tab").forEach((t) => (t.hidden = t.id !== d.tab)); $$(".tabs button").forEach((b) => b.classList.toggle("on", b === e.target)); return; }
  else return;
  save();
});
$("#startbtn").onclick = startTimer; $("#stopbtn").onclick = stopTimer; $("#dur").onchange = () => { if (!T) render(); };
$("#addsub").onclick = () => { const n = (prompt("New subject name") || "").trim(); if (n && !S.subjects.includes(n)) { S.subjects.push(n); save(); } };
$("#export").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" })); a.download = "meeraq-grow-backup.json"; a.click(); };
$("#import").onchange = async (e) => { try { S = Object.assign(fresh(), JSON.parse(await e.target.files[0].text())); save(); toast("Backup restored"); } catch { toast("That file is not a valid backup."); } };
$("#reset").onclick = () => { if (confirm("Erase all progress?")) { S = fresh(); save(); } };
function demo() {
  S = fresh();
  for (let i = 13; i >= 0; i--) {
    if (i % 5 === 4) continue;                                       // a couple of rest days
    const d = new Date(); d.setDate(d.getDate() - i); const k = iso(d), m = 20 + ((i * 17) % 60), sub = S.subjects[i % 4], x = m + 10 * (1 + (i % 3));
    S.sessions.push({ date: k, min: m, subject: sub }); S.log[k] = { xp: x, min: m }; S.xp += x;
    if (i % 3 === 0) S.marks.push({ id: uid(), subject: sub, title: `Quiz ${14 - i}`, score: 55 + ((i * 7) % 25) + (14 - i), max: 100, date: k });
  }
  S.goals.push({ id: uid(), subject: "Math", hours: 3 });
  S.tasks.push({ id: uid(), text: "Revise chapter 4 notes", subject: "Science", xp: 20, done: false, date: today() }, { id: uid(), text: "Finish coding exercise", subject: "Coding", xp: 40, done: false, date: today() });
  save(); toast("Demo data loaded");
}
$("#demo").onclick = demo;
$("#markform [name=date]").value = today();
render();
