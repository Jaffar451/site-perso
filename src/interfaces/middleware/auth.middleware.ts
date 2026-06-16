import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../../models/user.model";
import { env } from "../../config/env";
import { CustomRequest } from "../../types/express-request";

/**
 * 🔐 1. Middleware d'authentification
 */
export const authenticate = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Format de token invalide ou manquant" });
    }

    const token = authHeader.split(" ")[1];
    const secret = env.jwt.secret;

    if (!secret) {
      console.error("[AUTH] ❌ CRITIQUE : JWT_SECRET manquant");
      return res.status(500).json({ message: "Erreur de configuration serveur" });
    }

    const decoded: any = jwt.verify(token, secret);

    // ✅ Optimisation : On récupère l'utilisateur avec ses relations si nécessaire
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Utilisateur révoqué ou introuvable" });
    }

    // ✅ Gestion robuste de l'état du compte (is_active ou isActive)
    const rawUser = user.get({ plain: true }); // Plus propre que dataValues
    const isActive = rawUser.isActive ?? rawUser.is_active ?? true;

    if (!isActive) {
      console.warn(`[AUTH] ⛔ Compte désactivé : ${rawUser.email}`);
      return res.status(403).json({
        success: false,
        message: "Votre compte est désactivé. Veuillez contacter le Ministère.",
      });
    }

    req.user = user;
    return next();
  } catch (err: any) {
    const msg = err.name === "TokenExpiredError" ? "Session expirée" : "Session invalide";
    return res.status(401).json({ success: false, message: msg });
  }
};

export const protect = authenticate;

/**
 * 👮 2. Middleware d'autorisation par rôles
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Non authentifié" });

    // ✅ Normalisation pour éviter les erreurs de casse (ex: ADMIN vs admin)
    const userRole = req.user.role.toLowerCase();
    const roles = allowedRoles.map(r => r.toLowerCase());

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Niveau requis : ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
};

export const isAdmin = authorize(["admin"]);

/**
 * 👮‍♂️ 3. Middleware pour les Chefs d'Unité
 */
export const isStationChief = authorize(["admin", "commissaire", "inspecteur"]);

/**
 * 🔒 4. Vérification propriétaire de la station
 */
export const ownsStationOrAdmin = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Non authentifié" });

  if (user.role === "admin") return next();

  // Extraction propre de l'ID (params ou query)
  const stationIdRaw = req.params.stationId || req.body.policeStationId;
  const targetStationId = parseInt(stationIdRaw);

  if (user.role === "commissaire") {
    if (user.policeStationId !== targetStationId) {
      console.warn(`[AUTH] ⛔ Tentative d'accès hors juridiction - User ${user.id}`);
      return res.status(403).json({
        success: false,
        message: "Accès restreint aux agents de votre juridiction uniquement",
      });
    }
  }

  next();
};