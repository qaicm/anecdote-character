/*
 * api.js — lapisan data.
 * - Mode server : semua aksi dikirim ke Google Apps Script (POST text/plain, token di body).
 * - Mode demo   : bila GAS_URL belum diisi, data disimpan di localStorage browser ini.
 */
const API = (() => {
  const URL = ((window.APP_CONFIG || {}).GAS_URL || "").trim();
  const LOCAL = !URL || /GANTI|XXXX/.test(URL);
  const K_TOKEN = "atc-token", K_DB = "atc-demo-db", K_CACHE = "atc-cache-";
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  let token = ls.get(K_TOKEN) || "";
  let onAuthLost = null;

  async function remote(action, data) {
    let res;
    try {
      res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, token, data: data || {} })
      });
    } catch (e) {
      return { success: false, message: "The server cannot be reached. Please check your internet connection and try again." };
    }
    let j;
    try { j = await res.json(); }
    catch (e) { return { success: false, message: "The server returned an unexpected response. Check that GAS_URL in js/config.js ends with /exec and that the web app is deployed for “Anyone”." }; }
    if (!j.success && j.code === "AUTH") { setToken(""); if (onAuthLost) onAuthLost(j.message); }
    return j;
  }

  /* ---------- demo store ---------- */
  function db() { try { return JSON.parse(ls.get(K_DB)) || { students: [], records: [], reports: [] }; } catch (e) { return { students: [], records: [], reports: [] }; } }
  function saveDb(d) { ls.set(K_DB, JSON.stringify(d)); }
  const id = p => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const now = () => new Date().toISOString();
  const ok = (data, message) => ({ success: true, message: message || "", data });
  const fail = message => ({ success: false, message });

  function local(action, d) {
    d = d || {};
    const s = db();
    switch (action) {
      case "data.boot": return ok({ me: { email: "demo", name: "Demo teacher", role: "teacher" }, ...s });
      case "student.save": {
        if (!String(d.name || "").trim()) return fail("Please enter the student's name.");
        const grade = normGrade(d.grade), unit = normUnit(d.unit, grade);
        if (unit === null) return fail("Unit must be MS (Middle School) or HS (High School).");
        const row = { id: d.id || id("S"), studentId: d.studentId || "", name: d.name.trim(), grade, gender: normGender(d.gender), unit, teacherEmail: "demo", updatedAt: now() };
        const i = s.students.findIndex(x => x.id === row.id);
        if (i > -1) s.students[i] = { ...s.students[i], ...row }; else s.students.push({ ...row, createdAt: now() });
        saveDb(s); return ok({ student: row }, "Student saved.");
      }
      case "student.import": {
        const rows = d.rows || [], out = [], skipped = [], seen = {};
        let created = 0, updated = 0;
        rows.forEach((x, k) => {
          const line = x.line || k + 1, name = String(x.name || "").trim(), sid = String(x.studentId || "").trim();
          if (!name) return skipped.push({ line, reason: "The student name is empty." });
          const grade = normGrade(x.grade), unit = normUnit(x.unit, grade);
          if (unit === null) return skipped.push({ line, name, reason: "Unit must be MS or HS." });
          const key = sid ? "id:" + sid.toLowerCase() : "ng:" + (name + "|" + grade).toLowerCase();
          if (seen[key]) return skipped.push({ line, name, reason: "Duplicate of line " + seen[key] + " in this file." });
          seen[key] = line;
          let cur = (sid && s.students.find(t => String(t.studentId).toLowerCase() === sid.toLowerCase())) || s.students.find(t => (t.name + "|" + t.grade).toLowerCase() === (name + "|" + grade).toLowerCase());
          if (cur) { Object.assign(cur, { studentId: sid || cur.studentId, name, grade: grade || cur.grade, gender: normGender(x.gender) || cur.gender, unit: unit || cur.unit, updatedAt: now() }); updated++; }
          else { cur = { id: id("S"), studentId: sid, name, grade, gender: normGender(x.gender), unit, teacherEmail: "demo", createdAt: now(), updatedAt: now() }; s.students.push(cur); created++; }
          out.push(cur);
        });
        saveDb(s);
        return ok({ created, updated, skipped, students: out }, `${created} added, ${updated} updated.`);
      }
      case "student.delete":
        s.students = s.students.filter(x => x.id !== d.id);
        s.records = s.records.filter(x => x.studentKey !== d.id);
        s.reports = s.reports.filter(x => x.studentKey !== d.id);
        saveDb(s); return ok({ id: d.id }, "Student deleted.");
      case "record.save": {
        if (!SUB[d.subValue]) return fail("Unknown sub-value.");
        const row = { id: d.id || id("R"), studentKey: d.studentKey, date: d.date, time: d.time || "", location: d.location || "", what: d.what, ending: d.end || "", subValue: d.subValue, value: VAL[SUB[d.subValue].v].name, type: d.type === "p" ? "p" : "k", teacherEmail: "demo", createdAt: now() };
        const i = s.records.findIndex(x => x.id === row.id);
        if (i > -1) s.records[i] = row; else s.records.push(row);
        saveDb(s); return ok({ record: row }, "Record saved.");
      }
      case "record.delete":
        s.records = s.records.filter(x => x.id !== d.id); saveDb(s); return ok({ id: d.id }, "Record deleted.");
      case "report.save": {
        const row = { ...d, updatedAt: now(), updatedBy: "demo" };
        const i = s.reports.findIndex(x => x.studentKey === d.studentKey);
        if (i > -1) s.reports[i] = row; else s.reports.push(row);
        saveDb(s); return ok({ report: row }, "Report saved.");
      }
      default: return fail("This feature requires the server connection.");
    }
  }

  function setToken(t) { token = t || ""; if (token) ls.set(K_TOKEN, token); else ls.del(K_TOKEN); }

  return {
    LOCAL,
    get hasToken() { return !!token; },
    setToken,
    onAuthLost(fn) { onAuthLost = fn; },
    call(action, data) { return LOCAL ? Promise.resolve(local(action, JSON.parse(JSON.stringify(data || {})))) : remote(action, data); },
    cacheGet(user) { try { return JSON.parse(ls.get(K_CACHE + user)); } catch (e) { return null; } },
    cacheSet(user, v) { ls.set(K_CACHE + user, JSON.stringify(v)); },
    cacheClear(user) { ls.del(K_CACHE + user); },
    resetDemo() { ls.del(K_DB); }
  };
})();
