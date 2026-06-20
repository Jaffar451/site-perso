import { Platform } from 'react-native';
import { Complaint } from './complaint.service';
import { ENV } from '../config/env';

let Print: any = null;
let Sharing: any = null;
if (Platform.OS !== 'web') {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
}

const numberToFrench = (n: number): string => {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  if (n < 20) return units[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + units[n % 10] : '');
  return String(n);
};

const yearToFrench = (y: number): string => {
  const thousands = Math.floor(y / 1000);
  const remainder = y % 1000;
  const hundreds = Math.floor(remainder / 100);
  const rest = remainder % 100;
  let result = thousands === 2 ? 'deux mille' : 'mille';
  if (hundreds > 0) result += ' ' + numberToFrench(hundreds) + ' cent';
  if (rest > 0) result += ' ' + numberToFrench(rest);
  return result;
};

const generateDigitalSignature = (complaint: Complaint): string => {
  const raw = `${complaint.id}-${complaint.verification_token}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(12, '0');
};

export const generateComplaintPDF = async (complaint: Complaint, signatureBase64?: string, user?: any) => {
  const token = complaint.verification_token || complaint.trackingCode || complaint.id.toString();
  const verificationUrl = `${ENV.API_URL}/public/verify/${token}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;

  const dateObj = new Date(complaint.filedAt ?? complaint.createdAt ?? Date.now());
  const year = dateObj.getFullYear();
  const dateFull = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeFull = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateShort = dateObj.toLocaleDateString('fr-FR');
  const now = new Date();
  const printDate = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const printTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const digitalSig = generateDigitalSignature(complaint);
  const pvNumber = complaint.caseNumber || `PV-${year}-${String(complaint.id).padStart(5, '0')}/PN`;
  const complainantName = (complaint as any).complainant
    ? `${((complaint as any).complainant.lastname || '').toUpperCase()} ${(complaint as any).complainant.firstname || ''}`
    : 'Non renseigné';

  const statusTimeline: Record<string, string> = {
    'soumise': 'Plainte déposée',
    'en_cours_OPJ': 'Prise en charge par l\'OPJ',
    'attente_validation': 'En attente de validation hiérarchique',
    'transmise_parquet': 'Transmise au Parquet',
    'saisi_juge': 'Saisine du Juge d\'Instruction',
    'instruction': 'En instruction',
    'audience_programmée': 'Audience programmée',
    'jugée': 'Jugement rendu',
    'classée_sans_suite_par_OPJ': 'Classée sans suite (OPJ)',
    'classée_sans_suite_par_procureur': 'Classée sans suite (Procureur)',
    'non_lieu': 'Non-lieu prononcé',
  };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  @page { margin: 15mm 12mm; size: A4; }
  @media print { .no-print { display: none; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', 'Georgia', serif; color: #111; line-height: 1.5; font-size: 12pt; }

  .watermark { position: fixed; top: 30%; left: 5%; transform: rotate(-35deg); font-size: 72pt; color: rgba(26,35,126,0.03); font-weight: 900; z-index: -1; width: 90%; text-align: center; pointer-events: none; text-transform: uppercase; letter-spacing: 8px; }

  .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px double #1A237E; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .header-left, .header-right { width: 30%; font-size: 8pt; color: #555; text-align: left; }
  .header-right { text-align: right; }
  .header-center { width: 40%; text-align: center; }
  .republique { font-weight: bold; font-size: 14pt; text-transform: uppercase; letter-spacing: 3px; color: #000; }
  .devise { font-style: italic; font-size: 9pt; margin: 2px 0 8px; color: #666; }
  .ministere { font-weight: bold; font-size: 10pt; text-transform: uppercase; color: #1A237E; }

  .ref-bar { display: flex; justify-content: space-between; font-size: 9pt; font-weight: bold; margin: 12px 0; padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; }
  .ref-bar .ref-label { color: #1A237E; }

  .title { text-align: center; font-size: 16pt; font-weight: 900; margin: 20px 0; text-transform: uppercase; letter-spacing: 2px; color: #1A237E; border-bottom: 2px solid #1A237E; padding-bottom: 8px; }

  .section { margin-bottom: 14px; }
  .section-title { font-weight: bold; text-transform: uppercase; font-size: 9pt; color: #1A237E; letter-spacing: 1px; margin-bottom: 6px; padding: 4px 8px; background: #EEF2FF; border-left: 4px solid #1A237E; }
  .section-body { padding: 8px 12px; font-size: 11pt; text-align: justify; line-height: 1.6; }

  .info-grid { display: table; width: 100%; border-collapse: collapse; margin: 8px 0; }
  .info-row { display: table-row; }
  .info-label { display: table-cell; width: 35%; padding: 4px 8px; font-weight: bold; font-size: 10pt; color: #475569; border-bottom: 1px dotted #e2e8f0; }
  .info-value { display: table-cell; padding: 4px 8px; font-size: 10pt; border-bottom: 1px dotted #e2e8f0; }

  .legal-box { border: 1px solid #BFDBFE; background: #EFF6FF; padding: 10px 14px; border-radius: 6px; margin: 10px 0; font-size: 9pt; }
  .legal-box strong { color: #1E40AF; }

  .signatures { display: table; width: 100%; margin-top: 30px; border-spacing: 12px 0; }
  .sig-col { display: table-cell; width: 50%; text-align: center; vertical-align: top; }
  .sig-box { border: 1px solid #e2e8f0; border-radius: 8px; min-height: 120px; padding: 10px; }
  .sig-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #1A237E; margin-bottom: 8px; }
  .sig-img { max-width: 150px; max-height: 80px; margin: 10px auto; display: block; }
  .cachet { border: 2px double #1A237E; border-radius: 50%; width: 80px; height: 80px; margin: 10px auto; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #1A237E; font-weight: bold; }

  .qr-section { margin-top: 25px; text-align: center; padding-top: 15px; border-top: 1px solid #e2e8f0; }
  .qr-section img { width: 90px; height: 90px; border: 1px solid #f1f5f9; padding: 3px; }
  .qr-text { font-size: 7pt; color: #94A3B8; margin-top: 6px; max-width: 380px; margin-left: auto; margin-right: auto; line-height: 1.4; }

  .digital-sig { margin-top: 12px; padding: 8px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 7pt; color: #64748B; text-align: center; }

  .footer { margin-top: 20px; font-size: 7pt; color: #94A3B8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 8px; }
</style>
</head>
<body>
<div class="watermark">REPUBLIQUE DU NIGER</div>

<div class="header">
  <div class="header-top">
    <div class="header-left">
      MINISTERE DE LA JUSTICE<br/>
      Direction des Affaires Judiciaires<br/>
      ─────────────
    </div>
    <div class="header-center">
      <div class="republique">R&eacute;publique du Niger</div>
      <div class="devise">Fraternit&eacute; &mdash; Travail &mdash; Progr&egrave;s</div>
    </div>
    <div class="header-right">
      MINISTERE DE L'INTERIEUR<br/>
      Direction G&eacute;n&eacute;rale de la Police<br/>
      ─────────────
    </div>
  </div>
  <div class="ministere">Syst&egrave;me National d'Information Judiciaire</div>
</div>

<div class="ref-bar">
  <span><span class="ref-label">R&Eacute;F :</span> ${pvNumber}</span>
  <span><span class="ref-label">DOSSIER :</span> N&deg; ${complaint.id} / ${year} / PN</span>
  <span><span class="ref-label">CODE :</span> ${complaint.trackingCode || '---'}</span>
</div>

<div class="title">Proc&egrave;s-Verbal de D&eacute;position</div>

<div class="section">
  <div class="section-title">I &mdash; Circonstances de la Saisine</div>
  <div class="section-body">
    L'an ${yearToFrench(year)}, le <strong>${dateFull}</strong> &agrave; <strong>${timeFull}</strong>,
    par devant nous, Officier de Police Judiciaire, en fonction au poste de
    <strong>${complaint.location || 'Niamey, R&eacute;publique du Niger'}</strong>,
    agissant en vertu des articles 17, 19 et 69 &agrave; 75 du Code de Proc&eacute;dure P&eacute;nale du Niger.
  </div>
</div>

<div class="section">
  <div class="section-title">II &mdash; Identit&eacute; du D&eacute;clarant</div>
  <div class="info-grid">
    <div class="info-row"><div class="info-label">Nom et Pr&eacute;nom</div><div class="info-value"><strong>${complainantName}</strong></div></div>
    <div class="info-row"><div class="info-label">Lieu des faits</div><div class="info-value">${complaint.location || 'Non pr&eacute;cis&eacute;'}</div></div>
    <div class="info-row"><div class="info-label">Date de d&eacute;p&ocirc;t</div><div class="info-value">${dateShort} &agrave; ${timeFull}</div></div>
    <div class="info-row"><div class="info-label">Statut actuel</div><div class="info-value">${statusTimeline[complaint.status] || complaint.status}</div></div>
  </div>
</div>

<div class="section">
  <div class="section-title">III &mdash; Qualification Provisoire des Faits</div>
  <div class="section-body">
    <strong>${(complaint as any).provisionalOffence || complaint.category || 'En cours de qualification'}</strong>
  </div>
  <div class="legal-box">
    <strong>Base l&eacute;gale :</strong> Infraction pr&eacute;vue et r&eacute;prim&eacute;e par le Code P&eacute;nal du Niger.
    La qualification d&eacute;finitive sera &eacute;tablie par le Minist&egrave;re Public apr&egrave;s enqu&ecirc;te pr&eacute;liminaire.
  </div>
</div>

<div class="section">
  <div class="section-title">IV &mdash; D&eacute;clarations et Narration des Faits</div>
  <div class="section-body">${complaint.description.replace(/\n/g, '<br/>')}</div>
</div>

<div class="section">
  <div class="section-title">V &mdash; Cl&ocirc;ture du Proc&egrave;s-Verbal</div>
  <div class="section-body">
    Lecture faite au d&eacute;clarant de ses d&eacute;clarations, il/elle persiste et signe avec nous le pr&eacute;sent
    proc&egrave;s-verbal clos &agrave; <strong>${complaint.location || 'Niamey'}</strong>, les jours, mois et an que dessus.
    <br/><br/>
    <em>Le pr&eacute;sent document constitue un acte authentique &eacute;mis par le Syst&egrave;me National
    d'Information Judiciaire (e-Justice Niger). Toute falsification est passible des peines
    pr&eacute;vues aux articles 149 &agrave; 156 du Code P&eacute;nal.</em>
  </div>
</div>

<div class="signatures">
  <div class="sig-col">
    <div class="sig-box">
      <div class="sig-title">Le Plaignant / D&eacute;clarant</div>
      ${signatureBase64
        ? `<img src="${signatureBase64}" class="sig-img" />`
        : '<div style="margin-top:30px;color:#94a3b8;font-style:italic;font-size:9pt;">Signature &eacute;lectronique recueillie sur terminal</div>'
      }
      <div style="font-size:8pt;color:#64748b;margin-top:6px;">${complainantName}</div>
    </div>
  </div>
  <div class="sig-col">
    <div class="sig-box">
      <div class="sig-title">L'Autorit&eacute; de Police Judiciaire</div>
      <div class="cachet">
        <div style="font-size:8pt;">E-JUSTICE</div>
        <div style="font-size:6pt;font-weight:normal;">CERTIFI&Eacute;</div>
        <div style="font-size:7pt;">NIGER</div>
      </div>
      <div style="font-size:7pt;color:#64748b;margin-top:4px;">Sign&eacute; num&eacute;riquement</div>
    </div>
  </div>
</div>

<div class="qr-section">
  <img src="${qrCodeUrl}" alt="QR Code de v&eacute;rification" />
  <div class="qr-text">
    <strong>V&Eacute;RIFICATION D'AUTHENTICIT&Eacute;</strong><br/>
    Scannez ce QR Code ou rendez-vous sur le portail e-Justice pour v&eacute;rifier
    l'authenticit&eacute; de cet acte. Code : ${token}
  </div>
</div>

<div class="digital-sig">
  SIGNATURE NUM&Eacute;RIQUE : ${digitalSig} &bull; HORODATAGE : ${printDate} ${printTime} UTC+1
  &bull; ALGORITHME : SHA-256/RSA &bull; AUTORIT&Eacute; : SIJ-NIGER/MJ/DG
</div>

<div class="footer">
  Document g&eacute;n&eacute;r&eacute; par le Syst&egrave;me National d'Information Judiciaire &mdash; R&eacute;publique du Niger
  &bull; ${pvNumber} &bull; Conforme aux dispositions du CPP Niger (&Eacute;d. 2018)
  &bull; Imprim&eacute; le ${printDate} &agrave; ${printTime}
</div>
</body>
</html>`;

  try {
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

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `PV_Justice_Niger_${complaint.id}`,
    });
    return uri;
  } catch (error) {
    console.error("Erreur PDF:", error);
    throw new Error("Échec de la génération du document.");
  }
};
