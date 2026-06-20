// PATH: src/application/services/notification.service.ts
import nodemailer from "nodemailer";
import axios from "axios";

export class NotificationService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT) || 2525,
      secure: process.env.SMTP_SECURE === "true", // true pour 465, false pour les autres
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * 📧 1. ENVOI RÉCÉPISSÉ DE PLAINTE (CITOYEN)
   */
  async sendComplaintReceiptEmail(
    to: string,
    citizenName: string,
    trackingCode: string,
    pdfBuffer: Buffer,
  ) {
    const mailOptions = {
      from: `"e-Justice Niger" <${process.env.SMTP_FROM || "no-reply@justice.ne"}>`,
      to,
      subject: `📜 Récépissé Officiel - Dossier ${trackingCode}`,
      html: this.getHtmlTemplate(`
        <h2 style="color: #1a5a96;">Confirmation de Dépôt</h2>
        <p>Bonjour <b>${citizenName}</b>,</p>
        <p>Votre plainte a été validée par les autorités compétentes et transmise au Parquet.</p>
        <p style="background: #f4f4f4; padding: 10px; border-left: 4px solid #1a5a96;">
          <b>Numéro de suivi :</b> ${trackingCode}
        </p>
        <p>Vous trouverez votre récépissé officiel en pièce jointe de ce mail. Ce document contient un QR Code permettant de vérifier l'authenticité de votre dossier auprès de toute administration.</p>
      `),
      attachments: [
        { filename: `Recepisse_${trackingCode}.pdf`, content: pdfBuffer },
      ],
    };

    return this.sendMail(mailOptions);
  }

  /**
   * 📎 2. ENVOI GÉNÉRIQUE (RAPPORTS & STATISTIQUES)
   */
  async sendMailWithAttachment(
    to: string,
    subject: string,
    body: string,
    filename: string,
    content: Buffer,
  ) {
    const mailOptions = {
      from: `"SIJ Niger - Statistiques" <${process.env.SMTP_USER || "no-reply@justice.ne"}>`,
      to,
      subject,
      html: this.getHtmlTemplate(`
        <h2 style="color: #2c3e50;">Rapport du Système d'Information Judiciaire</h2>
        <p>${body}</p>
        <p style="font-size: 0.9em; color: #7f8c8d;">Document généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}.</p>
      `),
      attachments: [{ filename, content }],
    };

    return this.sendMail(mailOptions);
  }

  /**
   * 🔐 3. EMAIL RESET PASSWORD
   */
  async sendPasswordResetEmail(to: string, userName: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://justice-mobile-web.vercel.app'}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `"e-Justice Niger" <${process.env.SMTP_USER || "no-reply@justice.ne"}>`,
      to,
      subject: `🔐 Réinitialisation de mot de passe - e-Justice Niger`,
      html: this.getHtmlTemplate(`
        <h2 style="color: #1a5a96;">Réinitialisation de Mot de Passe</h2>
        <p>Bonjour <b>${userName}</b>,</p>
        <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte e-Justice.</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background: #1a5a96; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="font-size: 0.9em; color: #7f8c8d;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
      `),
    };
    return this.sendMail(mailOptions);
  }

  /**
   * 📧 4. NOTIFICATION CHANGEMENT STATUT PLAINTE
   */
  async sendStatusChangeEmail(to: string, citizenName: string, trackingCode: string, newStatus: string) {
    const statusLabels: Record<string, string> = {
      'en_cours_OPJ': 'prise en charge par un Officier de Police Judiciaire',
      'transmise_parquet': 'transmise au Parquet de la République',
      'saisi_juge': 'transmise au Juge d\'Instruction',
      'instruction': 'en instruction judiciaire',
      'audience_programmée': 'programmée pour audience',
      'jugée': 'jugée — un verdict a été rendu',
    };
    const statusText = statusLabels[newStatus] || `mise à jour (${newStatus})`;
    const mailOptions = {
      from: `"e-Justice Niger" <${process.env.SMTP_USER || "no-reply@justice.ne"}>`,
      to,
      subject: `📋 Mise à jour dossier ${trackingCode} - e-Justice Niger`,
      html: this.getHtmlTemplate(`
        <h2 style="color: #1a5a96;">Mise à Jour de Votre Dossier</h2>
        <p>Bonjour <b>${citizenName}</b>,</p>
        <p>Votre plainte <b>${trackingCode}</b> a été <b>${statusText}</b>.</p>
        <p style="background: #f0f9ff; padding: 12px; border-left: 4px solid #1a5a96; border-radius: 4px;">
          Connectez-vous sur le portail e-Justice pour consulter les détails de votre dossier.
        </p>
      `),
    };
    return this.sendMail(mailOptions);
  }

  /**
   * 📱 5. PASSERELLE SMS NIGER
   * Prêt pour intégration Orange/Airtel/Moov via API HTTP
   */
  async sendSMS(phoneNumber: string, message: string) {
    console.log(`[SMS GATEWAY NIGER] To: ${phoneNumber} | Msg: ${message}`);

    // Exemple d'intégration réelle avec un agrégateur local
    if (process.env.NODE_ENV === "production") {
      try {
        // Simulation d'appel API (Ex: Infobip, Twilio, ou Agrégateur local au Niger)
        // await axios.post(process.env.SMS_API_URL!, {
        //   to: phoneNumber,
        //   text: message,
        //   apikey: process.env.SMS_API_KEY
        // });
      } catch (error) {
        console.error("❌ Erreur Gateway SMS:", error);
      }
    }
  }

  /**
   * 🛠️ HELPERS PRIVÉS
   */
  private async sendMail(options: any) {
    try {
      const info = await this.transporter.sendMail(options);
      console.log(`✅ Email envoyé : ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("❌ Erreur service email:", error);
      throw error;
    }
  }

  private getHtmlTemplate(content: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #1a5a96; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #1a5a96; margin: 0;">RÉPUBLIQUE DU NIGER</h1>
          <small>MINISTÈRE DE LA JUSTICE</small>
        </div>
        ${content}
        <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 0.8em; color: #888; text-align: center;">
          Ceci est un message officiel du Système d'Information Judiciaire (e-Justice).<br>
          Niamey, République du Niger.
        </div>
      </div>
    `;
  }
}
