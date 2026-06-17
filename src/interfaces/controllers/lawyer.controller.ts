import { Request, Response } from "express";
export class LawyerController {
  async getMyTracking(_: Request, res: Response) {
    return res.status(501).json({ success: false, message: "Endpoint non implémenté" });
  }
}
