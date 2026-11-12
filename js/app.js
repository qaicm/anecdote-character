/*
 * app.js — antarmuka: login, daftar siswa, catatan anekdot, deskripsi, rapor, unduh, admin.
 */
const CFG = window.APP_CONFIG || {};
const S = { me: null, students: [], records: [], reports: [], teachers: [], cur: "" };
const $ = id => document.getElementById(id);
const pref = {
  get(k, d) { try { const v = localStorage.getItem("atc-pref-" + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("atc-pref-" + k, v); } catch (e) {} }
};

function toast(t) { const e = $("toast"); e.textContent = t; e.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("show"), 2600); }
function setSync(state, text) { const e = $("sync"); e.className = "sync" + (state === "ok" ? " ok" : state === "err" ? " err" : ""); e.innerHTML = state === "busy" ? `<span class="spin"></span> ${esc(text)}` : esc(text); }
function busy(btn, on, label) { if (!btn) return; if (on) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.textContent = label || "Please wait…"; } else { btn.disabled = false; if (btn.dataset.label) btn.textContent = btn.dataset.label; } }
/* two-step confirmation without browser dialogs */
function confirmClick(btn, label, fn) {
  if (btn.dataset.armed) { delete btn.dataset.armed; clearTimeout(btn._t); btn.textContent = btn.dataset.orig; fn(); return; }
  btn.dataset.armed = "1"; btn.dataset.orig = btn.textContent; btn.textContent = label;
  btn._t = setTimeout(() => { delete btn.dataset.armed; btn.textContent = btn.dataset.orig; }, 4000);
}

