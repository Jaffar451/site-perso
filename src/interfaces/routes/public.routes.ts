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

    const escapeHtml = (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: green;">&#x2705; Document Authentique</h1>
        <p>Num&eacute;ro : <strong>${escapeHtml(String(complaint.id))}</strong> | Statut : <strong>${escapeHtml(String(complaint.status))}</strong></p>
        <hr/><p>Minist&egrave;re de la Justice - Niger</p>
      </div>
    `);
  } catch (error) {
    res.status(500).send("Erreur serveur");
  }
});

export default router;
