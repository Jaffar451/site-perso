import { Router } from "express";
import Complaint from "../../models/complaint.model";

const router = Router();

router.get("/verify/:token", async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      where: { verification_token: req.params.token },
      attributes: ["id", "status", "filedAt", "category", "location", "title"],
    });

    if (!complaint) return res.status(404).send("Document Invalide");

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: green;">✅ Document Authentique</h1>
        <p>Numéro : <strong>${complaint.id}</strong> | Statut : <strong>${complaint.status}</strong></p>
        <hr/><p>Ministère de la Justice - Niger</p>
      </div>
    `);
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

export default router;