/* ---------- data accessors ---------- */
const toNote = r => ({ id: r.id, studentKey: r.studentKey, date: String(r.date || ""), time: r.time, loc: r.location, what: r.what, end: r.ending, aspect: r.subValue, type: r.type, by: r.teacherEmail || "" });
/* v1.2 permissions: everyone sees every student; homeroom teacher or admin edits the student and report; authors edit their own records */
const isAdmin = () => !!(S.me && S.me.role === "admin");
const canEditStudent = st => !!st && (API.LOCAL || isAdmin() || st.teacherEmail === S.me.email);
const canDeleteStudent = st => !!st && (API.LOCAL || isAdmin());
const canEditReport = st => canEditStudent(st) || (!!st && !!(S.settings && S.settings.trialMode));
const canEditRecord = n => API.LOCAL || isAdmin() || n.by === S.me.email;
const curStudent = () => S.students.find(s => s.id === S.cur) || null;
const curNotes = () => S.records.filter(r => r.studentKey === S.cur && SUB[r.subValue]).map(toNote).sort((a, b) => a.date.localeCompare(b.date));
function academicYear() { const d = new Date(), y = d.getFullYear(); return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`; }
function curReport() {
  let r = S.reports.find(x => x.studentKey === S.cur);
  if (!r && S.cur) {
    const m = new Date().getMonth();
    r = { studentKey: S.cur, academicYear: academicYear(), semester: m >= 6 ? "1" : "2", term: "1", place: pref.get("place", "Tangerang Selatan"), reportDate: todayISO(), grades: {}, social: "", spiritual: "", strengths: "", weaknesses: "", recommendations: "" };
    S.reports.push(r);
  }
  if (r && (typeof r.grades !== "object" || !r.grades)) r.grades = {};
  return r;
}
function reportData(student, rep, notes) {
  return { student, grades: gradesFor(notes, rep.grades), social: rep.social || "", spirit: rep.spiritual || "", year: rep.academicYear, sem: String(rep.semester || ""), term: String(rep.term || ""), place: rep.place, date: String(rep.reportDate || "") };
}

/* ---------- shared renderers ---------- */
function noteHTML(n, canDel) {
  return `<article class="note">
    <div class="meta"><span>${esc(sdate(n.date))}</span>${n.time ? `<span>· ${esc(n.time)}</span>` : ""}${n.loc ? `<span>· ${esc(n.loc)}</span>` : ""}${n.by && !API.LOCAL ? `<span>· by <span class="by">${esc(n.by === S.me.email ? "you" : teacherName(n.by))}</span></span>` : ""}</div>
    <p class="body">${esc(n.what)}</p>${n.end ? `<p class="end">${esc(n.end)}</p>` : ""}
    <div class="tagrow"><span class="tag">${esc(subLabel(n.aspect))}</span><span class="tag ${n.type}">${n.type === "k" ? "Strength" : "Area for development"}</span>
    ${canDel ? `<button class="del" data-del="${esc(n.id)}">Delete</button>` : ""}</div></article>`;
}
function sheetHTML(d) {
  const p = (c, t, txt) => `<div class="part ${c}"><h3>${t}</h3><p>${txt ? esc(txt) : '<span class="hint">Not yet written.</span>'}</p></div>`;
  return p("s", "Strengths", d.s) + p("w", "Areas for development", d.w) + p("g", "Recommendations", d.g);
}
function reportHTML(d, editable) {
  const rows = VALUES.map((v, i) => {
    const g = d.grades[v.id];
    return `<tr><td class="no">${i + 1}</td><td>${v.name}</td>${LEVELS.map(l => {
      const on = g.level === l, cls = "c" + (on && g.auto ? " auto" : "");
      return `<td class="${cls}">${editable ? `<button class="cell" data-ch="${v.name}" data-lv="${l}" aria-label="${v.name}: ${l}${on ? " (selected)" : ""}">${on ? "V" : ""}</button>` : (on ? "V" : "")}</td>`;
    }).join("")}</tr>`;
  }).join("");
  return `<div class="report">
  <table class="rhead"><tr><td class="k">Student's Name:</td><td class="v">${esc((d.student.name || "").toUpperCase())}</td><td class="k">Academic Year:</td><td>${esc(d.year)}</td></tr>
  <tr><td class="k">Student's ID:</td><td>${esc(d.student.studentId || "")}</td><td class="k">Semester:</td><td>${esc(d.sem)}</td></tr>
  <tr><td class="k">Grade:</td><td>${esc(d.student.grade || "")}</td><td class="k">Term:</td><td>${esc(d.term)}</td></tr></table>
  <table class="rgrade"><tr><th rowspan="2">No</th><th rowspan="2">Character</th><th colspan="4">Grading</th></tr>
  <tr>${LEVELS.map(l => `<th>${l}</th>`).join("")}</tr>${rows}</table>
  <div class="rnarr"><div class="h">Spiritual</div><div class="t">${esc(d.spirit)}</div></div>
  <div class="rnarr"><div class="h">Social</div><div class="t">${esc(d.social)}</div></div>
  <div class="rsign">${esc(d.place)}${d.place && d.date ? ", " : ""}${esc(longdate(d.date))}</div></div>`;
}

/* ---------- tabs ---------- */
let tab = "contoh";
function show(t) {
  if ((t === "desk" || t === "rapor") && !curStudent()) { toast("Please add or select a student first."); t = "catat"; }
  tab = t;
  document.querySelectorAll(".tab").forEach(b => { b.setAttribute("aria-selected", b.dataset.tab === t); if (b.dataset.tab === t && b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "nearest" }); });
  ["contoh", "catat", "desk", "rapor", "admin"].forEach(x => $("p-" + x).hidden = x !== t);
  if (t === "catat") renderStep1();
  if (t === "desk") renderDesk();
  if (t === "rapor") renderRapor();
  if (t === "admin") renderAdmin();
  updateProgress();
  window.scrollTo({ top: 0 });
}
/* stepper: tick a step when the selected student has data for it */
function updateProgress() {
  const st = curStudent(), r = st ? S.reports.find(x => x.studentKey === S.cur) : null;
  const done = {
    catat: !!st && curNotes().length > 0,
    desk: !!r && !!(r.strengths || r.weaknesses || r.recommendations),
    rapor: !!r && !!(r.social || r.spiritual)
  };
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("done", !!done[b.dataset.tab]));
}
document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => show(b.dataset.tab));
document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => show(b.dataset.go));

/* ---------- examples ---------- */
let exIdx = 0;
function renderEx() {
  $("exnav").innerHTML = EXAMPLES.map((e, i) => `<button class="exbtn" aria-pressed="${i === exIdx}" data-ex="${i}"><b>${e.student.name}</b><span>${e.student.cls} · ${e.label}</span></button>`).join("");
  $("exnav").querySelectorAll("[data-ex]").forEach(b => b.onclick = () => { exIdx = +b.dataset.ex; renderEx(); });
  const e = EXAMPLES[exIdx], st = { name: e.student.name, grade: e.student.cls, gender: e.student.gender, studentId: "" };
  $("exnotes").innerHTML = e.notes.map(n => noteHTML(n)).join("");
  $("exsheet").innerHTML = sheetHTML(e.desc);
  const d = reportData(st, { academicYear: academicYear(), semester: "1", term: "1", place: "Tangerang Selatan", reportDate: "2026-09-30", grades: {}, social: narrative(e.notes, st, "so"), spiritual: narrative(e.notes, st, "sp") }, e.notes);
  $("exreport").innerHTML = reportHTML(d, false);
}
$("useEx").onclick = async () => {
  const e = EXAMPLES[exIdx], btn = $("useEx");
  busy(btn, true, "Adding example…"); setSync("busy", "Saving");
  const r = await API.call("student.save", { name: e.student.name + " (Example)", grade: e.student.cls, gender: e.student.gender });
  if (!r.success) { busy(btn, false); setSync("err", "Not saved"); return toast(r.message); }
  S.students.push(r.data.student);
  for (const n of e.notes) {
    const x = await API.call("record.save", { studentKey: r.data.student.id, date: n.date, time: n.time, location: n.loc, what: n.what, end: n.end, subValue: n.aspect, type: n.type });
    if (x.success) S.records.push(x.data.record);
  }
  S.cur = r.data.student.id; pref.set("cur", S.cur);
  busy(btn, false); setSync("ok", "Saved"); cacheNow();
  toast(`${e.student.name} has been added as a practice student`); show("catat");
};
$("fw").innerHTML = VALUES.map(v => `<div class="fwv"><h3>${v.full}<small>${v.ar}</small></h3><p class="hint">${esc(v.focus)}</p><ul>${
  Object.values(SUB).filter(s => s.v === v.id).map(s => `<li><b>${s.n}</b> (${s.id}): ${esc(s.def)}</li>`).join("")}</ul></div>`).join("");

/* ---------- step 1: students ---------- */
function teacherName(email) { const t = S.teachers.find(x => x.email === email); return t ? t.name : email; }
const unitOf = st => st.unit || "";
function filteredStudents() {
  const fu = $("fUnit").value, fc = $("fClass").value, fo = API.LOCAL ? "" : $("fOwner").value;
  return S.students.filter(s => (!fu || (fu === "-" ? !unitOf(s) : unitOf(s) === fu)) && (!fc || s.grade === fc) &&
    (!fo || (fo === "@me" ? s.teacherEmail === S.me.email : s.teacherEmail === fo)));
}
function renderOwnerFilter() {
  $("fOwnerWrap").hidden = API.LOCAL;
  if (API.LOCAL) return;
  const cur = $("fOwner").dataset.init ? $("fOwner").value : pref.get("f-owner", "");
  const counts = {}; S.students.forEach(s => counts[s.teacherEmail] = (counts[s.teacherEmail] || 0) + 1);
  const mine = counts[S.me.email] || 0;
  const others = Object.keys(counts).filter(e => e !== S.me.email).sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
  $("fOwner").innerHTML = `<option value="">All teachers</option>` + (mine || !isAdmin() ? `<option value="@me">My homeroom students (${mine})</option>` : "") +
    others.map(e => `<option value="${esc(e)}">${esc(teacherName(e))} (${counts[e]})</option>`).join("");
  $("fOwner").value = [...$("fOwner").options].some(o => o.value === cur) ? cur : "";
  $("fOwner").dataset.init = "1";
}
function renderClassFilter() {
  const fu = $("fUnit").value, cur = $("fClass").value || pref.get("f-class", "");
  const classes = uniq(S.students.filter(s => !fu || (fu === "-" ? !unitOf(s) : unitOf(s) === fu)).map(s => s.grade).filter(Boolean)).sort(byClass);
  $("fClass").innerHTML = `<option value="">All classes</option>` + classes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  $("fClass").value = classes.includes(cur) ? cur : "";
}
function renderStudents() {
  if (!$("fUnit").dataset.init) { $("fUnit").value = pref.get("f-unit", ""); $("fUnit").dataset.init = "1"; }
  renderClassFilter(); renderOwnerFilter();
  const order = { MS: 1, HS: 2, "": 3 };
  const list = filteredStudents().sort((a, b) => (order[unitOf(a)] - order[unitOf(b)]) || byClass(a.grade, b.grade) || String(a.name).localeCompare(String(b.name)));
  $("stuCount").textContent = S.students.length ? (list.length === S.students.length ? `${list.length}` : `${list.length} of ${S.students.length}`) : "";
  $("stuSel").innerHTML = list.length
    ? list.map(s => `<option value="${esc(s.id)}">${esc(s.name)}${s.grade ? " · " + esc(s.grade) : ""}${unitOf(s) ? " · " + unitOf(s) : ""}${!API.LOCAL && s.teacherEmail !== S.me.email ? " · " + esc(teacherName(s.teacherEmail)) : ""}</option>`).join("")
    : `<option value="">${S.students.length ? "No students match the filter" : "No students yet"}</option>`;
  if (!list.some(s => s.id === S.cur)) S.cur = list[0] ? list[0].id : "";
  $("stuSel").value = S.cur;
  const st = curStudent();
  $("stuEdit").disabled = !canEditStudent(st);
  $("stuDel").hidden = !(API.LOCAL || isAdmin()); $("stuDel").disabled = !canDeleteStudent(st);
  $("movOpen").hidden = !isAdmin() || API.LOCAL;
  $("impOpen").hidden = !(isAdmin() || API.LOCAL);          // v1.2.1: import is for administrators only
  if ($("impOpen").hidden) $("impPanel").hidden = true;
  $("stuInfo").textContent = st ? [st.studentId && "ID " + st.studentId, st.grade && "Class " + st.grade, unitOf(st) ? `${unitOf(st)} · ${UNITS[unitOf(st)]}` : "Unit not set", st.gender === "m" ? "Male" : st.gender === "f" ? "Female" : "Gender not set", !API.LOCAL && ("Homeroom: " + (st.teacherEmail === S.me.email ? "you" : teacherName(st.teacherEmail)))].filter(Boolean).join(" · ")
    : S.students.length ? "Change the filter to see more students." : (isAdmin() || API.LOCAL ? "Add your first student, or import a class list from Excel." : "No students yet. Ask the administrator to import the student list, or add a practice student.");
  $("recordArea").classList.toggle("locked", !st);
  if (!S.students.length && $("stuForm").hidden && $("impPanel").hidden) openStudentForm(null);
}
$("fUnit").onchange = e => { pref.set("f-unit", e.target.value); $("fClass").value = ""; pref.set("f-class", ""); renderStep1(); };
$("fClass").onchange = e => { pref.set("f-class", e.target.value); renderStep1(); };
$("fOwner").onchange = e => { pref.set("f-owner", e.target.value); renderStep1(); };
$("stuSel").onchange = e => { S.cur = e.target.value; pref.set("cur", S.cur); $("stuForm").hidden = true; renderStep1(); };
function openStudentForm(st) {
  $("stuForm").hidden = false; $("stuMsg").textContent = "";
  $("stuFormTitle").textContent = st ? "Edit student" : "New student";
  $("impPanel").hidden = true; $("movPanel").hidden = true;
  $("sName").value = st ? st.name : ""; $("sId").value = st ? st.studentId : ""; $("sClass").value = st ? st.grade : ""; $("sGender").value = st ? st.gender : ""; $("sUnit").value = st ? unitOf(st) : ($("fUnit").value === "MS" || $("fUnit").value === "HS" ? $("fUnit").value : "");
  const isAdmin = S.me && S.me.role === "admin";
  $("sTeacherWrap").hidden = !isAdmin;
  if (isAdmin) {
    $("sTeacher").innerHTML = S.teachers.filter(t => t.active).map(t => `<option value="${esc(t.email)}">${esc(t.name)} (${esc(t.email)})</option>`).join("");
    $("sTeacher").value = st ? st.teacherEmail : S.me.email;
  }
  $("stuForm").dataset.id = st ? st.id : "";
  $("sName").focus();
}
$("stuNew").onclick = () => openStudentForm(null);
$("stuEdit").onclick = () => openStudentForm(curStudent());
$("stuCancel").onclick = () => { $("stuForm").hidden = true; };
$("stuForm").onsubmit = async e => {
  e.preventDefault();
  const data = { id: $("stuForm").dataset.id || "", name: $("sName").value.trim(), studentId: $("sId").value.trim(), grade: $("sClass").value.trim(), gender: $("sGender").value, unit: $("sUnit").value };
  if (!data.name) { $("stuMsg").textContent = "Please enter the student's name."; return; }
  if (S.me && S.me.role === "admin") data.teacherEmail = $("sTeacher").value;
  busy($("stuSave"), true, "Saving…"); setSync("busy", "Saving");
  const r = await API.call("student.save", data);
  busy($("stuSave"), false);
  if (!r.success) { setSync("err", "Not saved"); $("stuMsg").textContent = r.message; return; }
  const i = S.students.findIndex(s => s.id === r.data.student.id);
  if (i > -1) S.students[i] = r.data.student; else S.students.push(r.data.student);
  S.cur = r.data.student.id; pref.set("cur", S.cur);
  revealStudent(r.data.student);
  $("stuForm").hidden = true; setSync("ok", "Saved"); cacheNow(); toast(r.message || "Student saved"); renderStep1();
};
$("stuDel").onclick = () => {
  const st = curStudent(); if (!st) return;
  confirmClick($("stuDel"), "Delete student and all records?", async () => {
    setSync("busy", "Deleting");
    const r = await API.call("student.delete", { id: st.id });
    if (!r.success) { setSync("err", "Not deleted"); return toast(r.message); }
    S.students = S.students.filter(s => s.id !== st.id);
    S.records = S.records.filter(x => x.studentKey !== st.id);
    S.reports = S.reports.filter(x => x.studentKey !== st.id);
    S.cur = ""; setSync("ok", "Saved"); cacheNow(); toast("Student deleted"); renderStep1();
  });
};

/* keep a just-saved student visible under the current filters */
function revealStudent(st) {
  const fu = $("fUnit").value;
  if (fu && (fu === "-" ? unitOf(st) : unitOf(st) !== fu)) { $("fUnit").value = ""; pref.set("f-unit", ""); }
  if ($("fClass").value && $("fClass").value !== st.grade) { $("fClass").value = ""; pref.set("f-class", ""); }
  const fo = $("fOwner").value;
  if (fo && (fo === "@me" ? st.teacherEmail !== S.me.email : st.teacherEmail !== fo)) { $("fOwner").value = ""; pref.set("f-owner", ""); }
}

/* ---------- step 1: import students ---------- */
let IMP = [];
const isAdminUser = () => S.me && S.me.role === "admin";
function openImport() {
  $("stuForm").hidden = true; $("movPanel").hidden = true; $("impPanel").hidden = false;
  $("impAdmin").hidden = $("impTplTeacher").hidden = !isAdminUser();
  if (isAdminUser()) {
    $("impTeacher").innerHTML = `<option value="">Choose a homeroom teacher…</option>` + S.teachers.filter(t => t.active).map(t => `<option value="${esc(t.email)}">${esc(t.name)} (${esc(t.email)})${t.role === "admin" ? " · Administrator" : ""}</option>`).join("");
    $("impTeacher").value = "";
  }
  resetImport(); $("impPanel").scrollIntoView({ block: "nearest" });
}
function resetImport() {
  IMP = []; $("impFile").value = ""; $("impPaste").value = "";
  ["impErr", "impSummary", "impWrap", "impResult"].forEach(id => $(id).hidden = true);
  $("impGo").disabled = true; $("impGo").textContent = "Import"; $("impMsg").textContent = "";
}
$("impOpen").onclick = openImport;
$("impClose").onclick = () => { $("impPanel").hidden = true; renderStep1(); };
$("impTpl").onclick = async () => {
  busy($("impTpl"), true, "Preparing…");
  try { await Importer.template(isAdminUser()); toast("Template downloaded"); } catch (e) { toast(e.message); }
  busy($("impTpl"), false);
};
function impError(msg) { $("impErr").textContent = msg; $("impErr").hidden = false; $("impWrap").hidden = $("impSummary").hidden = true; $("impGo").disabled = true; }
function loadTable(table) {
  $("impErr").hidden = true; $("impResult").hidden = true;
  let parsed;
  try { parsed = Importer.toRows(table); } catch (e) { return impError(e.message); }
  if (!parsed.rows.length) return impError("The header row was found, but there are no student rows below it.");
  if (parsed.rows.length > 500) return impError(`The file has ${parsed.rows.length} rows. Import at most 500 students at a time; split the list into several files.`);
  IMP = parsed.rows; previewImport();
}
$("impFile").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  $("impPaste").value = ""; $("impMsg").textContent = "Reading the file…";
  try { loadTable(await Importer.readFile(f)); } catch (err) { impError(err.message); }
  $("impMsg").textContent = "";
};
$("impPaste").addEventListener("input", () => {
  clearTimeout(loadTable.t);
  loadTable.t = setTimeout(() => { if ($("impPaste").value.trim()) { $("impFile").value = ""; loadTable(Importer.parseText($("impPaste").value)); } else resetImport(); }, 300);
});
$("impTeacher").onchange = () => IMP.length && previewImport();

function previewImport() {
  const admin = isAdminUser();
  const active = new Set(S.teachers.filter(t => t.active).map(t => t.email));
  const byId = {}, byNG = {}, seen = {};
  S.students.forEach(s => { if (s.studentId) byId[String(s.studentId).toLowerCase()] = s; byNG[(s.name + "|" + s.grade).toLowerCase()] = s; });
  IMP.forEach(r => {
    r.errors = []; r.warns = [];
    r.gradeN = normGrade(r.grade); r.unitN = normUnit(r.unit, r.gradeN); r.genderN = normGender(r.gender);
    if (!r.name) r.errors.push("Student name is empty");
    if (r.unitN === null) r.errors.push(`Unit “${r.unit}” must be MS or HS`);
    else if (!r.unitN) r.warns.push("Unit not set");
    if (!r.genderN) r.warns.push(r.gender ? `Gender “${r.gender}” not recognised` : "Gender not set");
    if (admin && r.teacherEmail && !active.has(r.teacherEmail)) r.errors.push(`Teacher ${r.teacherEmail} not found`);
    const k = r.studentId ? "id:" + r.studentId.toLowerCase() : "ng:" + (r.name + "|" + r.gradeN).toLowerCase();
    if (r.name && seen[k]) r.errors.push(`Duplicate of line ${seen[k]}`); else if (r.name) seen[k] = r.line;
    r.match = (r.studentId && byId[r.studentId.toLowerCase()]) || byNG[(r.name + "|" + r.gradeN).toLowerCase()] || null;
    if (admin && !r.match && !r.teacherEmail && !$("impTeacher").value && !r.errors.length) r.errors.push("Choose a homeroom teacher above, or fill in the Teacher Email column");
  });
  const ok = IMP.filter(r => !r.errors.length), nNew = ok.filter(r => !r.match).length, nUpd = ok.length - nNew, nBad = IMP.length - ok.length;
  const units = { MS: ok.filter(r => r.unitN === "MS").length, HS: ok.filter(r => r.unitN === "HS").length };
  $("impSummary").innerHTML = `<span class="pill on">${nNew} new</span><span class="pill upd">${nUpd} to update</span>${nBad ? `<span class="pill off">${nBad} with errors (skipped)</span>` : ""}<span class="pill">${units.MS} MS · ${units.HS} HS</span>`;
  $("impSummary").hidden = false;
  const showT = admin;
  $("impTable").innerHTML = `<tr><th>Line</th><th>Student ID</th><th>Student name</th><th>Class</th><th>Unit</th><th>Gender</th>${showT ? "<th>Teacher</th>" : ""}<th>Status</th></tr>` +
    IMP.map(r => `<tr class="${r.errors.length ? "bad" : ""}"><td>${r.line}</td><td>${esc(r.studentId)}</td><td>${esc(r.name)}</td><td>${esc(r.gradeN)}</td><td>${esc(r.unitN || r.unit)}</td><td>${r.genderN === "m" ? "M" : r.genderN === "f" ? "F" : esc(r.gender)}</td>${showT ? `<td>${esc(r.teacherEmail || "(default)")}</td>` : ""}
      <td class="st">${r.errors.length ? `<span class="st-bad">Skipped</span><span class="st-warn">${esc(r.errors.join("; "))}</span>` : `<span class="${r.match ? "st-upd" : "st-new"}">${r.match ? "Update" : "New"}</span>${r.warns.length ? `<span class="st-warn">${esc(r.warns.join("; "))}</span>` : ""}`}</td></tr>`).join("");
  $("impWrap").hidden = false;
  $("impGo").disabled = !ok.length;
  $("impGo").textContent = ok.length ? `Import ${ok.length} student${ok.length > 1 ? "s" : ""}` : "Nothing to import";
}

$("impGo").onclick = async () => {
  const rows = IMP.filter(r => !r.errors.length).map(r => ({ line: r.line, studentId: r.studentId, name: r.name, grade: r.gradeN, unit: r.unitN || "", gender: r.genderN, teacherEmail: r.teacherEmail }));
  if (!rows.length) return;
  busy($("impGo"), true, "Importing…"); setSync("busy", "Importing");
  let created = 0, updated = 0, skipped = [], failed = "";
  for (let i = 0; i < rows.length; i += 200) {
    $("impMsg").textContent = rows.length > 200 ? `Importing ${Math.min(i + 200, rows.length)} of ${rows.length}…` : "";
    const r = await API.call("student.import", { rows: rows.slice(i, i + 200), teacherEmail: isAdminUser() ? $("impTeacher").value : "" });
    if (!r.success) { failed = r.message; break; }
    created += r.data.created; updated += r.data.updated; skipped = skipped.concat(r.data.skipped || []);
    (r.data.students || []).forEach(st => { const k = S.students.findIndex(x => x.id === st.id); if (k > -1) S.students[k] = st; else S.students.push(st); });
  }
  busy($("impGo"), false); $("impMsg").textContent = "";
  cacheNow();
  if (failed) { setSync("err", "Not saved"); impError(failed + (created + updated ? ` (${created + updated} students were saved before the error.)` : "")); return; }
  setSync("ok", "Saved");
  const bad = IMP.filter(r => r.errors.length).map(r => ({ line: r.line, name: r.name, reason: r.errors.join("; ") })).concat(skipped);
  $("impResult").innerHTML = `<div class="banner"><b>Import finished.</b> ${created} student${created === 1 ? "" : "s"} added, ${updated} updated${bad.length ? `, ${bad.length} skipped` : ""}.${bad.length ? `<ul style="margin:8px 0 0;padding-left:18px">${bad.map(b => `<li>Line ${b.line}${b.name ? " (" + esc(b.name) + ")" : ""}: ${esc(b.reason)}</li>`).join("")}</ul>` : ""}</div>`;
  $("impResult").hidden = false; $("impWrap").hidden = $("impSummary").hidden = true; $("impGo").disabled = true;
  IMP = []; $("impFile").value = ""; $("impPaste").value = "";
  toast(`${created} added, ${updated} updated`);
  renderStudents(); renderNotes();
};

/* ---------- step 1: move students (admin) ---------- */
function renderMove() {
  const list = filteredStudents();
  const f = [$("fUnit").value && ($("fUnit").value === "-" ? "Unit not set" : "Unit " + $("fUnit").value), $("fClass").value && "Class " + $("fClass").value, $("fOwner").value && "Homeroom " + ($("fOwner").value === "@me" ? "you" : teacherName($("fOwner").value))].filter(Boolean);
  $("movInfo").innerHTML = `<b>${list.length} student${list.length === 1 ? "" : "s"}</b> selected${f.length ? " (" + esc(f.join(", ")) + ")" : " (all students — use the filters to narrow the list)"}.`;
  $("movTable").innerHTML = `<tr><th>Student</th><th>Class</th><th>Unit</th><th>Current homeroom teacher</th></tr>` +
    list.slice(0, 300).map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.grade)}</td><td>${esc(unitOf(s))}</td><td>${esc(teacherName(s.teacherEmail))}</td></tr>`).join("") +
    (list.length > 300 ? `<tr><td colspan="4" class="hint">…and ${list.length - 300} more</td></tr>` : "");
  const t = $("movTeacher").value;
  $("movGo").disabled = !list.length || !t;
  $("movGo").textContent = t ? `Move ${list.length} student${list.length === 1 ? "" : "s"} to ${teacherName(t)}` : "Choose the new homeroom teacher";
}
$("movOpen").onclick = () => {
  $("stuForm").hidden = true; $("impPanel").hidden = true; $("movPanel").hidden = false;
  $("movTeacher").innerHTML = `<option value="">Choose a teacher…</option>` + S.teachers.filter(t => t.active).map(t => `<option value="${esc(t.email)}">${esc(t.name)} (${esc(t.email)})</option>`).join("");
  renderMove();
};
$("movClose").onclick = () => { $("movPanel").hidden = true; };
$("movTeacher").onchange = renderMove;
$("movGo").onclick = () => {
  const ids = filteredStudents().map(s => s.id), t = $("movTeacher").value;
  if (!ids.length || !t) return;
  confirmClick($("movGo"), `Confirm: move ${ids.length} student${ids.length === 1 ? "" : "s"}`, async () => {
    busy($("movGo"), true, "Moving…"); setSync("busy", "Saving");
    const r = await API.call("student.move", { ids, teacherEmail: t });
    busy($("movGo"), false);
    if (!r.success) { setSync("err", "Not saved"); renderMove(); return toast(r.message); }
    (r.data.students || []).forEach(st => { const k = S.students.findIndex(x => x.id === st.id); if (k > -1) S.students[k] = st; });
    setSync("ok", "Saved"); cacheNow(); toast(r.message);
    renderStep1();
  });
};

