import { Request, Response } from "express";
export class CitizenController {
  async getDashboard(_: Request, res: Response) {
    return res.status(501).json({ success: false, message: "Endpoint non implémenté" });
  }
  async getNotifications(_: Request, res: Response) {
    return res.status(501).json({ success: false, message: "Endpoint non implémenté" });
  }
}
