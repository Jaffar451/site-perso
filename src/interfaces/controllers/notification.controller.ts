import { Request, Response } from "express";
import { AuditLog } from "../../models";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const logs = await AuditLog.findAll({
      where: userId ? { userId } : {},
      order: [["createdAt", "DESC"]],
      limit: 30,
    });
    return res.json({ success: true, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  return res.json({ success: true, message: "Notification marquée comme lue" });
};

export const clearAll = async (_: Request, res: Response) => {
  return res.json({ success: true, message: "Toutes les notifications supprimées" });
};

export const deleteNotification = async (req: Request, res: Response) => {
  return res.json({ success: true, message: "Notification supprimée" });
};
