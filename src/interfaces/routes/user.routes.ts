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
