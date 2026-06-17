import { Request, Response } from "express";
export class BailiffController {
  async getMyMissions(_: Request, res: Response) {
    return res.status(501).json({ success: false, message: "Endpoint non implémenté" });
  }
  async validateMission(_: Request, res: Response) {
    return res.status(501).json({ success: false, message: "Endpoint non implémenté" });
  }
}