/* ---------- step 1: time & location (preset options + own entry) ---------- */
const PRESETS = {
  nTime: ["Arrival", "Morning assembly", "Lesson", "Group work", "Break time", "Lunch", "Congregational prayer", "Extracurricular", "Dismissal"],
  nLoc: ["Classroom", "Prayer room", "Library", "Laboratory", "Canteen", "Sports field", "Hall", "Corridor", "Online class"]
};
const OWN = "__own__";
const ownList = id => { try { return JSON.parse(pref.get("own-" + id, "[]")) || []; } catch (e) { return []; } };
function renderCombo(id, keep) {
  const sel = $(id + "Sel"), own = ownList(id).filter(v => !PRESETS[id].includes(v));
  sel.innerHTML = `<option value="">Select…</option>` + PRESETS[id].map(v => `<option>${esc(v)}</option>`).join("") +
    (own.length ? `<optgroup label="Your entries">${own.map(v => `<option>${esc(v)}</option>`).join("")}</optgroup>` : "") +
    `<option value="${OWN}">Other (type your own)…</option>`;
  const v = keep !== undefined ? keep : $(id).value;
  if (!v) { sel.value = ""; $(id).hidden = true; }
  else if ([...sel.options].some(o => o.value === v)) { sel.value = v; $(id).hidden = true; }
  else { sel.value = OWN; $(id).hidden = false; }
  $(id).value = v || "";
}
function rememberOwn(id) {
  const v = $(id).value.trim();
  if (!v || PRESETS[id].includes(v)) return;
  const list = [v].concat(ownList(id).filter(x => x.toLowerCase() !== v.toLowerCase())).slice(0, 8);
  pref.set("own-" + id, JSON.stringify(list));
  renderCombo(id, v);
}
["nTime", "nLoc"].forEach(id => {
  $(id + "Sel").onchange = e => {
    if (e.target.value === OWN) { $(id).value = ""; $(id).hidden = false; $(id).focus(); }
    else { $(id).value = e.target.value; $(id).hidden = true; }
    checkNote();
  };
  renderCombo(id, "");
});

