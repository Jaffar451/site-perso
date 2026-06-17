import { Request, Response } from "express";
export const createProsecution = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const getProsecutions = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
