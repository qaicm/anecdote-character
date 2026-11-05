/*
 * importer.js — membaca daftar siswa dari Excel (.xlsx/.xls), CSV, atau teks tempelan,
 * lalu memetakan kolomnya. Pustaka SheetJS dimuat hanya saat dibutuhkan.
 */
const Importer = (() => {
  const XLSX_SRC = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  let xlsxReady = null;
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve();
    if (!xlsxReady) xlsxReady = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = XLSX_SRC; s.onload = res;
      s.onerror = () => { xlsxReady = null; rej(new Error("The Excel library could not be loaded. Check your internet connection, or save the file as CSV and try again.")); };
      document.head.appendChild(s);
    });
    return xlsxReady;
  }

  /* header aliases (lower-case, letters and digits only) */
  const ALIAS = {
    studentId: ["studentid", "id", "nis", "nisn", "idsiswa", "nomorinduk", "noinduk", "studentno", "studentnumber", "nomorindukssiswa"],
    name: ["studentname", "name", "nama", "namasiswa", "namalengkap", "fullname", "studentsname", "studentfullname"],
    grade: ["gradeclass", "grade", "class", "kelas", "rombel", "homeroom", "classgrade"],
    unit: ["unitmshs", "unit", "level", "jenjang", "school", "section"],
    gender: ["gendermf", "gender", "sex", "jk", "jeniskelamin", "lp"],
    teacherEmail: ["teacheremail", "teacher", "guru", "emailguru", "homeroomteacher", "walikelas", "homeroomteacheremail"]
  };
  const key = h => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  function mapHeader(row) {
    const map = {};
    row.forEach((h, i) => {
      const k = key(h);
      for (const f in ALIAS) if (map[f] === undefined && ALIAS[f].includes(k)) { map[f] = i; break; }
    });
    return map;
  }

  /* small CSV/TSV parser with quotes; delimiter detected from the first line */
  function parseDelimited(text) {
    text = String(text || "").replace(/^﻿/, "");
    const firstLine = text.split(/\r?\n/)[0] || "";
    const count = c => (firstLine.match(new RegExp("\\" + c, "g")) || []).length;
    const d = count("\t") ? "\t" : count(";") > count(",") ? ";" : ",";
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"' && cell === "") q = true;
      else if (c === d) { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  async function readFile(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext === "csv" || ext === "txt") return parseDelimited(await file.text());
    if (ext !== "xlsx" && ext !== "xls") throw new Error("Please choose an .xlsx, .xls or .csv file.");
    await loadXlsx();
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const name = wb.SheetNames.find(n => /student|siswa/i.test(n)) || wb.SheetNames[0];
    return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "", blankrows: false });
  }

  /* table (array of arrays) → [{line, studentId, name, grade, unit, gender, teacherEmail}] */
  function toRows(table) {
    table = (table || []).filter(r => r && r.some(c => String(c).trim() !== ""));
    let h = -1, map = null;
    for (let i = 0; i < Math.min(table.length, 6); i++) {
      const m = mapHeader(table[i]);
      if (m.name !== undefined) { h = i; map = m; break; }
    }
    if (h < 0) throw new Error("No header row with a Student Name column was found. Use the template, or make sure the first row contains column titles such as Student ID, Student Name, Grade / Class, Unit and Gender.");
    const get = (r, f) => map[f] === undefined ? "" : String(r[map[f]] ?? "").trim();
    return {
      columns: Object.keys(map),
      rows: table.slice(h + 1).map((r, i) => ({
        line: h + i + 2,
        studentId: get(r, "studentId"), name: get(r, "name"), grade: get(r, "grade"),
        unit: get(r, "unit"), gender: get(r, "gender"), teacherEmail: get(r, "teacherEmail").toLowerCase()
      }))
    };
  }

  async function template(withTeacher) {
    await loadXlsx();
    const head = ["Student ID", "Student Name", "Grade / Class", "Unit (MS/HS)", "Gender (M/F)"];
    if (withTeacher) head.push("Teacher Email");
    const aoa = [head];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Student ID column as text so IDs such as 00123 keep their leading zeros
    for (let r = 1; r <= 500; r++) ws["A" + (r + 1)] = { t: "s", v: "", z: "@" };
    ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 500, c: head.length - 1 } });
    ws["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 15 }, { wch: 13 }, { wch: 13 }, { wch: 30 }].slice(0, head.length);
    const guide = XLSX.utils.aoa_to_sheet([
      ["How to fill in the Students sheet"],
      [],
      ["Column", "Required", "What to enter", "Example"],
      ["Student ID", "Recommended", "The school's student number. Used to update a student when the file is imported again.", "00123"],
      ["Student Name", "Yes", "The student's full name.", "Ahmad Fakhry"],
      ["Grade / Class", "Recommended", "The class name as used at school.", "7A, 8 B, 10 IPA 1, XI-2"],
      ["Unit (MS/HS)", "Recommended", "MS for Middle School (SMP) or HS for High School (SMA). Leave empty to detect it from the class: 7–9 is MS, 10–12 is HS.", "MS"],
      ["Gender (M/F)", "Recommended", "M or F (L/P is also accepted). Used for he/she in the report.", "M"],
      ...(withTeacher ? [["Teacher Email", "Optional", "The homeroom teacher's account email. Leave empty to use the teacher chosen in the app.", "rahma@school.sch.id"]] : []),
      [],
      ["Notes"],
      ["• Keep the first row (column titles) unchanged. One student per row."],
      ["• Up to 500 students per import. Larger lists can be imported in several files."],
      ["• Importing the same file again updates the students instead of creating duplicates."]
    ]);
    guide["!cols"] = [{ wch: 16 }, { wch: 13 }, { wch: 80 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.utils.book_append_sheet(wb, guide, "Guide");
    XLSX.writeFile(wb, "Student-Import-Template.xlsx");
  }

  return { readFile, parseText: parseDelimited, toRows, template };
})();