/* ---------- step 1: records ---------- */
$("nAspect").innerHTML = VALUES.map(v => `<optgroup label="${v.full}">${Object.entries(SUB).filter(([k, s]) => s.v === v.id).map(([k, s]) => `<option value="${k}">${s.n} (${s.id})</option>`).join("")}</optgroup>`).join("");
function aspHint() { const s = SUB[$("nAspect").value], v = VAL[s.v]; $("aspHint").innerHTML = `<b>${esc(s.n)}:</b> ${esc(s.def)} This record contributes to the <b>${v.name}</b> grade and the <b>${v.sec === "sp" ? "Spiritual" : "Social"}</b> narrative.`; }
$("nAspect").onchange = aspHint;
const NF = ["nDate", "nTime", "nLoc", "nWhat", "nEnd"], NL = ["Date", "Time", "Location", "What happened", "How it ended"];
function checkNote() {
  $("anat").innerHTML = NF.map((id, i) => `<span class="chip ${$(id).value.trim() ? "on" : ""}">${$(id).value.trim() ? "✓ " : ""}${NL[i]}</span>`).join("");
  const txt = ($("nWhat").value + " " + $("nEnd").value).toLowerCase();
  const hit = JUDGE.filter(w => new RegExp("\\b" + w + "\\b").test(txt));
  $("judge").hidden = !hit.length;
  if (hit.length) $("judge").innerHTML = `The word${hit.length > 1 ? "s" : ""} <b>${hit.map(esc).join(", ")}</b> ${hit.length > 1 ? "are judgements" : "is a judgement"}. Describe what the student did or said instead, for example “kicked the blocks and cried” rather than “naughty”.`;
}
NF.forEach(id => $(id).addEventListener("input", checkNote));
$("addNote").onclick = async () => {
  if (!curStudent()) return toast("Please add or select a student first.");
  const n = { studentKey: S.cur, date: $("nDate").value, time: $("nTime").value.trim(), location: $("nLoc").value.trim(), what: $("nWhat").value.trim(), end: $("nEnd").value.trim(), subValue: $("nAspect").value, type: document.querySelector('input[name="nType"]:checked').value };
  if (!n.date || !n.what) { $("addMsg").textContent = "Please enter at least the date and what happened."; return; }
  busy($("addNote"), true, "Saving…"); setSync("busy", "Saving");
  const r = await API.call("record.save", n);
  busy($("addNote"), false);
  if (!r.success) { setSync("err", "Not saved"); $("addMsg").textContent = r.message; return; }
  S.records.push(r.data.record);
  rememberOwn("nTime"); rememberOwn("nLoc");
  ["nWhat", "nEnd"].forEach(id => $(id).value = ""); $("addMsg").textContent = "";
  setSync("ok", "Saved"); cacheNow(); checkNote(); renderNotes(); updateProgress(); toast("Record saved");
};
function renderNotes() {
  const st = curStudent(), notes = curNotes();
  $("notesTitle").textContent = st ? `Records for ${st.name}` : "Records";
  const c = notes.length, vals = uniq(notes.map(n => SUB[n.aspect].v)).length;
  $("noteCount").textContent = c ? `${c} record${c > 1 ? "s" : ""} · ${vals} of 5 values covered${c < 3 ? " · at least 3 recommended" : ""}` : "";
  $("myNotes").innerHTML = c ? notes.map(n => noteHTML(n, canEditRecord(n))).join("") : `<div class="empty" style="grid-column:1/-1">No records yet for this student. Write the first record above, or open <b>Examples</b> to see how records are written.</div>`;
  $("myNotes").querySelectorAll("[data-del]").forEach(b => b.onclick = () => confirmClick(b, "Confirm delete", async () => {
    setSync("busy", "Deleting");
    const r = await API.call("record.delete", { id: b.dataset.del });
    if (!r.success) { setSync("err", "Not deleted"); return toast(r.message); }
    S.records = S.records.filter(x => x.id !== b.dataset.del); setSync("ok", "Saved"); cacheNow(); renderNotes(); updateProgress();
  }));
}
function renderStep1() { renderStudents(); renderNotes(); if (!$("movPanel").hidden) renderMove(); updateProgress(); }

