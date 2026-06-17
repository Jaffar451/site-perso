import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/tickets", authenticate, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { subject, message, category } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: "Sujet et message requis" });
    }
    console.log(`[SUPPORT] Ticket de user #${userId}: ${subject}`);
    return res.status(201).json({
      success: true,
      message: "Votre demande a été enregistrée. Notre équipe vous contactera sous 48h.",
      data: { ticketId: `SUP-${Date.now()}`, subject, category: category || "general", status: "open" },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

export default router;
