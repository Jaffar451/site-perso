import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { sequelize } from "../../config/database";
import User from "../../models/user.model";
import Person from "../../models/person.model";
import ProfessionalProfile from "../../models/professionnalProfile.model";
import PoliceStation from "../../models/policeStation.model";
import { env } from "../../config/env";

// ✅ Person inclus pour que getUser et getMe retournent les infos complètes
const PUBLIC_FIELDS = {
  attributes: { exclude: ["password"] as string[] },
  include: [
    { model: PoliceStation, as: "station" },
    { model: Person, as: "personProfile" },
  ],
};

const BCRYPT_ROUNDS = (env as any).security?.bcryptRounds || 10;

const getId = (id: string | string[]): string => (Array.isArray(id) ? id[0] : id);

const toISODate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return dateStr;
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: PUBLIC_FIELDS.attributes,
      include: [{ model: PoliceStation, as: "station" }],
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error in listUsers:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    if (!userReq.user) return res.status(401).json({ message: "Non authentifié" });
    const user = await User.findByPk(userReq.user.id, PUBLIC_FIELDS);
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error in getMe:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    if (!userReq.user) return res.status(401).json({ message: "Non authentifié" });
    const user = await User.findByPk(userReq.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    const { firstname, lastname, password, email } = req.body;
    const updates: any = {};
    if (firstname !== undefined) updates.firstname = firstname;
    if (lastname !== undefined) updates.lastname = lastname;
    if (email !== undefined && email !== (user as any).email) {
      const conflict = await User.findOne({ where: { email, id: { [Op.ne]: userReq.user.id } } });
      if (conflict) return res.status(409).json({ message: "Email déjà utilisé" });
      updates.email = email;
    }
    if (password) updates.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await user.update(updates);
    const updatedUser = await User.findByPk(user.id, PUBLIC_FIELDS);
    return res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error in updateMe:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstname, lastname, email, password, role, matricule, poste, policeStationId } = req.body;
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: "Email déjà utilisé" });
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      firstname, lastname, email, password: hash,
      role: role?.toLowerCase() || "citizen",
      matricule: matricule || null,
      organization: poste || null,
      policeStationId: policeStationId || null,
    });
    const out = await User.findByPk(user.id, PUBLIC_FIELDS);
    return res.status(201).json({ success: true, data: out });
  } catch (error) {
    console.error("Error in createUser:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(getId(req.params.id), PUBLIC_FIELDS);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    return res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error in getUser:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = parseInt(getId(req.params.id), 10);
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const {
      firstname, lastname, email, matricule, telephone, role,
      policeStationId, courtId, password, status,
      dateOfBirth, placeOfBirth, nationality, cin,
      personalEmail, alternativePhone, address, city,
    } = req.body;

    // ── 1. Vérifications d'unicité ───────────────────────────────────────────

    if (matricule !== undefined && matricule !== null && matricule !== '') {
      const conflict = await User.findOne({
        where: { matricule, id: { [Op.ne]: userId } }, transaction,
      });
      if (conflict) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Le matricule ${matricule} est déjà attribué à un autre agent`,
        });
      }
    }

    if (email !== undefined && email !== null && email !== '') {
      const conflict = await User.findOne({
        where: { email, id: { [Op.ne]: userId } }, transaction,
      });
      if (conflict) {
        await transaction.rollback();
        return res.status(409).json({ success: false, message: "Email déjà utilisé" });
      }
    }

    // ✅ Vérification téléphone
    if (telephone !== undefined && telephone !== null && telephone !== '') {
      const conflict = await User.findOne({
        where: { telephone, id: { [Op.ne]: userId } }, transaction,
      });
      if (conflict) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: "Ce numéro de téléphone est déjà utilisé par un autre agent",
        });
      }
    }

    // ── 2. Mise à jour User ──────────────────────────────────────────────────

    const userUpdates: any = {};
    if (firstname !== undefined)       userUpdates.firstname       = firstname;
    if (lastname !== undefined)        userUpdates.lastname        = lastname;
    if (email !== undefined)           userUpdates.email           = email;
    if (matricule !== undefined)       userUpdates.matricule       = matricule;
    if (telephone !== undefined)       userUpdates.telephone       = telephone;
    if (role !== undefined)            userUpdates.role            = role.toLowerCase();
    if (policeStationId !== undefined) userUpdates.policeStationId = policeStationId;
    if (courtId !== undefined)         userUpdates.courtId         = courtId;
    if (password)                      userUpdates.password        = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates, { transaction });
    }

    // ── 3. Mise à jour Person (upsert) ───────────────────────────────────────

    const personUpdates: any = {};
    if (dateOfBirth !== undefined)      personUpdates.dateOfBirth  = toISODate(dateOfBirth);
    if (placeOfBirth !== undefined)     personUpdates.placeOfBirth = placeOfBirth;
    if (nationality !== undefined)      personUpdates.nationality  = nationality;
    if (cin !== undefined)              personUpdates.nationalId   = cin;
    if (personalEmail !== undefined)    personUpdates.email        = personalEmail;
    if (alternativePhone !== undefined) personUpdates.phone        = alternativePhone;
    if (address !== undefined)          personUpdates.address      = address;
    if (city !== undefined)             personUpdates.city         = city;

    if (Object.keys(personUpdates).length > 0) {
      const person = await Person.findOne({ where: { userId }, transaction });
      if (person) {
        await person.update(personUpdates, { transaction });
      } else {
        await Person.create({
          ...personUpdates,
          firstName: (user as any).firstname,
          lastName:  (user as any).lastname,
          userId:    Number(userId),
        }, { transaction });
      }
    }

    // ── 4. Mise à jour ProfessionalProfile ───────────────────────────────────

    if (status !== undefined) {
      const isActive = status === "active";
      const profProfile = await ProfessionalProfile.findOne({ where: { userId }, transaction });
      if (profProfile) {
        await profProfile.update({ isActive }, { transaction });
      }
    }

    // ── 5. Commit ────────────────────────────────────────────────────────────

    await transaction.commit();
    const out = await User.findByPk(user.id, PUBLIC_FIELDS);
    return res.json({ success: true, data: out });

  } catch (error) {
    await transaction.rollback();
    if ((error as any).name === "SequelizeUniqueConstraintError") {
      console.error("[UNIQUE ERROR] fields:", (error as any).fields);
      return res.status(409).json({ success: false, message: "Matricule, email ou téléphone déjà utilisé" });
    }
    console.error("Error in updateUser:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(getId(req.params.id));
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    await user.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updatePushToken = async (req: Request, res: Response) => {
  try {
    const userReq = req as any;
    if (!userReq.user) return res.status(401).json({ message: "Non authentifié" });
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token requis" });
    const user = await User.findByPk(userReq.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    await user.update({ pushToken: token });
    return res.json({ success: true, message: "Token mis à jour" });
  } catch (error) {
    console.error("Error in updatePushToken:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};