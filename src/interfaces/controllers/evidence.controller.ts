import { Request, Response } from "express";
export const listEvidence = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const createEvidence = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const getEvidence = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const updateEvidence = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const deleteEvidence = async (_: Request, res: Response) =>
  res.json({ success: true });
