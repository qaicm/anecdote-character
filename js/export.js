/*
 * export.js — unduh rapor sebagai PDF (jsPDF + autoTable) atau Word (.docx).
 * Pustaka dimuat hanya saat tombol unduh ditekan agar halaman tetap ringan.
 */
const Exporter = (() => {
  const LIBS = {
    pdf: [
      "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js"
    ],
    word: ["https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js"]
  };
  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.async = false;
      s.onload = res;
      s.onerror = () => { delete loaded[src]; rej(new Error("The export library could not be loaded. Please check your internet connection.")); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  async function ensure(kind) { for (const src of LIBS[kind]) await loadScript(src); }

  /* Standard PDF fonts cover Latin-1 only, so typographic characters are simplified. */
  const plain = s => String(s || "")
    .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-").replace(/…/g, "...").replace(/•/g, "-")
    .replace(/·/g, "-").replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");

  function fileName(r, ext) {
    const n = (r.student.name || "Student").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `Character-Report_${n}_${(r.year || "").replace(/[^0-9-]/g, "")}_S${r.sem || ""}T${r.term || ""}.${ext}`;
  }
  function save(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const typeLabel = t => t === "p" ? "Area for development" : "Strength";

  /* ============ PDF ============ */
  async function pdf(r) {
    await ensure("pdf");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const M = 15, W = 210 - 2 * M;
    const line = { lineColor: [0, 0, 0], lineWidth: 0.2 };
    let y = 16;

    if (r.school) { doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(plain(r.school), 105, y, { align: "center" }); y += 6; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("CHARACTER REPORT", 105, y, { align: "center" }); y += 5;

    doc.autoTable({
      startY: y, margin: { left: M, right: M }, theme: "plain",
      styles: { font: "helvetica", fontSize: 10, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 70, fontStyle: "bold" }, 2: { cellWidth: 30 } },
      body: [
        ["Student's Name:", plain((r.student.name || "").toUpperCase()), "Academic Year:", plain(r.year)],
        ["Student's ID:", plain(r.student.studentId), "Semester:", plain(r.sem)],
        ["Grade:", plain(r.student.grade), "Term:", plain(r.term)]
      ]
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 4, margin: { left: M, right: M }, theme: "grid",
      styles: { font: "helvetica", fontSize: 10, textColor: 20, cellPadding: 1.6, ...line },
      headStyles: { fillColor: [217, 221, 227], textColor: 20, fontStyle: "bold", halign: "center", valign: "middle", ...line },
      columnStyles: { 0: { cellWidth: 12, halign: "right" }, 1: { cellWidth: 46 }, ...Object.fromEntries([2, 3, 4, 5].map(i => [i, { cellWidth: (W - 58) / 4, halign: "center", fontStyle: "bold" }])) },
      head: [
        [{ content: "No", rowSpan: 2 }, { content: "Character", rowSpan: 2 }, { content: "Grading", colSpan: 4 }],
        LEVELS.slice()
      ],
      body: VALUES.map((v, i) => [String(i + 1), v.name, ...LEVELS.map(l => r.grades[v.id].level === l ? "V" : "")])
    });

    const box = (title, text) => doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5, margin: { left: M, right: M }, theme: "grid",
      styles: { font: "helvetica", fontSize: 10, textColor: 20, cellPadding: 2, ...line },
      headStyles: { fillColor: [217, 221, 227], textColor: 20, fontStyle: "bold", ...line },
      bodyStyles: { minCellHeight: 30, valign: "top" },
      head: [[title]], body: [[plain(text)]]
    });
    box("Social", r.social);
    box("Spiritual", r.spirit);

    y = doc.lastAutoTable.finalY + 10;
    if (y > 245) { doc.addPage(); y = 25; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const right = 210 - M - 4;
    doc.text(plain(`${r.place || ""}${r.place && r.date ? ", " : ""}${longdate(r.date)}`), right, y, { align: "right" });
    doc.text("Homeroom Teacher", right, y + 6, { align: "right" });
    doc.text(r.teacher ? plain(r.teacher) : "(.................................)", right, y + 28, { align: "right" });

    if (r.appendix) {
      doc.addPage();
      doc.setFont("helvetica", "bold"); doc.setFontSize(13);
      doc.text("APPENDIX: CHARACTER DESCRIPTION", 105, 18, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(plain(`${r.student.name || ""} - ${r.student.grade || ""}`), 105, 24, { align: "center" });
      doc.autoTable({
        startY: 30, margin: { left: M, right: M }, theme: "grid",
        styles: { font: "helvetica", fontSize: 10, textColor: 20, cellPadding: 2, valign: "top", ...line },
        columnStyles: { 0: { cellWidth: 40, fontStyle: "bold", fillColor: [240, 242, 245] } },
        body: [["Strengths", plain(r.desc.s) || "-"], ["Areas for development", plain(r.desc.w) || "-"], ["Recommendations", plain(r.desc.g) || "-"]]
      });
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 6, margin: { left: M, right: M }, theme: "grid",
        styles: { font: "helvetica", fontSize: 8.5, textColor: 20, cellPadding: 1.5, valign: "top", ...line },
        headStyles: { fillColor: [217, 221, 227], textColor: 20, fontStyle: "bold", ...line },
        columnStyles: { 0: { cellWidth: 16 }, 1: { cellWidth: 22 }, 4: { cellWidth: 30 }, 5: { cellWidth: 20 } },
        head: [["Date", "Time / place", "What happened", "How it ended", "Sub-value", "Evidence of"]],
        body: r.notes.map(n => [sdate(n.date), plain([n.time, n.loc].filter(Boolean).join(", ")), plain(n.what), plain(n.end), plain(subLabel(n.aspect)), typeLabel(n.type)])
      });
    }
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`Page ${i} of ${pages}`, 105, 290, { align: "center" }); doc.setTextColor(0);
    }
    save(doc.output("blob"), fileName(r, "pdf"));
  }

  /* ============ WORD ============ */
  async function word(r) {
    await ensure("word");
    const D = window.docx;
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, VerticalAlign, PageBreak } = D;
    const FULL = 9906;                                   // A4 width minus 1000-twip margins
    const black = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
    const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const B = { top: black, bottom: black, left: black, right: black };
    const N = { top: none, bottom: none, left: none, right: none };
    const GREY = { type: ShadingType.CLEAR, color: "auto", fill: "D9DDE3" };
    const paras = (text, o = {}) => String(text || "").split(/\n/).map(t => new Paragraph({
      alignment: o.align, spacing: { after: o.after ?? 40 },
      children: [new TextRun({ text: t, bold: !!o.bold, size: o.size })]
    }));
    const cell = (text, o = {}) => new TableCell({
      children: paras(text, o), borders: o.borders || B, shading: o.shade ? GREY : undefined,
      width: o.w ? { size: o.w, type: WidthType.DXA } : undefined,
      columnSpan: o.colSpan, rowSpan: o.rowSpan, verticalAlign: o.valign || VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 100, right: 100 }
    });
    const table = (rows, widths) => new Table({ rows, columnWidths: widths, width: { size: FULL, type: WidthType.DXA } });
    const C = AlignmentType.CENTER, R = AlignmentType.RIGHT;

    const body = [];
    if (r.school) body.push(...paras(r.school, { bold: true, align: C, size: 24 }));
    body.push(...paras("CHARACTER REPORT", { bold: true, align: C, size: 26, after: 200 }));

    const hw = [1900, 4200, 1900, 1906];
    body.push(table([
      ["Student's Name:", (r.student.name || "").toUpperCase(), "Academic Year:", r.year],
      ["Student's ID:", r.student.studentId, "Semester:", r.sem],
      ["Grade:", r.student.grade, "Term:", r.term]
    ].map(row => new TableRow({ children: row.map((t, i) => cell(t, { borders: N, w: hw[i], bold: i === 1 })) })), hw));
    body.push(new Paragraph({ text: "" }));

    const gw = [700, 2806, 1600, 1600, 1600, 1600];
    const gRows = [
      new TableRow({ tableHeader: true, children: [cell("No", { shade: 1, bold: 1, rowSpan: 2, align: C, w: gw[0] }), cell("Character", { shade: 1, bold: 1, rowSpan: 2, align: C, w: gw[1] }), cell("Grading", { shade: 1, bold: 1, colSpan: 4, align: C, w: 6400 })] }),
      new TableRow({ tableHeader: true, children: LEVELS.map((l, i) => cell(l, { shade: 1, bold: 1, align: C, w: gw[i + 2] })) }),
      ...VALUES.map((v, i) => new TableRow({ children: [cell(String(i + 1), { align: R, w: gw[0] }), cell(v.name, { w: gw[1] }), ...LEVELS.map((l, j) => cell(r.grades[v.id].level === l ? "V" : "", { align: C, bold: 1, w: gw[j + 2] }))] }))
    ];
    body.push(table(gRows, gw));

    const box = (title, text) => {
      body.push(new Paragraph({ text: "" }));
      body.push(table([
        new TableRow({ children: [cell(title, { shade: 1, bold: 1, w: FULL })] }),
        new TableRow({ height: { value: 1700, rule: "atLeast" }, children: [cell(text, { w: FULL, valign: VerticalAlign.TOP })] })
      ], [FULL]));
    };
    box("Social", r.social);
    box("Spiritual", r.spirit);

    body.push(new Paragraph({ text: "", spacing: { after: 200 } }));
    body.push(...paras(`${r.place || ""}${r.place && r.date ? ", " : ""}${longdate(r.date)}`, { align: R }));
    body.push(...paras("Homeroom Teacher", { align: R, after: 900 }));
    body.push(...paras(r.teacher || "(.................................)", { align: R }));

    if (r.appendix) {
      body.push(new Paragraph({ children: [new PageBreak()] }));
      body.push(...paras("APPENDIX: CHARACTER DESCRIPTION", { bold: true, align: C, size: 26 }));
      body.push(...paras(`${r.student.name || ""} - ${r.student.grade || ""}`, { align: C, after: 200 }));
      const dw = [2400, 7506];
      body.push(table([["Strengths", r.desc.s], ["Areas for development", r.desc.w], ["Recommendations", r.desc.g]]
        .map(([a, b]) => new TableRow({ children: [cell(a, { bold: 1, shade: 1, w: dw[0], valign: VerticalAlign.TOP }), cell(b || "-", { w: dw[1], valign: VerticalAlign.TOP })] })), dw));
      body.push(new Paragraph({ text: "" }));
      const nw = [1000, 1500, 3100, 2006, 1400, 900];
      body.push(table([
        new TableRow({ tableHeader: true, children: ["Date", "Time / place", "What happened", "How it ended", "Sub-value", "Evidence of"].map((h, i) => cell(h, { shade: 1, bold: 1, w: nw[i], size: 18 })) }),
        ...r.notes.map(n => new TableRow({ children: [sdate(n.date), [n.time, n.loc].filter(Boolean).join(", "), n.what, n.end, subLabel(n.aspect), typeLabel(n.type)].map((t, i) => cell(t, { w: nw[i], size: 18, valign: VerticalAlign.TOP })) }))
      ], nw));
    }

    const doc = new Document({
      creator: "Anecdote to Character", title: "Character Report - " + (r.student.name || ""),
      styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, children: body }]
    });
    save(await Packer.toBlob(doc), fileName(r, "docx"));
  }

  return { pdf, word };
})();
