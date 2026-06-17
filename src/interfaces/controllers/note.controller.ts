import { Request, Response } from "express";
export const listNotes = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const createNote = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const getNote = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const updateNote = async (_: Request, res: Response) =>
  res.status(501).json({ success: false, message: "Endpoint non implémenté" });
export const deleteNote = async (_: Request, res: Response) =>
  res.json({ success: true });