/* ---------- report saving (debounced) ---------- */
let saveT = null, saving = Promise.resolve();
function queueSave() { updateProgress(); setSync("busy", "Unsaved changes"); clearTimeout(saveT); saveT = setTimeout(saveReport, 900); }
function saveReport() {
  clearTimeout(saveT); updateProgress();
  const r = curReport(); if (!r) return Promise.resolve();
  const payload = { studentKey: r.studentKey, academicYear: r.academicYear, semester: r.semester, term: r.term, place: r.place, reportDate: r.reportDate, grades: r.grades, social: r.social, spiritual: r.spiritual, strengths: r.strengths, weaknesses: r.weaknesses, recommendations: r.recommendations };
  setSync("busy", "Saving");
  saving = saving.then(() => API.call("report.save", payload)).then(res => {
    if (res.success) { setSync("ok", "Saved"); cacheNow(); } else { setSync("err", "Not saved"); toast(res.message); }
  });
  return saving;
}
window.addEventListener("beforeunload", e => { if (saveT) { saveReport(); e.preventDefault(); e.returnValue = ""; } });

/* ---------- step 2 ---------- */
function renderDesk() {
  const st = curStudent(), notes = curNotes(), rep = curReport();
  $("deskTitle").textContent = `Character description: ${first(st.name)}`;
  const k = notes.filter(n => n.type === "k").length, p = notes.length - k;
  $("evCount").textContent = notes.length ? `${k} strength${k !== 1 ? "s" : ""} · ${p} area${p !== 1 ? "s" : ""} for development` : "";
  $("evList").innerHTML = notes.length ? notes.map(n => `<div class="evi"><span class="dot ${n.type}"></span><div><div class="d">${esc(sdate(n.date))} · ${esc(subLabel(n.aspect))}${n.by && !API.LOCAL ? " · " + esc(n.by === S.me.email ? "you" : teacherName(n.by)) : ""}</div>${esc(n.what)}</div></div>`).join("")
    : `<div class="empty">No records yet. Return to <b>Step 1</b> to write anecdotal records.</div>`;
  const ed = canEditReport(st);
  $("draft").disabled = !notes.length || !ed;
  ["dS", "dW", "dG"].forEach(id => $(id).readOnly = !ed);
  const trial = ed && !canEditStudent(st);
  $("deskLock").hidden = ed && !trial;
  if (trial) $("deskLock").innerHTML = `<b>Trial mode.</b> You can edit this description for practice. The homeroom teacher of ${esc(st.name)} is ${esc(teacherName(st.teacherEmail))}.`;
  if (!ed) $("deskLock").innerHTML = `<b>View only.</b> The character description of ${esc(st.name)} is written by the homeroom teacher, ${esc(teacherName(st.teacherEmail))}, or an administrator. Your anecdotal records are included automatically.`;
  $("dS").value = rep.strengths || ""; $("dW").value = rep.weaknesses || ""; $("dG").value = rep.recommendations || "";
  const warn = [];
  if (notes.length && !k) warn.push("There are no strengths recorded yet. Every student has strengths; observe again and record at least one.");
  if (notes.length && !p) warn.push("There are no areas for development recorded, so the weaknesses and recommendations will be limited.");
  $("deskWarn").hidden = !warn.length; $("deskWarn").textContent = warn.join(" ");
}
[["dS", "strengths"], ["dW", "weaknesses"], ["dG", "recommendations"]].forEach(([id, k]) => $(id).addEventListener("input", e => { curReport()[k] = e.target.value; queueSave(); }));
$("draft").onclick = () => {
  const rep = curReport();
  const go = () => { const d = draftDescription(curNotes(), curStudent()); rep.strengths = d.s; rep.weaknesses = d.w; rep.recommendations = d.g; renderDesk(); saveReport(); toast("Draft ready; please revise it"); };
  if (rep.strengths || rep.weaknesses || rep.recommendations) confirmClick($("draft"), "Overwrite the current text? Select again", go); else go();
};

