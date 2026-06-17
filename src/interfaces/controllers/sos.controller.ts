import { Request, Response } from "express";
import { SosAlert } from "../../models";

export const createSosAlert = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { latitude, longitude, message } = req.body;
    const alert = await SosAlert.create({
      userId,
      latitude: latitude || null,
      longitude: longitude || null,
      message: message || "SOS",
      status: "active",
    } as any);
    return res.status(201).json({ success: true, data: alert });
  } catch (error: any) {
    console.error("Erreur createSosAlert:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const getStationAlerts = async (req: Request, res: Response) => {
  try {
    const { stationId } = req.params;
    const alerts = await SosAlert.findAll({
      where: { policeStationId: stationId },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });
    return res.json({ success: true, data: alerts });
  } catch (error: any) {
    console.error("Erreur getStationAlerts:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const resolveSosAlert = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const alert = await SosAlert.findByPk(Number(id));
    if (!alert) return res.status(404).json({ success: false, message: "Alerte non trouvée" });
    await alert.update({ status: "resolved" });
    return res.json({ success: true, data: alert });
  } catch (error: any) {
    console.error("Erreur resolveSosAlert:", error.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
