import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import Complaint from "../../models/complaint.model";
import PoliceStation from "../../models/policeStation.model";
import { sequelize } from "../../config/database";
import Prison from "../../models/prison.model";

export const getPrisonStats = async (_req: Request, res: Response) => {
  try {
    const prisons = await Prison.findAll({
      attributes: [
        "id",
        "name",
        "city",
        "capacity",
        [
          literal(`(
            SELECT COUNT(*) FROM incarcerations AS i
            WHERE i.prison_id = "Prison".id AND i.status IN ('preventive', 'convicted')
          )`),
          "currentInmates",
        ],
      ],
    });

    const stats = prisons.map((p: any) => {
      const current = parseInt(p.getDataValue("currentInmates")) || 0;
      const capacity = p.capacity || 1;
      return {
        id: p.id,
        name: p.name,
        city: p.city,
        capacity,
        currentInmates: current,
        occupancyRate: Math.round((current / capacity) * 100),
      };
    });

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("Erreur getPrisonStats:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getPoliceStats = async (req: Request, res: Response) => {
  try {
    const { period = "week" } = req.query;

    let dateFrom = new Date();
    if (period === "week") dateFrom.setDate(dateFrom.getDate() - 7);
    else if (period === "month") dateFrom.setMonth(dateFrom.getMonth() - 1);
    else dateFrom.setFullYear(dateFrom.getFullYear() - 1);

    const byStation = await Complaint.findAll({
      attributes: [
        "policeStationId",
        [fn("COUNT", col("Complaint.id")), "total"],
        [fn("SUM", literal(`CASE WHEN status = 'soumise' THEN 1 ELSE 0 END`)), "soumises"],
        [fn("SUM", literal(`CASE WHEN status = 'en_cours_OPJ' THEN 1 ELSE 0 END`)), "enCours"],
        [fn("SUM", literal(`CASE WHEN status IN ('transmise_parquet','saisi_juge','instruction','audience_programmée','jugée') THEN 1 ELSE 0 END`)), "traitees"],
        [fn("SUM", literal(`CASE WHEN status IN ('classée_sans_suite_par_OPJ','classée_sans_suite_par_procureur','non_lieu') THEN 1 ELSE 0 END`)), "classees"],
      ],
      include: [
        {
          model: PoliceStation,
          as: "originStation",
          attributes: ["id", "name", "city", "district", "type"],
        },
      ],
      where: {
        createdAt: { [Op.gte]: dateFrom },
        policeStationId: { [Op.ne]: null },
      },
      group: ["policeStationId", "originStation.id"],
      order: [[literal("total"), "DESC"]],
      raw: false,
    });

    const byDistrict = await Complaint.findAll({
      attributes: [
        [col("originStation.district"), "district"],
        [col("originStation.city"), "city"],
        [fn("COUNT", col("Complaint.id")), "total"],
        [fn("SUM", literal(`CASE WHEN status = 'soumise' THEN 1 ELSE 0 END`)), "soumises"],
        [fn("SUM", literal(`CASE WHEN status IN ('transmise_parquet','saisi_juge','instruction','audience_programmée','jugée') THEN 1 ELSE 0 END`)), "traitees"],
      ],
      include: [
        {
          model: PoliceStation,
          as: "originStation",
          attributes: [],
        },
      ],
      where: {
        createdAt: { [Op.gte]: dateFrom },
        policeStationId: { [Op.ne]: null },
      },
      group: [col("originStation.district"), col("originStation.city")],
      order: [[literal("total"), "DESC"]],
      raw: true,
    });

    const globalCounts = await Complaint.findOne({
      attributes: [
        [fn("COUNT", col("id")), "total"],
        [fn("SUM", literal(`CASE WHEN status = 'soumise' THEN 1 ELSE 0 END`)), "pending"],
        [fn("SUM", literal(`CASE WHEN status IN ('en_cours_OPJ','attente_validation') THEN 1 ELSE 0 END`)), "inProgress"],
        [fn("SUM", literal(`CASE WHEN status IN ('transmise_parquet','saisi_juge','instruction','audience_programmée','jugée') THEN 1 ELSE 0 END`)), "processed"],
      ],
      where: { createdAt: { [Op.gte]: dateFrom } },
      raw: true,
    });

    res.json({
      success: true,
      period,
      summary: globalCounts,
      byStation: byStation.map((c: any) => ({
        station: c.originStation
          ? { id: c.originStation.id, name: c.originStation.name, city: c.originStation.city, district: c.originStation.district, type: c.originStation.type }
          : null,
        total: parseInt(c.getDataValue("total")) || 0,
        soumises: parseInt(c.getDataValue("soumises")) || 0,
        enCours: parseInt(c.getDataValue("enCours")) || 0,
        traitees: parseInt(c.getDataValue("traitees")) || 0,
        classees: parseInt(c.getDataValue("classees")) || 0,
      })),
      byDistrict,
    });
  } catch (error: any) {
    console.error("Erreur getPoliceStats:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getWeeklyReportStats = async (req: Request, res: Response) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);

    const totalWeek = await Complaint.count({ where: { createdAt: { [Op.gte]: dateFrom } } });
    const processed = await Complaint.count({
      where: {
        createdAt: { [Op.gte]: dateFrom },
        status: { [Op.in]: ["transmise_parquet", "saisi_juge", "instruction", "audience_programmée", "jugée"] },
      },
    });
    const pending = await Complaint.count({
      where: {
        createdAt: { [Op.gte]: dateFrom },
        status: { [Op.in]: ["soumise", "en_cours_OPJ", "attente_validation"] },
      },
    });
    const classees = await Complaint.count({
      where: {
        createdAt: { [Op.gte]: dateFrom },
        status: { [Op.in]: ["classée_sans_suite_par_OPJ", "classée_sans_suite_par_procureur", "non_lieu"] },
      },
    });

    res.json({
      success: true,
      processedCases: processed,
      pendingCases: pending,
      incidents: classees,
      totalWeek,
    });
  } catch (error: any) {
    console.error("Erreur getWeeklyReportStats:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