/* ---------- step 3 ---------- */
const RF = [["rYear", "academicYear"], ["rSem", "semester"], ["rTerm", "term"], ["rPlace", "place"], ["rDate", "reportDate"], ["rSocial", "social"], ["rSpirit", "spiritual"]];
RF.forEach(([id, k]) => $(id).addEventListener("input", e => { curReport()[k] = e.target.value; if (k === "place") pref.set("place", e.target.value); queueSave(); renderReport(); }));
$("rTeacher").addEventListener("input", e => { pref.set("teacher-name", e.target.value); if (S.cur) pref.set("teacher-name-" + S.cur, e.target.value); });
$("narr").onclick = () => {
  const rep = curReport();
  const go = () => { const st = curStudent(), notes = curNotes(); rep.social = narrative(notes, st, "so"); rep.spiritual = narrative(notes, st, "sp"); renderRapor(); saveReport(); toast("Narratives drafted; please revise them"); };
  if (rep.social || rep.spiritual) confirmClick($("narr"), "Overwrite the current narratives? Select again", go); else go();
};
function renderRapor() {
  const rep = curReport();
  const st = curStudent(), ed = canEditReport(st);
  RF.forEach(([id, k]) => { $(id).value = rep[k] || ""; $(id).readOnly = !ed; });
  $("rDate").disabled = !ed;
  $("rTeacher").value = pref.get("teacher-name-" + st.id, API.LOCAL ? pref.get("teacher-name", "") : teacherName(st.teacherEmail));
  $("narr").disabled = !curNotes().length || !ed;
  const trial = ed && !canEditStudent(st);
  $("raporLock").hidden = ed && !trial;
  if (trial) $("raporLock").innerHTML = `<b>Trial mode.</b> You can edit this report for practice. The homeroom teacher of ${esc(st.name)} is ${esc(teacherName(st.teacherEmail))}.`;
  if (!ed) $("raporLock").innerHTML = `<b>View only.</b> The report of ${esc(st.name)} is prepared by the homeroom teacher, ${esc(teacherName(st.teacherEmail))}, or an administrator. You can still view and download it.`;
  renderReport();
}
function currentData() { return reportData(curStudent(), curReport(), curNotes()); }
function renderReport() {
  const d = currentData(), rep = curReport();
  $("report").innerHTML = reportHTML(d, canEditReport(curStudent()));
  $("report").querySelectorAll(".cell").forEach(b => b.onclick = () => {
    const c = b.dataset.ch, l = b.dataset.lv;
    if (rep.grades[c] === l) delete rep.grades[c]; else rep.grades[c] = l;
    renderReport(); saveReport();
  });
  const notes = curNotes();
  $("gradeBasis").innerHTML = VALUES.map(v => {
    const items = Object.entries(SUB).filter(([k, s]) => s.v === v.id).map(([k, s]) => {
      const ns = notes.filter(n => n.aspect === k), kk = ns.filter(n => n.type === "k").length, pp = ns.length - kk;
      return `<span class="${kk && !pp ? "k" : pp && !kk ? "p" : ns.length ? "" : "n"}">${s.n}${ns.length ? ` (${kk}+ / ${pp}−)` : ""}</span>`;
    }).join(", ");
    return `<div><b>${v.name}: ${d.grades[v.id].level || "no evidence"}</b>${items}</div>`;
  }).join("");
  const C = qualityChecks(d, curStudent(), notes), bad = C.filter(c => !c.ok).length;
  $("ckCount").textContent = bad ? `${bad} to revise` : "all clear";
  $("checks").innerHTML = C.map(c => `<div class="ck ${c.ok ? "ok" : "no"}"><i>${c.ok ? "✓" : "!"}</i><span>${esc(c.t)}</span></div>`).join("");
}
function exportPayload() {
  const d = currentData(), rep = curReport();
  return { ...d, school: CFG.SCHOOL_NAME || "", teacher: $("rTeacher").value.trim(), appendix: $("dlAppendix").checked,
    desc: { s: rep.strengths || "", w: rep.weaknesses || "", g: rep.recommendations || "" }, notes: curNotes() };
}
async function runExport(kind, btn) {
  busy(btn, true, "Preparing…");
  try { await Exporter[kind](exportPayload()); toast(kind === "pdf" ? "PDF downloaded" : "Word document downloaded"); }
  catch (e) { toast(e.message || "The file could not be created."); }
  busy(btn, false);
}
$("dlPdf").onclick = () => runExport("pdf", $("dlPdf"));
$("dlWord").onclick = () => runExport("word", $("dlWord"));
$("dlAppendix").checked = pref.get("appendix", "0") === "1";
$("dlAppendix").onchange = e => pref.set("appendix", e.target.checked ? "1" : "0");

