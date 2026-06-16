import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import User from "../../models/user.model";
import RefreshToken from "../../models/refreshToken.model";
import { registerSchema, loginSchema } from "../../schemas/auth.schema";
import { env } from "../../config/env";

type LoginInput = z.infer<typeof loginSchema>;

const { 
  secret: JWT_SECRET, 
  refreshSecret: REFRESH_SECRET, 
  expiration: JWT_EXPIRES_IN, 
  refreshExpiration: REFRESH_EXPIRES_IN 
} = env.jwt;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const signToken = (user: any) => 
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

const signRefresh = (user: any) => 
  jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as any });

const publicUser = (u: any) => ({ 
  id: u.id, 
  firstname: u.firstname, 
  lastname: u.lastname, 
  email: u.email, 
  role: u.role ? u.role.toLowerCase() : "citizen",
  telephone: u.telephone || null
});

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response) => {
  try {
    // Validation des données entrantes via le schéma Zod
    const body = registerSchema.parse(req.body);
    const emailNormalized = body.email.toLowerCase().trim();

    const exists = await User.findOne({ where: { email: emailNormalized } });
    if (exists) return res.status(409).json({ message: "Email déjà utilisé" });

    const hashedPass = await bcrypt.hash(body.password, 10);
    
    const user = await User.create({ 
      ...body, 
      email: emailNormalized,
      password: hashedPass, 
      role: "citizen" 
    });

    return res.status(201).json({
      success: true,
      user: publicUser(user)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erreur validation Register:", error.errors);
      return res.status(400).json({ message: "Données d'inscription invalides", details: error.errors });
    }
    console.error("Erreur register:", error);
    return res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response) => {
  const LOCK_DURATION_MIN = 15;
  const MAX_ATTEMPTS = 5;

  try {
    const body: LoginInput = loginSchema.parse(req.body);
    const identifierNormalized = body.identifier.trim();

    const user = (await User.findOne({
      where: { 
        [Op.or]: [
          { email: identifierNormalized.toLowerCase() }, 
          { matricule: identifierNormalized } 
        ] 
      },
    })) as any;

    if (!user) return res.status(401).json({ message: "Identifiants invalides" });
    
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(403).json({ message: "Compte verrouillé temporairement." });
    }

    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) {
      user.failedAttempts = (user.failedAttempts || 0) + 1;
      if (user.failedAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MIN * 60 * 1000);
      }
      await user.save();
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    // Reset en cas de succès
    user.failedAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = signToken(user);
    const refresh = signRefresh(user);

    // Expiration du refresh token (7 jours)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await RefreshToken.destroy({ where: { userId: user.id } });
    await RefreshToken.create({ 
      userId: user.id, 
      token: refresh,
      expiryDate: expiryDate
    });

    return res.json({ 
      success: true,
      token, 
      refresh, 
      user: publicUser(user) 
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: "Format de requête invalide", details: err.errors });
    }
    console.error("Erreur login:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN & LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(401).json({ message: "Token manquant" });

    const decoded: any = jwt.verify(refresh, REFRESH_SECRET);
    const storedToken = await RefreshToken.findOne({ where: { token: refresh, userId: decoded.id } });

    if (!storedToken || new Date() > storedToken.expiryDate) {
      return res.status(401).json({ message: "Session expirée, veuillez vous reconnecter" });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable" });

    return res.json({ success: true, token: signToken(user) });
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ message: "Token requis" });
    await RefreshToken.destroy({ where: { token: refresh } });
    return res.status(200).json({ success: true, message: "Déconnexion réussie" });
  } catch (err) {
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export const me = async (req: Request, res: Response) => {
  // @ts-ignore
  if (req.user) return res.json({ success: true, user: publicUser(req.user) });
  return res.status(401).json({ message: "Non authentifié" });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const { firstname, lastname, email, telephone, password } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ where: { email: email.toLowerCase() } });
      if (emailExists) return res.status(409).json({ message: "Email déjà utilisé" });
      user.email = email.toLowerCase().trim();
    }

    if (firstname) user.firstname = firstname.trim();
    if (lastname) user.lastname = lastname.trim();
    if (telephone) user.telephone = telephone.trim();

    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    return res.json({ success: true, message: "Profil mis à jour", user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: "Erreur lors de la mise à jour" });
  }
};

export const createSuperAdmin = async (req: Request, res: Response) => {
  return res.status(501).json({ message: "Non implémenté" });
};