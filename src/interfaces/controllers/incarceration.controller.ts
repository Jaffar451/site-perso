import { Request, Response } from "express";
import Incarceration from "../../models/incarceration.model";
import Detainee from "../../models/detainee.model";

// 1. Enregistrer une entree (creer detenu + incarceration)
export const registerEntry = async (req: Request, res: Response) => {
  try {
    const {
      firstname,
      lastname,
      birthDate,
      gender,
      nationality,
      niu,
      photoUrl,
      userId,
      prisonId,
      caseId,
      entryDate,
      expectedReleaseDate,
      status,
      cellNumber,
      observation,
    } = req.body;

    // Creer le detenu
    const detainee = await Detainee.create({
      firstname,
      lastname,
      birthDate,
      gender,
      nationality,
      niu,
      photoUrl,
      userId,
    });

    // Creer l'incarceration
    const incarceration = await Incarceration.create({
      detaineeId: detainee.id,
      prisonId,
      caseId,
      entryDate: entryDate || new Date(),
      expectedReleaseDate,
      status: status || "preventive",
      cellNumber,
      observation,
    });

    return res.status(201).json({
      success: true,
      data: { detainee, incarceration },
    });
  } catch (error: any) {
    console.error("Erreur registerEntry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lister tous les detenus avec leurs incarcerations
export const listInmates = async (_req: Request, res: Response) => {
  try {
    const incarcerations = await Incarceration.findAll({
      include: [{ model: Detainee, as: "detaineeData" }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ success: true, data: incarcerations });
  } catch (error: any) {
    console.error("Erreur listInmates:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Liberer un detenu
export const releaseDetainee = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const incarceration = await Incarceration.findByPk(id);
    if (!incarceration)
      return res
        .status(404)
        .json({ success: false, message: "Incarceration introuvable" });

    await incarceration.update({
      status: "released",
      actualReleaseDate: new Date(),
    });

    return res.status(200).json({ success: true, data: incarceration });
  } catch (error: any) {
    console.error("Erreur releaseDetainee:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Transferer un detenu vers un autre etablissement
export const transferDetainee = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id))
      return res.status(400).json({ success: false, message: "ID invalide" });

    const current = await Incarceration.findByPk(id);
    if (!current)
      return res
        .status(404)
        .json({ success: false, message: "Incarceration introuvable" });

    const { prisonId, cellNumber, observation } = req.body;
    if (!prisonId)
      return res
        .status(400)
        .json({ success: false, message: "prisonId de destination requis" });

    // Sauvegarder le statut original avant de clore
    const originalStatus = current.status;

    // Clore l'incarceration actuelle
    await current.update({
      status: "released",
      actualReleaseDate: new Date(),
      observation: current.observation
        ? `${current.observation} | Transfert`
        : "Transfert",
    });

    // Creer la nouvelle incarceration dans le nouvel etablissement
    const newIncarceration = await Incarceration.create({
      detaineeId: current.detaineeId,
      prisonId,
      caseId: current.caseId,
      entryDate: new Date(),
      expectedReleaseDate: current.expectedReleaseDate,
      status: originalStatus,
      cellNumber,
      observation: observation || "Transfert depuis un autre etablissement",
    });

    return res.status(201).json({ success: true, data: newIncarceration });
  } catch (error: any) {
    console.error("Erreur transferDetainee:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
