import ExcelJS from "exceljs";

const BLUE = "FF1A237E";
const LIGHT_BLUE = "FFEEF2FF";
const WHITE = "FFFFFFFF";
const GREEN = "FF10B981";
const RED = "FFEF4444";
const YELLOW = "FFF59E0B";
const GRAY = "FF64748B";
const LIGHT_GRAY = "FFF8FAFC";

const headerStyle = (wb: ExcelJS.Workbook): Partial<ExcelJS.Style> => ({
  font: { bold: true, color: { argb: WHITE }, size: 11, name: "Calibri" },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } },
  alignment: { vertical: "middle", horizontal: "center", wrapText: true },
  border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
});

const dataBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } },
};

const applyOfficialHeader = (ws: ExcelJS.Worksheet, title: string, subtitle: string) => {
  ws.mergeCells("A1", `${String.fromCharCode(64 + (ws.columns?.length || 5))}1`);
  const r1 = ws.getRow(1);
  r1.height = 30;
  r1.getCell(1).value = "RÉPUBLIQUE DU NIGER — Fraternité - Travail - Progrès";
  r1.getCell(1).font = { bold: true, size: 13, color: { argb: BLUE }, name: "Calibri" };
  r1.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  r1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BLUE } };

  ws.mergeCells("A2", `${String.fromCharCode(64 + (ws.columns?.length || 5))}2`);
  const r2 = ws.getRow(2);
  r2.height = 22;
  r2.getCell(1).value = "MINISTÈRE DE LA JUSTICE — Système d'Information Judiciaire (e-Justice)";
  r2.getCell(1).font = { bold: true, size: 10, color: { argb: GRAY }, name: "Calibri" };
  r2.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells("A3", `${String.fromCharCode(64 + (ws.columns?.length || 5))}3`);
  const r3 = ws.getRow(3);
  r3.height = 26;
  r3.getCell(1).value = title.toUpperCase();
  r3.getCell(1).font = { bold: true, size: 12, color: { argb: WHITE }, name: "Calibri" };
  r3.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  r3.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };

  ws.mergeCells("A4", `${String.fromCharCode(64 + (ws.columns?.length || 5))}4`);
  const r4 = ws.getRow(4);
  r4.height = 18;
  r4.getCell(1).value = subtitle;
  r4.getCell(1).font = { italic: true, size: 9, color: { argb: GRAY }, name: "Calibri" };
  r4.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
};

const applyColumnHeaders = (ws: ExcelJS.Worksheet, row: number = 6) => {
  const r = ws.getRow(row);
  r.height = 25;
  r.eachCell(cell => {
    cell.font = { bold: true, color: { argb: WHITE }, size: 10, name: "Calibri" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = dataBorder;
  });
};

const styleDataRow = (row: ExcelJS.Row, index: number) => {
  row.height = 20;
  row.alignment = { vertical: "middle", horizontal: "center" };
  if (index % 2 === 0) {
    row.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GRAY } };
      cell.border = dataBorder;
    });
  } else {
    row.eachCell(cell => { cell.border = dataBorder; });
  }
};

