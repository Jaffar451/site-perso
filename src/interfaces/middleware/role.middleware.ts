import { Request, Response, NextFunction } from "express";

/**
 * 🛡️ Vérifie si l'utilisateur possède un rôle autorisé.
 * Compare le rôle extrait du Token JWT avec la liste fournie.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session invalide ou utilisateur non authentifié.",
      });
    }

    // ✅ La comparaison est maintenant sensible à la casse et aux underscores (ex: 'officier_police')
    if (!roles.includes(user.role)) {
      console.warn(
        `[AUTH] ⛔ Accès interdit. User: ${user.role}, Requis: ${roles.join(",")}`,
      );
      return res.status(403).json({
        success: false,
        message: `Droits insuffisants. Espace réservé aux rôles : ${roles.join(", ")}`,
      });
    }

    return next();
  };
}

// ==========================================
// 🔐 RACCOURCIS PAR RÔLE UNIQUE (Alignés DB)
// ==========================================
export const onlyAdmin = requireRole("admin");
export const onlyCitizen = requireRole("citizen");
export const onlyPolice = requireRole("officier_police"); // ✅ Corrigé
export const onlyCommissaire = requireRole("commissaire"); // ✅ Corrigé (2 's')
export const onlyProsecutor = requireRole("prosecutor");
export const onlyJudge = requireRole("judge");
export const onlyClerk = requireRole("greffier"); // ✅ Corrigé
export const onlyLawyer = requireRole("lawyer");

// ==========================================
// 🏛️ GROUPES PAR ESPACE DE TRAVAIL
// ==========================================

/**
 * 🚓 ESPACE SÉCURITÉ (Police, Commissaires, Inspecteurs)
 */
export const onlyPoliceSpace = requireRole(
  "admin",
  "officier_police",
  "commissaire",
  "inspecteur",
);

/**
 * ⚖️ ESPACE JUDICIAIRE (Juges, Procureurs, Greffiers)
 */
export const onlyJusticeSpace = requireRole(
  "admin",
  "prosecutor",
  "judge",
  "greffier",
);

/**
 * 🏢 TOUS LES AGENTS DE L'ÉTAT (Accès aux plaintes globales)
 */
export const onlyOfficialAgents = requireRole(
  "admin",
  "officier_police",
  "commissaire",
  "inspecteur",
  "prosecutor",
  "judge",
  "greffier",
);

/**
 * 🛠️ ESPACE MAINTENANCE
 */
export const onlyTechAdmin = requireRole("admin");
