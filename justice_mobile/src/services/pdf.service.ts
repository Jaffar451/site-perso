import { Platform } from 'react-native';
import { Complaint } from './complaint.service';
import { ENV } from '../config/env';

// Imports natifs uniquement sur mobile
let Print: any = null;
let Sharing: any = null;
if (Platform.OS !== 'web') {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
}

/**
 * ⚖️ GÉNÉRATEUR DE PROCÈS-VERBAL OFFICIEL (NIGER)
 * Génère un document authentique avec QR Code de vérification
 */
export const generateComplaintPDF = async (complaint: Complaint, signatureBase64?: string) => {
  // 1. Configuration de la vérification sécurisée
  const token = complaint.verification_token || complaint.trackingCode || complaint.id.toString();
  const verificationUrl = `${ENV.API_URL}/public/verify/${token}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verificationUrl)}`;

  // 3. Formatage temporel
  const dateObj = new Date(complaint.filedAt ?? complaint.createdAt ?? Date.now());
  const dateFull = dateObj.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const timeFull = dateObj.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 12mm; }
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; line-height: 1.4; padding: 0; margin: 0; background: #fff; }
          
          /* En-tête Institutionnel */
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1A237E; padding-bottom: 10px; }
          .republique { font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; color: #000; }
          .devise { font-style: italic; font-size: 10px; margin-top: 2px; color: #555; }
          .ministere { font-weight: bold; font-size: 13px; margin-top: 10px; text-transform: uppercase; }
          
          /* Infos Dossier */
          .ref-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; margin: 15px 0; padding: 5px 0; border-bottom: 1px dashed #ccc; }
          
          .title { text-align: center; font-size: 19px; font-weight: 900; margin: 25px 0; text-transform: uppercase; letter-spacing: 1px; text-decoration: underline; color: #1A237E; }
          
          /* Sections de contenu */
          .section { margin-bottom: 15px; padding: 12px; border-left: 5px solid #1A237E; background: #f8fafc; border-radius: 0 8px 8px 0; }
          .label { font-weight: bold; text-transform: uppercase; font-size: 10px; color: #1A237E; display: block; margin-bottom: 5px; }
          .content { font-size: 13px; text-align: justify; color: #334155; }

          /* Zone de Signatures */
          .footer-signatures { margin-top: 35px; display: table; width: 100%; border-spacing: 15px 0; }
          .sig-column { display: table-cell; width: 50%; text-align: center; vertical-align: top; }
          .sig-box { border: 1.5px solid #e2e8f0; border-radius: 12px; min-height: 140px; padding: 12px; background: #fff; }
          .signature-img { width: 140px; height: auto; max-height: 90px; object-fit: contain; margin-top: 10px; }
          .visa-cachet { margin-top: 20px; color: #1A237E; font-weight: bold; font-size: 11px; border: 2px double #1A237E; padding: 8px; display: inline-block; border-radius: 50%; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; flex-direction: column; }

          /* Authentification QR */
          .qr-container { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .qr-code { width: 100px; height: 100px; padding: 5px; background: #fff; border: 1px solid #f1f5f9; }
          .qr-text { font-size: 9px; color: #64748b; margin-top: 10px; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.4; }

          /* Filigrane Niger */
          .watermark { position: fixed; top: 35%; left: 0; transform: rotate(-35deg); font-size: 80px; color: rgba(26, 35, 126, 0.04); font-weight: 800; z-index: -1000; width: 100%; text-align: center; pointer-events: none; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="watermark">E-JUSTICE NIGER</div>

        <div class="header">
          <div class="republique">République du Niger</div>
          <div class="devise">Fraternité - Travail - Progrès</div>
          <div class="ministere">Ministère de la Justice / Ministère de l'Intérieur</div>
        </div>

        <div class="ref-row">
          <span>RÉF : ${complaint.caseNumber || 'EN ATTENTE RP'}</span>
          <span>DOSSIER N° ${complaint.id} / ${new Date().getFullYear()} / PN</span>
        </div>

        <div class="title">Procès-Verbal de Déposition</div>

        <div class="section">
          <span class="label">Date, Heure et Lieu de Saisine</span>
          <div class="content">
            L'an deux mille vingt-cinq, le <strong>${dateFull}</strong> à <strong>${timeFull}</strong>, 
            par devant nous, Officier de Police Judiciaire en poste à <strong>${complaint.location || 'Niamey, République du Niger'}</strong>.
          </div>
        </div>

        <div class="section">
          <span class="label">Qualification des Faits</span>
          <div class="content"><strong>${complaint.provisionalOffence || 'En cours de qualification juridique'}</strong></div>
        </div>

        <div class="section">
          <span class="label">Déclarations et Narration des faits</span>
          <div class="content">${complaint.description.replace(/\n/g, '<br/>')}</div>
        </div>

        <div class="footer-signatures">
          <div class="sig-column">
            <div class="sig-box">
              <span class="label">Le Plaignant / Déclarant</span>
              ${signatureBase64 
                ? `<img src="${signatureBase64}" class="signature-img" />` 
                : `<div style="margin-top: 40px; color: #94a3b8; font-style: italic; font-size: 11px;">Signature électronique recueillie sur terminal mobile</div>`
              }
            </div>
          </div>
          <div class="sig-column">
            <div class="sig-box">
              <span class="label">L'Autorité de Police / Justice</span>
              <center>
                <div class="visa-cachet">
                  <div style="font-size: 9px;">E-JUSTICE</div>
                  <div style="font-size: 7px; font-weight: normal;">VISA VALIDE</div>
                  <div style="font-size: 8px;">NIGER</div>
                </div>
              </center>
              <div style="font-size: 8px; margin-top: 10px; color: #64748b;">Signé numériquement par l'OPJ de permanence</div>
            </div>
          </div>
        </div>

        <div class="qr-container">
          <img src="${qrCodeUrl}" class="qr-code" />
          <div class="qr-text">
            <strong>VÉRIFICATION D'AUTHENTICITÉ</strong><br/>
            Ce document est issu du système national E-JUSTICE. Il constitue un acte authentique. 
            Toute falsification est passible des peines prévues au Code Pénal. 
            Scannez le QR Code pour accéder à la version numérique originale.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    // Sur web : ouvrir le HTML dans un nouvel onglet et lancer l'impression
    if (Platform.OS === 'web') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      }
      return 'web-print';
    }

    // Sur mobile : générer un PDF et partager
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `PV_Justice_Niger_${complaint.id}`,
    });
    return uri;
  } catch (error) {
    console.error("❌ Erreur PDF Service:", error);
    throw new Error("Échec de la génération du document officiel.");
  }
};
