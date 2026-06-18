import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import { Complaint, User, CaseModel } from "../../models";

export const getDashboardStats = async (_: Request, res: Response) => {
  try {
    const [totalUsers, totalComplaints, totalCases] = await Promise.all([
      User.count().catch(() => 0),
      Complaint.count().catch(() => 0),
      CaseModel.count().catch(() => 0),
    ]);
    return res.json({
      success: true,
      data: {
        totalUsers, totalComplaints, totalCases,
        complaintsResolved: await Complaint.count({ where: { status: { [Op.in]: ["jugée", "non_lieu"] } } }).catch(() => 0),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlyTrends = async (_: Request, res: Response) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = await Complaint.count({ where: { createdAt: { [Op.between]: [start, end] } } }).catch(() => 0);
      months.push({ month: start.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }), count });
    }
    return res.json({ success: true, data: months });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
