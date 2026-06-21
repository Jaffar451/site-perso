import ExcelJS from "exceljs";

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A237E" } },
  alignment: { vertical: "middle", horizontal: "center" },
  border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
};

const applyHeader = (ws: ExcelJS.Worksheet) => {
  const row = ws.getRow(1);
  row.height = 28;
  row.eachCell(cell => Object.assign(cell, { style: { ...HEADER_STYLE } as any }));
};

const applyDataBorders = (row: ExcelJS.Row) => {
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.eachCell(cell => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFDEDEDE" } },
      bottom: { style: "thin", color: { argb: "FFDEDEDE" } },
      left: { style: "thin", color: { argb: "FFDEDEDE" } },
      right: { style: "thin", color: { argb: "FFDEDEDE" } },
    };
  });
};

export class ExportService {
  async generatePrisonExcel(data: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Données");
    if (data.length > 0) {
      ws.columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: Math.max(k.length + 5, 15) }));
      applyHeader(ws);
      data.forEach(item => { const row = ws.addRow(item); applyDataBorders(row); });
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  async generateWeeklyReport(stationData: any[], agentData: any[], summaryData: any): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = "SIJ Niger - e-Justice";
    wb.created = new Date();

    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const weekNum = Math.ceil(new Date().getDate() / 7);

    // ONGLET 1 — PLAINTES PAR COMMISSARIAT
    const ws1 = wb.addWorksheet("Commissariats");
    ws1.columns = [
      { header: "Commissariat", key: "commissariat", width: 35 },
      { header: "Ville", key: "ville", width: 15 },
      { header: "Quartier", key: "quartier", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Total", key: "total", width: 10 },
      { header: "Soumises", key: "soumises", width: 12 },
      { header: "En cours", key: "enCours", width: 12 },
      { header: "Traitées", key: "traitees", width: 12 },
      { header: "Classées", key: "classees", width: 12 },
      { header: "Taux résolution", key: "taux", width: 16 },
    ];
    applyHeader(ws1);
    stationData.forEach(s => {
      const total = s.total || 0;
      const traitees = s.traitees || 0;
      const taux = total > 0 ? Math.round((traitees / total) * 100) + "%" : "0%";
      const row = ws1.addRow({ ...s, taux });
      applyDataBorders(row);
      if (parseInt(taux) < 30) {
        row.getCell("taux").font = { color: { argb: "FFFF0000" }, bold: true };
      } else if (parseInt(taux) >= 70) {
        row.getCell("taux").font = { color: { argb: "FF10B981" }, bold: true };
      }
    });

    // ONGLET 2 — PERFORMANCES AGENTS
    const ws2 = wb.addWorksheet("Agents OPJ");
    ws2.columns = [
      { header: "Agent", key: "agent", width: 30 },
      { header: "Matricule", key: "matricule", width: 15 },
      { header: "Commissariat", key: "commissariat", width: 30 },
      { header: "Dossiers traités", key: "traites", width: 18 },
      { header: "Dossiers en cours", key: "enCours", width: 18 },
      { header: "Taux résolution", key: "taux", width: 16 },
      { header: "Performance", key: "perf", width: 15 },
    ];
    applyHeader(ws2);
    agentData.forEach(a => {
      const total = (a.traites || 0) + (a.enCours || 0);
      const taux = total > 0 ? Math.round((a.traites / total) * 100) + "%" : "N/A";
      const perf = parseInt(taux) >= 70 ? "Excellent" : parseInt(taux) >= 50 ? "Bon" : parseInt(taux) >= 30 ? "Moyen" : "Insuffisant";
      const row = ws2.addRow({ ...a, taux, perf });
      applyDataBorders(row);
      const perfCell = row.getCell("perf");
      if (perf === "Excellent") perfCell.font = { color: { argb: "FF10B981" }, bold: true };
      else if (perf === "Insuffisant") perfCell.font = { color: { argb: "FFFF0000" }, bold: true };
    });

    // ONGLET 3 — RÉSUMÉ
    const ws3 = wb.addWorksheet("Résumé");
    ws3.columns = [
      { header: "Indicateur", key: "indicateur", width: 40 },
      { header: "Valeur", key: "valeur", width: 20 },
    ];
    applyHeader(ws3);
    const summary = [
      { indicateur: "Période", valeur: `Semaine ${weekNum} — ${dateStr}` },
      { indicateur: "Total plaintes cette semaine", valeur: summaryData.totalWeek || 0 },
      { indicateur: "Plaintes traitées", valeur: summaryData.traitees || 0 },
      { indicateur: "Plaintes en cours", valeur: summaryData.enCours || 0 },
      { indicateur: "Plaintes classées", valeur: summaryData.classees || 0 },
      { indicateur: "Nombre de commissariats actifs", valeur: stationData.length },
      { indicateur: "Nombre d'agents OPJ", valeur: agentData.length },
      { indicateur: "Taux d'élucidation global", valeur: summaryData.totalWeek > 0 ? Math.round(((summaryData.traitees || 0) / summaryData.totalWeek) * 100) + "%" : "N/A" },
    ];
    summary.forEach(s => { const row = ws3.addRow(s); applyDataBorders(row); row.getCell("indicateur").alignment = { horizontal: "left" }; });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }
}
