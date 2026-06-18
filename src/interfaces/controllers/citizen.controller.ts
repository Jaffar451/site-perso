import { Request, Response } from "express";
import { Complaint } from "../../models";

export class CitizenController {
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const complaints = await Complaint.findAll({ where: { citizenId: userId } });
      const list = Array.isArray(complaints) ? complaints : [];
      return res.json({
        success: true,
        data: {
          totalComplaints: list.length,
          pending: list.filter((c: any) => ["soumise", "en_cours_OPJ"].includes(c.status)).length,
          resolved: list.filter((c: any) => ["jugée", "non_lieu"].includes(c.status)).length,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const complaints = await Complaint.findAll({
        where: { citizenId: userId },
        order: [["updatedAt", "DESC"]],
        limit: 20,
        attributes: ["id", "title", "status", "updatedAt", "trackingCode"],
      });
      return res.json({ success: true, data: complaints });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