function reportText(d) {
  return [`Student's Name: ${(d.student.name || "").toUpperCase()}\tAcademic Year: ${d.year}`, `Student's ID: ${d.student.studentId || ""}\tSemester: ${d.sem}`, `Grade: ${d.student.grade || ""}\tTerm: ${d.term}`, "",
    "No\tCharacter\t" + LEVELS.join("\t"),
    ...VALUES.map((v, i) => `${i + 1}\t${v.name}\t` + LEVELS.map(l => d.grades[v.id].level === l ? "V" : "").join("\t")),
    "", "SPIRITUAL", d.spirit, "", "SOCIAL", d.social, "", `${d.place}, ${longdate(d.date)}`].join("\n");
}
function copyFallback(el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Text selected; press Ctrl+C to copy"); }
$("copyRep").onclick = () => { navigator.clipboard.writeText(reportText(currentData())).then(() => toast("Report copied as text")).catch(() => copyFallback($("report"))); };
$("copyTable").onclick = () => {
  const d = currentData();
  const html = `<table border="1" style="border-collapse:collapse;font-family:Arial;font-size:10pt">
  <tr><td colspan="2">Student's Name:</td><td colspan="2"><b>${esc((d.student.name || "").toUpperCase())}</b></td><td>Academic Year:</td><td>${esc(d.year)}</td></tr>
  <tr><td colspan="2">Student's ID:</td><td colspan="2">${esc(d.student.studentId || "")}</td><td>Semester:</td><td>${esc(d.sem)}</td></tr>
  <tr><td colspan="2">Grade:</td><td colspan="2">${esc(d.student.grade || "")}</td><td>Term:</td><td>${esc(d.term)}</td></tr>
  <tr><th>No</th><th>Character</th>${LEVELS.map(l => `<th>${l}</th>`).join("")}</tr>
  ${VALUES.map((v, i) => `<tr><td>${i + 1}</td><td>${v.name}</td>${LEVELS.map(l => `<td align="center">${d.grades[v.id].level === l ? "V" : ""}</td>`).join("")}</tr>`).join("")}
  <tr><th colspan="6" align="left">Spiritual</th></tr><tr><td colspan="6">${esc(d.spirit)}</td></tr>
  <tr><th colspan="6" align="left">Social</th></tr><tr><td colspan="6">${esc(d.social)}</td></tr>
  <tr><td colspan="6" align="right">${esc(d.place)}, ${esc(longdate(d.date))}</td></tr></table>`;
  try {
    navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([reportText(d)], { type: "text/plain" }) })])
      .then(() => toast("Table copied; paste it into Google Docs or Sheets")).catch(() => copyFallback($("report")));
  } catch (e) { copyFallback($("report")); }
};

