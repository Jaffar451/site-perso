import { Request, Response } from "express";
import { Warrant } from "../../models";

export const getAll = async (_: Request, res: Response) => {
  try {
    const warrants = await Warrant.findAll({ order: [["createdAt", "DESC"]] });
    return res.json({ success: true, data: warrants });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
