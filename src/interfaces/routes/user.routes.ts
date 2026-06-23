import { Router } from "express";
// Importez chaque fonction nommément pour éviter les 'undefined'
import {
  getMe,
  updateMe,
  listUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updatePushToken,
} from "../controllers/user.controller";
import { authenticate, isAdmin } from "../middleware/auth.middleware";

const router = Router();

// 🟢 PERSONNEL
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

// 🔔 PUSH TOKEN
router.patch("/push-token", authenticate, updatePushToken);

// 📦 RGPD : Export données personnelles
router.get("/me/export", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { User, Complaint, Person } = require("../../models");
    const user = await User.findByPk(userId, { attributes: { exclude: ["password"] }, include: [{ model: Person, as: "personProfile" }] });
    const complaints = await Complaint.findAll({ where: { citizenId: userId } });
    return res.json({ success: true, data: { user, complaints, exportedAt: new Date().toISOString() } });
  } catch (error) { return res.status(500).json({ success: false, message: "Erreur export" }); }
});

// 🗑️ RGPD : Suppression compte (droit à l'effacement)
router.delete("/me", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { User, Person, RefreshToken } = require("../../models");
    await RefreshToken.destroy({ where: { userId } });
    await Person.destroy({ where: { userId } });
    await User.destroy({ where: { id: userId } });
    return res.json({ success: true, message: "Compte supprimé conformément à votre droit à l'effacement (Loi n°2017-28)" });
  } catch (error) { return res.status(500).json({ success: false, message: "Erreur suppression" }); }
});

// 🔵 PAR STATION
router.get("/by-station/:stationId", authenticate, async (req, res) => {
  try {
    const User = require("../../models/user.model").default;
    const users = await User.findAll({
      where: { policeStationId: req.params.stationId },
      attributes: { exclude: ["password"] },
    });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// 🔴 ADMIN
router.get("/", authenticate, isAdmin, listUsers);
router.post("/", authenticate, isAdmin, createUser);

// 🟠 INDIVIDUEL
router.get("/:id", authenticate, isAdmin, getUser);
router.patch("/:id", authenticate, isAdmin, updateUser);
router.delete("/:id", authenticate, isAdmin, deleteUser);

export default router;
