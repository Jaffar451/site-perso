import { Request, Response } from "express";
import { LegalText, Lawyer } from "../../models";

export const getLegalTexts = async (_: Request, res: Response) => {
  try {
    const texts = await LegalText.findAll({ order: [["createdAt", "DESC"]] });
    return res.json({ success: true, data: texts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLawyers = async (_: Request, res: Response) => {
  try {
    const lawyers = await Lawyer.findAll({ order: [["createdAt", "DESC"]] });
    return res.json({ success: true, data: lawyers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const seedResources = async (_: Request, res: Response) =>
  res.json({ success: true, message: "Seed OK" });
