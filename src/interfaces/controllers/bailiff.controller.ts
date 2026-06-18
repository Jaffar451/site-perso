import { Request, Response } from "express";
import { Summon } from "../../models";

export class BailiffController {
  async getMyMissions(_: Request, res: Response) {
    try {
      const missions = await Summon.findAll({
        order: [["scheduledAt", "DESC"]],
        limit: 50,
      });
      return res.json({ success: true, data: missions });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async validateMission(req: Request, res: Response) {
    try {
      const { missionId, latitude, longitude, notes } = req.body;
      const mission = await Summon.findByPk(missionId);
      if (!mission) return res.status(404).json({ success: false, message: "Mission introuvable" });
      await mission.update({
        status: "signified",
        signifiedAt: new Date(),
        latitude, longitude,
        notes: notes || null,
      } as any);
      return res.json({ success: true, data: mission, message: "Signification validée" });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
