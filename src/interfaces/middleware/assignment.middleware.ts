// src/middleware/assignment.middleware.ts
import { Request, Response, NextFunction } from "express";
import Assignment from "../../models/assignment.model";

type AssignmentRole =
  | "officier_police"
  | "prosecutor_supervisor"
  | "judge_instruction"
  | "judge_trial"
  | "clerk_instruction"
  | "clerk_trial";

/**
 * Vérifie si l'utilisateur connecté est assigné à l'affaire
 * avec un rôle spécifique.
 */
export function requireAssignmentRole(...assignedRoles: AssignmentRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    // Find caseId from params or body
    const caseIdParam = req.params.caseId || req.body.caseId || req.params.id;

    if (!user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    if (!caseIdParam) {
      return res
        .status(400)
        .json({
          message: "ID de l'affaire manquant dans la requête (params ou body).",
        });
    }
    const caseId = parseInt(caseIdParam, 10);
    if (isNaN(caseId)) {
      return res.status(400).json({ message: "ID de l'affaire invalide." });
    }

    try {
      const assignment = await Assignment.findOne({
        where: {
          caseId: caseId,
          userId: user.id,
        },
      });

      if (!assignment) {
        return res
          .status(403)
          .json({
            message: "Accès refusé : vous n'êtes pas assigné à cette affaire.",
          });
      }

      if (!assignedRoles.includes(assignment.role as AssignmentRole)) {
        return res.status(403).json({
          message: `Rôle insuffisant. Requis: ${assignedRoles.join(" ou ")}, vous avez: ${assignment.role}.`,
        });
      }

      // Pass the assignment to the next middleware/controller
      (req as any).assignment = assignment;
      return next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Erreur lors de la vérification des permissions." });
    }
  };
}
