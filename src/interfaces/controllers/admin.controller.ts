// src/interfaces/controllers/admin.controller.ts
import { Request, Response } from "express";
import { Op } from "sequelize";
import { User, AuditLog, CaseModel, Complaint, sequelize } from "../../models";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [usersCount, activeCases, pendingComplaints, recentLogs] = await Promise.all([
      User.count().catch(() => 0),

      CaseModel.count({ where: { status: { [Op.in]: ["pending", "active"] } } }).catch(err => {
        console.warn("[DASHBOARD] Erreur CaseModel Status:", err.message);
        return 0;
      }),

      // ✅ CORRECTION : "EN_ATTENTE" → "soumise" (valeur réelle de l'enum Complaint)
      Complaint.count({
        where: {
          status: { [Op.in]: ["soumise", "en_cours_OPJ", "attente_validation"] }
        }
      }).catch(err => {
        console.error("[DASHBOARD] Erreur ENUM Complaint:", err.message);
        return 0;
      }),

      AuditLog.count({
        where: {
          createdAt: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }).catch(() => 0),
    ]);

    const [statusStats, categoryStats, monthlyStats, complaints_total] = await Promise.all([
      sequelize.query(
        `SELECT status, COUNT(*)::int as count FROM "Complaints" GROUP BY status ORDER BY count DESC`,
        { type: 'SELECT' }
      ).catch(() => []),

      sequelize.query(
        `SELECT category, COUNT(*)::int as count FROM "Complaints" WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 10`,
        { type: 'SELECT' }
      ).catch(() => []),

      sequelize.query(
        `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*)::int as count FROM "Complaints" WHERE created_at >= NOW() - INTERVAL '6 months' GROUP BY month ORDER BY month ASC`,
        { type: 'SELECT' }
      ).catch(() => []),

      Complaint.count().catch(() => 0),
    ]);

    const regionalStats = await sequelize.query(
      `SELECT ps.district, ps.city, COUNT(c.id)::int as total FROM "Complaints" c JOIN police_stations ps ON c.police_station_id = ps.id WHERE ps.district IS NOT NULL GROUP BY ps.district, ps.city ORDER BY total DESC`,
      { type: 'SELECT' }
    ).catch(() => []);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          users_total:      usersCount,
          complaints_total: complaints_total,
          complaints_open:  pendingComplaints,
          active_cases:     activeCases,
          logs_total:       recentLogs,
        },
        statusStats,
        categoryStats,
        monthlyStats,
        regionalStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur fatale getDashboardStats:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
    });
  }
};

export const getSystemHealth = async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    await sequelize.authenticate();
    const latency = Date.now() - start;

    const [usersCount] = await sequelize.query("SELECT COUNT(*)::int as c FROM users", { type: "SELECT" }).catch(() => [{ c: 0 }]) as any;
    const [complaintsCount] = await sequelize.query('SELECT COUNT(*)::int as c FROM "Complaints"', { type: "SELECT" }).catch(() => [{ c: 0 }]) as any;
    const [tablesCount] = await sequelize.query("SELECT COUNT(*)::int as c FROM information_schema.tables WHERE table_schema='public'", { type: "SELECT" }).catch(() => [{ c: 0 }]) as any;

    return res.status(200).json({
      success: true,
      data: {
        status:    "healthy",
        database:  "connected",
        latency,
        uptime:    process.uptime(),
        memory:    process.memoryUsage(),
        nodeVersion: process.version,
        dbStats: {
          users: usersCount?.c || 0,
          complaints: complaintsCount?.c || 0,
          tables: tablesCount?.c || 0,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur getSystemHealth:", error);
    return res.status(503).json({
      success: false,
      status:    "unhealthy",
      database:  "disconnected",
      error:     String(error),
      timestamp: new Date().toISOString(),
    });
  }
};

export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const level = req.query.level as string;

    const where: any = {};
    if (level) where.level = level;

    const logs = await AuditLog.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    return res.status(200).json({
      success: true,
      data: logs.rows,
      pagination: {
        total: logs.count,
        page,
        limit,
        pages: Math.ceil(logs.count / limit),
      },
    });
  } catch (error) {
    console.error("Erreur getSystemLogs:", error);
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des logs" });
  }
};

export const getSecuritySettings = async (_req: Request, res: Response) => {
  try {
    const settings = {
      twoFactorEnabled: process.env.TWO_FACTOR_ENABLED === "true",
      sessionTimeout:   parseInt(process.env.SESSION_TIMEOUT || "3600"),
      passwordPolicy: {
        minLength:        parseInt(process.env.PASSWORD_MIN_LENGTH || "8"),
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPER   === "true",
        requireNumbers:   process.env.PASSWORD_REQUIRE_NUMBERS === "true",
        requireSpecial:   process.env.PASSWORD_REQUIRE_SPECIAL === "true",
      },
      ipWhitelist: (process.env.ADMIN_IP_WHITELIST || "").split(",").filter(Boolean),
      lastUpdated: new Date().toISOString(),
    };
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération des paramètres de sécurité" });
  }
};

export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const { twoFactorEnabled, sessionTimeout, passwordPolicy } = req.body;
    const updated = {
      twoFactorEnabled: twoFactorEnabled ?? process.env.TWO_FACTOR_ENABLED === "true",
      sessionTimeout:   sessionTimeout   ?? parseInt(process.env.SESSION_TIMEOUT || "3600"),
      passwordPolicy:   passwordPolicy   ?? { minLength: 8, requireUppercase: true, requireNumbers: true, requireSpecial: true },
      updatedAt: new Date().toISOString(),
    };
    await AuditLog.create({
      action:        "SECURITY_SETTINGS_UPDATED",
      resource_type: "System",
      user_id:       (req as any).user?.id,
      metadata:      { changes: updated },
    }).catch(e => console.warn("Impossible de créer le log d'audit"));

    return res.status(200).json({ success: true, message: "Paramètres de sécurité mis à jour", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour des paramètres" });
  }
};

export const getMaintenanceStatus = async (_req: Request, res: Response) => {
  try {
    const maintenance = {
      enabled:          process.env.MAINTENANCE_MODE    === "true",
      message:          process.env.MAINTENANCE_MESSAGE || "Maintenance en cours",
      scheduledStart:   process.env.MAINTENANCE_START   || null,
      scheduledEnd:     process.env.MAINTENANCE_END     || null,
      affectedServices: (process.env.MAINTENANCE_SERVICES || "api,admin").split(","),
    };
    return res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur lors de la récupération du statut de maintenance" });
  }
};

export const setMaintenanceStatus = async (req: Request, res: Response) => {
  try {
    const { enabled, message, scheduledStart, scheduledEnd, affectedServices } = req.body;
    const status = {
      enabled:          enabled          ?? false,
      message:          message          || "Maintenance en cours",
      scheduledStart:   scheduledStart   || null,
      scheduledEnd:     scheduledEnd     || null,
      affectedServices: affectedServices || ["api", "admin"],
      updatedAt: new Date().toISOString(),
      updatedBy: (req as any).user?.id,
    };
    await AuditLog.create({
      action:        "MAINTENANCE_STATUS_CHANGED",
      resource_type: "System",
      user_id:       (req as any).user?.id,
      metadata:      { current: status },
    }).catch(e => console.warn("Impossible de créer le log d'audit"));

    return res.status(200).json({
      success: true,
      message: `Mode maintenance ${enabled ? "activé" : "désactivé"}`,
      data:    status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur lors de la mise à jour du statut de maintenance" });
  }
};