export class ExportService {
  async generatePrisonExcel(data: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Données");
    if (data.length > 0) {
      ws.columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: Math.max(k.length + 5, 15) }));
      applyColumnHeaders(ws, 1);
      data.forEach((item, i) => { const row = ws.addRow(item); styleDataRow(row, i); });
    }
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async generateWeeklyReport(stationData: any[], agentData: any[], summaryData: any): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = "SIJ Niger — e-Justice";
    wb.created = new Date();

    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const weekNum = Math.ceil(new Date().getDate() / 7);
    const period = `Semaine ${weekNum} — ${dateStr}`;

    // ═══════════════════════════════════════════════
    // ONGLET 1 — PLAINTES PAR COMMISSARIAT
    // ═══════════════════════════════════════════════
    const ws1 = wb.addWorksheet("Commissariats");
    ws1.columns = [
      { header: "#", key: "num", width: 5 },
      { header: "Commissariat / Brigade", key: "commissariat", width: 38 },
      { header: "Ville", key: "ville", width: 14 },
      { header: "Quartier", key: "quartier", width: 14 },
      { header: "Type", key: "type", width: 14 },
      { header: "Total", key: "total", width: 10 },
      { header: "Soumises", key: "soumises", width: 11 },
      { header: "En cours", key: "enCours", width: 11 },
      { header: "Traitées", key: "traitees", width: 11 },
      { header: "Classées", key: "classees", width: 11 },
      { header: "Taux résolution", key: "taux", width: 16 },
    ];
    applyOfficialHeader(ws1, "Rapport Hebdomadaire — Plaintes par Commissariat", period);
    ws1.getRow(5).values = [];
    applyColumnHeaders(ws1, 6);
    ws1.getRow(6).values = ws1.columns.map(c => (c as any).header);

    stationData.forEach((s, i) => {
      const total = s.total || 0;
      const traitees = s.traitees || 0;
      const taux = total > 0 ? Math.round((traitees / total) * 100) : 0;
      const row = ws1.addRow({ num: i + 1, ...s, taux: taux + "%" });
      styleDataRow(row, i);
      row.getCell("commissariat").alignment = { horizontal: "left", vertical: "middle" };
      const tauxCell = row.getCell("taux");
      if (taux >= 70) tauxCell.font = { color: { argb: GREEN.slice(2) }, bold: true };
      else if (taux < 30 && total > 0) tauxCell.font = { color: { argb: RED.slice(2) }, bold: true };
      else tauxCell.font = { color: { argb: YELLOW.slice(2) }, bold: true };
    });

    // Ligne TOTAL
    const totalRow1 = ws1.addRow({
      num: "", commissariat: "TOTAL", ville: "", quartier: "", type: "",
      total: stationData.reduce((s, d) => s + (d.total || 0), 0),
      soumises: stationData.reduce((s, d) => s + (d.soumises || 0), 0),
      enCours: stationData.reduce((s, d) => s + (d.enCours || 0), 0),
      traitees: stationData.reduce((s, d) => s + (d.traitees || 0), 0),
      classees: stationData.reduce((s, d) => s + (d.classees || 0), 0),
      taux: "",
    });
    totalRow1.font = { bold: true, size: 11 };
    totalRow1.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_BLUE } }; c.border = dataBorder; });

    // ═══════════════════════════════════════════════
    // ONGLET 2 — PERFORMANCES AGENTS OPJ
    // ═══════════════════════════════════════════════
    const ws2 = wb.addWorksheet("Agents OPJ");
    ws2.columns = [
      { header: "#", key: "num", width: 5 },
      { header: "Agent (Nom Prénom)", key: "agent", width: 30 },
      { header: "Matricule", key: "matricule", width: 16 },
      { header: "Commissariat d'affectation", key: "commissariat", width: 32 },
      { header: "Dossiers traités", key: "traites", width: 16 },
      { header: "Dossiers en cours", key: "enCours", width: 16 },
      { header: "Taux résolution", key: "taux", width: 16 },
      { header: "Performance", key: "perf", width: 15 },
    ];
    applyOfficialHeader(ws2, "Rapport Hebdomadaire — Performances des Agents OPJ", period);
    ws2.getRow(5).values = [];
    applyColumnHeaders(ws2, 6);
    ws2.getRow(6).values = ws2.columns.map(c => (c as any).header);

    agentData.forEach((a, i) => {
      const total = (a.traites || 0) + (a.enCours || 0);
      const taux = total > 0 ? Math.round((a.traites / total) * 100) : 0;
      const perf = taux >= 70 ? "★★★ Excellent" : taux >= 50 ? "★★ Bon" : taux >= 30 ? "★ Moyen" : "⚠ Insuffisant";
      const row = ws2.addRow({ num: i + 1, ...a, taux: taux + "%", perf });
      styleDataRow(row, i);
      row.getCell("agent").alignment = { horizontal: "left", vertical: "middle" };
      const perfCell = row.getCell("perf");
      if (taux >= 70) perfCell.font = { color: { argb: GREEN.slice(2) }, bold: true };
      else if (taux < 30 && total > 0) perfCell.font = { color: { argb: RED.slice(2) }, bold: true };
      else if (total > 0) perfCell.font = { color: { argb: YELLOW.slice(2) }, bold: true };
    });

    // ═══════════════════════════════════════════════
    // ONGLET 3 — TABLEAU DE BORD RÉSUMÉ
    // ═══════════════════════════════════════════════
    const ws3 = wb.addWorksheet("Résumé");
    ws3.columns = [
      { header: "Indicateur", key: "indicateur", width: 45 },
      { header: "Valeur", key: "valeur", width: 25 },
    ];
    applyOfficialHeader(ws3, "Tableau de Bord — Résumé Hebdomadaire", period);
    ws3.getRow(5).values = [];
    applyColumnHeaders(ws3, 6);
    ws3.getRow(6).values = ["INDICATEUR", "VALEUR"];

    const totalWeek = summaryData.totalWeek || 0;
    const traitees = summaryData.traitees || 0;
    const tauxGlobal = totalWeek > 0 ? Math.round((traitees / totalWeek) * 100) + "%" : "N/A";

    const kpis = [
      ["📅 Période du rapport", period],
      ["📊 Total plaintes cette semaine", totalWeek],
      ["✅ Plaintes traitées (transmises/jugées)", traitees],
      ["⏳ Plaintes en cours de traitement", summaryData.enCours || 0],
      ["📁 Plaintes classées sans suite", summaryData.classees || 0],
      ["🏛 Commissariats / Brigades actifs", stationData.length],
      ["👮 Agents OPJ en activité", agentData.length],
      ["📈 Taux d'élucidation global", tauxGlobal],
      ["", ""],
      ["🔒 CATÉGORIES LES PLUS FRÉQUENTES", ""],
    ];

    kpis.forEach(([indicateur, valeur], i) => {
      const row = ws3.addRow({ indicateur, valeur });
      row.height = 22;
      row.getCell("indicateur").alignment = { horizontal: "left", vertical: "middle" };
      row.getCell("valeur").alignment = { horizontal: "center", vertical: "middle" };
      row.getCell("valeur").font = { bold: true, size: 11 };
      row.eachCell(c => { c.border = dataBorder; });
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GRAY } }; });
    });

    // Pied de page
    const footerRow = ws3.addRow({ indicateur: "", valeur: "" });
    footerRow.height = 10;
    const footer2 = ws3.addRow({ indicateur: "Document généré automatiquement par le SIJ Niger — " + new Date().toLocaleString("fr-FR"), valeur: "" });
    footer2.getCell("indicateur").font = { italic: true, size: 8, color: { argb: GRAY } };
    footer2.getCell("indicateur").alignment = { horizontal: "left" };

    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
