import cron from "node-cron";
import { Op, fn, col, literal } from "sequelize";
import { Prison, AuditLog, Complaint, PoliceStation, User } from "../../models";
import { sequelize } from "../../config/database";
import { ExportService } from "./export.service";
import { NotificationService } from "./notification.service";

const exportService = new ExportService();
const notificationService = new NotificationService();

export class SchedulerService {
  public static init() {
    // 1. Rapport de surpopulation (Tous les lundis à 8h00)
    cron.schedule("0 8 * * 1", async () => {
      console.log("🚀 [CRON] Génération du rapport de surpopulation...");
      await this.sendWeeklyPrisonReport();
    });

    // 2. Rapport plaintes par commissariat/quartier (Tous les lundis à 9h00)
    cron.schedule("0 9 * * 1", async () => {
      console.log("📋 [CRON] Génération du rapport plaintes par commissariat...");
      await this.sendWeeklyComplaintReport();
    });

    // 3. Nettoyage des logs d'audit (Le 1er de chaque mois à minuit)
    cron.schedule("0 0 1 * *", async () => {
      console.log("🧹 [CRON] Nettoyage des anciens journaux d'audit...");
      await this.cleanupAuditLogs();
    });
  }

  /**
   * 🧹 Supprime les logs plus vieux de 90 jours pour optimiser la DB
   */
  private static async cleanupAuditLogs() {
    try {
      const retentionDays = 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await AuditLog.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate, // Supprime tout ce qui est "inférieur" à (avant) la date butoir
          },
        },
      });

      console.log(
        `✅ [CRON] Nettoyage terminé : ${deletedCount} logs anciens supprimés.`,
      );
    } catch (error: any) {
      console.error(
        "❌ [CRON] Erreur lors du nettoyage des logs:",
        error.message,
      );
    }
  }

  public static async sendWeeklyComplaintReport() {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 7);

      // 1. PLAINTES PAR COMMISSARIAT
      const byStation = await Complaint.findAll({
        attributes: [
          "policeStationId",
          [fn("COUNT", col("Complaint.id")), "total"],
          [fn("SUM", literal(`CASE WHEN status = 'soumise' THEN 1 ELSE 0 END`)), "soumises"],
          [fn("SUM", literal(`CASE WHEN status IN ('en_cours_OPJ','attente_validation') THEN 1 ELSE 0 END`)), "enCours"],
          [fn("SUM", literal(`CASE WHEN status IN ('transmise_parquet','saisi_juge','instruction','audience_programmée','jugée') THEN 1 ELSE 0 END`)), "traitees"],
          [fn("SUM", literal(`CASE WHEN status IN ('classée_sans_suite_par_OPJ','classée_sans_suite_par_procureur','non_lieu') THEN 1 ELSE 0 END`)), "classees"],
        ],
        include: [{
          model: PoliceStation,
          as: "originStation",
          attributes: ["name", "city", "district", "type"],
        }],
        where: {
          createdAt: { [Op.gte]: dateFrom },
          policeStationId: { [Op.ne]: null },
        },
        group: ["policeStationId", "originStation.id"],
        order: [[literal("total"), "DESC"]],
        raw: false,
      });

      const stationData = byStation.map((c: any) => ({
        commissariat: c.originStation?.name || "Inconnu",
        ville: c.originStation?.city || "-",
        quartier: c.originStation?.district || "-",
        type: c.originStation?.type || "-",
        total: parseInt(c.getDataValue("total")) || 0,
        soumises: parseInt(c.getDataValue("soumises")) || 0,
        enCours: parseInt(c.getDataValue("enCours")) || 0,
        traitees: parseInt(c.getDataValue("traitees")) || 0,
        classees: parseInt(c.getDataValue("classees")) || 0,
      }));

      // 2. PERFORMANCES AGENTS OPJ
      const agents = await User.findAll({
        where: { role: { [Op.in]: ["officier_police", "inspecteur", "commissaire"] } },
        attributes: ["id", "firstname", "lastname", "matricule", "policeStationId"],
        include: [{ model: PoliceStation, as: "station", attributes: ["name"] }],
      });

      const agentData = [];
      for (const agent of agents) {
        const a = agent as any;
        const traites = await Complaint.count({
          where: {
            assignedOpjId: a.id,
            createdAt: { [Op.gte]: dateFrom },
            status: { [Op.in]: ["transmise_parquet", "saisi_juge", "instruction", "audience_programmée", "jugée"] },
          },
        }).catch(() => 0);
        const enCours = await Complaint.count({
          where: {
            assignedOpjId: a.id,
            createdAt: { [Op.gte]: dateFrom },
            status: { [Op.in]: ["soumise", "en_cours_OPJ", "attente_validation"] },
          },
        }).catch(() => 0);

        agentData.push({
          agent: `${(a.lastname || "").toUpperCase()} ${a.firstname || ""}`,
          matricule: a.matricule || "-",
          commissariat: a.station?.name || "-",
          traites,
          enCours,
        });
      }

      // 3. RÉSUMÉ GLOBAL
      const totalWeek = stationData.reduce((s, d) => s + d.total, 0);
      const totalTraitees = stationData.reduce((s, d) => s + d.traitees, 0);
      const totalEnCours = stationData.reduce((s, d) => s + d.enCours, 0);
      const totalClassees = stationData.reduce((s, d) => s + d.classees, 0);

      // 4. GÉNÉRATION EXCEL 3 ONGLETS
      const excelBuffer = await exportService.generateWeeklyReport(
        stationData,
        agentData,
        { totalWeek, traitees: totalTraitees, enCours: totalEnCours, classees: totalClassees }
      );

      const recipients = process.env.REPORT_RECIPIENTS?.split(",") || [process.env.SMTP_USER || "cabinet@justice.ne"];
      const weekNum = Math.ceil(new Date().getDate() / 7);

      for (const email of recipients) {
        await notificationService.sendMailWithAttachment(
          email.trim(),
          `📊 RAPPORT HEBDOMADAIRE S${weekNum} — Performances Commissariats & Agents`,
          `Rapport de la semaine ${weekNum} (${new Date().toLocaleDateString("fr-FR")}).\n\n` +
          `• ${stationData.length} commissariats actifs\n` +
          `• ${agentData.length} agents OPJ\n` +
          `• ${totalWeek} plaintes cette semaine\n` +
          `• Taux d'élucidation : ${totalWeek > 0 ? Math.round((totalTraitees / totalWeek) * 100) : 0}%`,
          `Rapport_Hebdo_S${weekNum}_${new Date().toISOString().split("T")[0]}.xlsx`,
          excelBuffer,
        );
      }

      console.log(`✅ [CRON] Rapport hebdo envoyé — ${stationData.length} commissariats, ${agentData.length} agents.`);
    } catch (error: any) {
      console.error("❌ [CRON] Erreur rapport hebdo:", error.message);
    }
  }

  private static async sendWeeklyPrisonReport() {
    try {
      const prisonData = await Prison.findAll({
        attributes: [
          "id",
          "name",
          "city",
          "capacity",
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM incarcerations AS i 
              WHERE i.prison_id = "Prison".id AND i.status IN ('preventive', 'convicted')
            )`),
            "currentInmatesCount",
          ],
        ],
      });

      const report = prisonData.map((p: any) => {
        const current = parseInt(p.getDataValue("currentInmatesCount")) || 0;
        const capacity = p.capacity || 1;
        const rate = Math.round((current / capacity) * 100);

        return {
          ID: p.id,
          Établissement: p.name,
          Ville: p.city,
          Capacité: capacity,
          Détenus: current,
          Taux: `${rate}%`,
          Alerte: rate > 100 ? "OUI" : "NON",
        };
      });

      const excelBuffer = await exportService.generatePrisonExcel(report);
      const recipients = process.env.REPORT_RECIPIENTS?.split(",") || [
        "cabinet@justice.ne",
      ];

      for (const email of recipients) {
        await notificationService.sendMailWithAttachment(
          email,
          "📊 RAPPORT HEBDO : Occupation des prisons",
          "Veuillez trouver ci-joint l'état de la population carcérale.",
          `Situation_Penitentiaire_${new Date().toISOString().split("T")[0]}.xlsx`,
          excelBuffer as any,
        );
      }

      console.log("✅ [CRON] Rapports envoyés.");
    } catch (error: any) {
      console.error("❌ [CRON] Erreur:", error.message);
    }
  }
}
