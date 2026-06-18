import { Request, Response } from "express";
import { Complaint, CaseModel } from "../../models";

export class LawyerController {
  async getMyTracking(req: Request, res: Response) {
    try {
      const cases = await CaseModel.findAll({
        include: [{ model: Complaint, as: "complaint", attributes: ["id", "title", "status", "trackingCode", "location"] }],
        order: [["createdAt", "DESC"]],
        limit: 50,
      });
      return res.json({ success: true, data: cases });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
