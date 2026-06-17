import { Request, Response } from "express";
export const getLegalTexts = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const getLawyers = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const seedResources = async (_: Request, res: Response) =>
  res.json({ success: true, message: "Seed OK" });
