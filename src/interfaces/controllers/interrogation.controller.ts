import { Request, Response } from "express";
export const createInterrogation = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const getAllInterrogations = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const getInterrogation = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const updateInterrogation = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const deleteInterrogation = async (_: Request, res: Response) =>
  res.json({ success: true });
