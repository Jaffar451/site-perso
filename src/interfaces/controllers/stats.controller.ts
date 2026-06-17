import { Request, Response } from "express";
export const getDashboardStats = async (_: Request, res: Response) =>
  res.json({ success: true, data: {} });
export const getMonthlyTrends = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