/* ---------- admin ---------- */
function renderTrial() {
  const on = !!(S.settings && S.settings.trialMode);
  $("trialMode").checked = on;
  $("trialPill").textContent = on ? "On" : "Off"; $("trialPill").className = "pill " + (on ? "on" : "off");
}
$("trialMode").onchange = async e => {
  const want = e.target.checked; e.target.disabled = true; setSync("busy", "Saving");
  const r = await API.call("settings.save", { trialMode: want });
  e.target.disabled = false;
  if (!r.success) { setSync("err", "Not saved"); e.target.checked = !want; return toast(r.message); }
  S.settings = r.data.settings; cacheNow(); setSync("ok", "Saved"); renderTrial(); toast(r.message);
};
function renderAdmin() {
  renderTrial();
  $("tCount").textContent = `${S.teachers.length} account${S.teachers.length !== 1 ? "s" : ""}`;
  const count = e => S.students.filter(s => s.teacherEmail === e).length;
  $("tTable").innerHTML = `<tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Students</th><th></th></tr>` +
    S.teachers.map(t => `<tr><td>${esc(t.name)}</td><td>${esc(t.email)}</td><td><span class="pill ${t.role === "admin" ? "adm" : ""}">${t.role === "admin" ? "Administrator" : "Teacher"}</span></td>
      <td><span class="pill ${t.active ? "on" : "off"}">${t.active ? "Active" : "Inactive"}</span></td><td>${count(t.email)}</td>
      <td style="white-space:nowrap"><button class="linkbtn" data-tedit="${esc(t.email)}">Edit</button><button class="linkbtn" data-treset="${esc(t.email)}">Reset password</button></td></tr>`).join("");
  $("tTable").querySelectorAll("[data-tedit]").forEach(b => b.onclick = () => {
    const t = S.teachers.find(x => x.email === b.dataset.tedit);
    $("tEmail").value = t.email; $("tName").value = t.name; $("tRole").value = t.role; $("tActive").value = String(t.active); $("tEmail").focus();
  });
  $("tTable").querySelectorAll("[data-treset]").forEach(b => b.onclick = () => confirmClick(b, "Confirm reset", async () => {
    const r = await API.call("teacher.resetPassword", { email: b.dataset.treset });
    if (!r.success) return toast(r.message);
    showSecret(`Temporary password for ${b.dataset.treset}`, r.data.tempPassword);
  }));
}
function showSecret(title, val) { $("tSecretTitle").textContent = title; $("tSecretVal").textContent = val; $("tSecret").hidden = false; }
$("tForm").onsubmit = async e => {
  e.preventDefault();
  busy($("tSave"), true, "Saving…");
  const r = await API.call("teacher.save", { email: $("tEmail").value.trim(), name: $("tName").value.trim(), role: $("tRole").value, active: $("tActive").value === "true" });
  busy($("tSave"), false);
  if (!r.success) return toast(r.message);
  const i = S.teachers.findIndex(t => t.email === r.data.teacher.email);
  if (i > -1) S.teachers[i] = r.data.teacher; else S.teachers.push(r.data.teacher);
  $("tForm").reset(); $("tSecret").hidden = true;
  if (r.data.tempPassword) showSecret(`Temporary password for ${r.data.teacher.email}`, r.data.tempPassword);
  toast(r.message || "Account saved"); renderAdmin();
};

/* ---------- auth ---------- */
function showLogin(msg) {
  $("v-app").hidden = true; $("v-login").hidden = false; $("mPass").hidden = true;
  $("lErr").textContent = msg || ""; $("lPass").value = ""; $("lEmail").focus();
}
API.onAuthLost(() => showLogin("Your session has ended. Please sign in again."));
$("loginForm").onsubmit = async e => {
  e.preventDefault();
  $("lErr").textContent = ""; busy($("lBtn"), true, "Signing in…");
  const r = await API.call("auth.login", { email: $("lEmail").value.trim(), password: $("lPass").value });
  busy($("lBtn"), false);
  if (!r.success) { $("lErr").textContent = r.message; return; }
  API.setToken(r.data.token); S.me = r.data.me; pref.set("user", S.me.email);
  $("v-login").hidden = true; startApp();
  if (r.data.mustChange) openPass(true);
};
function openPass(forced) {
  $("mPass").hidden = false; $("pErr").textContent = ""; $("passForm").reset();
  $("pCancel").hidden = !!forced;
  $("passHint").textContent = forced ? "You are using a temporary password. Please set your own password to continue. Use at least 8 characters, including letters and numbers." : "Use at least 8 characters, including letters and numbers.";
  $("pOld").focus();
}
$("btnPass").onclick = () => openPass(false);
$("pCancel").onclick = () => { $("mPass").hidden = true; };
$("passForm").onsubmit = async e => {
  e.preventDefault();
  if ($("pNew").value !== $("pNew2").value) { $("pErr").textContent = "The new passwords do not match."; return; }
  busy($("pSave"), true, "Updating…");
  const r = await API.call("auth.changePassword", { oldPassword: $("pOld").value, newPassword: $("pNew").value });
  busy($("pSave"), false);
  if (!r.success) { $("pErr").textContent = r.message; return; }
  API.setToken(r.data.token); $("mPass").hidden = true; toast("Password updated");
};
$("btnOut").onclick = () => { API.setToken(""); if (S.me) API.cacheClear(S.me.email); S.me = null; showLogin(""); };

/* ---------- boot ---------- */
function applyBoot(d) {
  S.me = d.me || S.me; S.students = d.students || []; S.records = d.records || []; S.teachers = d.teachers || []; S.settings = d.settings || {};
  S.reports = (d.reports || []).map(r => ({ ...r, grades: typeof r.grades === "string" ? (JSON.parse(r.grades || "{}")) : (r.grades || {}) }));
}
function cacheNow() { if (!API.LOCAL && S.me) API.cacheSet(S.me.email, { me: S.me, students: S.students, records: S.records, reports: S.reports, teachers: S.teachers, settings: S.settings }); }
function renderShell() {
  const isAdmin = S.me && S.me.role === "admin";
  $("who").innerHTML = API.LOCAL ? "" : `<b>${esc(S.me ? S.me.name : "")}</b>${isAdmin && S.me.name !== "Administrator" ? " · Administrator" : ""}`;
  $("btnPass").hidden = $("btnOut").hidden = API.LOCAL;
  $("demoBanner").hidden = !API.LOCAL;
  $("tabAdmin").hidden = !isAdmin;
}
async function startApp() {
  $("v-app").hidden = false;
  S.cur = pref.get("cur", "");
  const cached = !API.LOCAL && S.me ? API.cacheGet(S.me.email) : null;
  if (cached) { applyBoot(cached); renderShell(); show(tab); } else { renderShell(); show("contoh"); }
  setSync("busy", "Loading");
  const r = await API.call("data.boot", {});
  if (!r.success) { setSync("err", "Offline"); if (r.code !== "AUTH") toast(r.message); return; }
  applyBoot(r.data); cacheNow(); renderShell(); setSync("ok", "Up to date");
  show(cached ? tab : (S.students.length ? "catat" : "contoh"));
}

$("nDate").value = todayISO();
renderEx(); aspHint(); checkNote();
if (API.LOCAL) { S.me = { email: "demo", name: "Demo teacher", role: "teacher" }; startApp(); }
else if (API.hasToken) { const u = pref.get("user", ""); S.me = u ? { email: u, name: "", role: "teacher" } : null; startApp(); }
else showLogin("");