export interface LegalEntry {
  keywords: string[];
  question: string;
  answer: string;
  articles: string;
  referTo: string;
}

export const LEGAL_KB: LegalEntry[] = [
  // ═══ GARDE À VUE ═══
  { keywords: ["garde à vue", "gav", "durée gav", "combien temps gav"],
    question: "Quelle est la durée maximale de la garde à vue ?",
    answer: "La garde à vue ne peut excéder 48 heures. Elle est renouvelable une seule fois pour 48 heures supplémentaires, sur autorisation écrite du Procureur de la République. La durée maximale totale est donc de 96 heures (4 jours).",
    articles: "Art. 69-70 CPP Niger", referTo: "Commissariat de police / Procureur de la République" },

  { keywords: ["droit garde à vue", "droit gav", "droit détenu", "notification droits"],
    question: "Quels sont les droits d'une personne en garde à vue ?",
    answer: "La personne gardée à vue a le droit : 1) D'être informée des motifs de sa rétention, 2) De faire prévenir sa famille dans un délai de 3 heures, 3) De demander un examen médical à tout moment, 4) D'accéder à un avocat après 24 heures de garde à vue, 5) De garder le silence.",
    articles: "Art. 71-73 CPP Niger", referTo: "Commissariat de police / Avocat" },

  { keywords: ["avocat gav", "avocat garde à vue", "quand avocat"],
    question: "Quand peut-on avoir accès à un avocat en garde à vue ?",
    answer: "L'accès à un avocat est autorisé après 24 heures de garde à vue. L'entretien avec l'avocat ne peut excéder 30 minutes. L'avocat ne peut pas assister aux interrogatoires pendant la garde à vue.",
    articles: "Art. 73 CPP Niger", referTo: "Barreau du Niger / Aide juridictionnelle" },

  // ═══ PLAINTE ET PROCÉDURE ═══
  { keywords: ["déposer plainte", "comment plainte", "porter plainte", "où plainte"],
    question: "Comment déposer une plainte au Niger ?",
    answer: "Vous pouvez déposer une plainte : 1) Au commissariat de police le plus proche, 2) À la brigade de gendarmerie, 3) Directement auprès du Procureur de la République. La plainte peut être écrite ou orale. L'OPJ doit vous remettre un récépissé. Vous pouvez aussi utiliser l'application e-Justice Niger.",
    articles: "Art. 31-36 CPP Niger", referTo: "Commissariat de police / Gendarmerie / Parquet" },

  { keywords: ["suivi plainte", "suivre dossier", "état plainte", "tracking"],
    question: "Comment suivre l'évolution de ma plainte ?",
    answer: "Votre plainte suit le parcours suivant : Soumise → Prise en charge OPJ → Transmission au Parquet → Instruction → Audience → Jugement. Vous pouvez suivre l'état de votre dossier via l'application e-Justice avec votre code de suivi (PLT-XXXX).",
    articles: "Art. 37-40 CPP Niger", referTo: "Application e-Justice Niger / Greffe du tribunal" },

  { keywords: ["retirer plainte", "désister", "abandon plainte"],
    question: "Peut-on retirer une plainte ?",
    answer: "Le retrait de plainte est possible pour les infractions poursuivies sur plainte de la victime (atteintes légères, diffamation). Pour les crimes et délits graves, le Procureur peut poursuivre d'office même après retrait de la plainte.",
    articles: "Art. 2-6 CPP Niger", referTo: "Procureur de la République" },

  // ═══ VOL ET ATTEINTES AUX BIENS ═══
  { keywords: ["vol", "volé", "voleur", "peine vol"],
    question: "Quelles sont les peines pour vol au Niger ?",
    answer: "Le vol simple est puni de 1 à 5 ans d'emprisonnement et d'une amende. Le vol aggravé (avec violence, effraction, en réunion, de nuit) est puni de 5 à 10 ans. Le vol à main armée est puni de 10 à 20 ans de réclusion criminelle.",
    articles: "Art. 320-324 Code Pénal Niger", referTo: "Commissariat de police / Tribunal" },

  { keywords: ["escroquerie", "arnaque", "arnaqué", "peine escroquerie"],
    question: "Quelles sont les peines pour escroquerie ?",
    answer: "L'escroquerie est punie de 1 à 5 ans d'emprisonnement et d'une amende de 20 000 à 500 000 FCFA. Si l'escroquerie porte sur des fonds publics ou a été commise par un agent public, la peine est doublée.",
    articles: "Art. 335-337 Code Pénal Niger", referTo: "Commissariat / Tribunal de Grande Instance" },

  { keywords: ["abus confiance", "détournement", "peine abus"],
    question: "Quelles sont les peines pour abus de confiance ?",
    answer: "L'abus de confiance est puni de 1 à 5 ans d'emprisonnement et d'une amende. Il s'agit du détournement de fonds, effets ou marchandises remis à titre de mandat, dépôt, location ou prêt.",
    articles: "Art. 338-340 Code Pénal Niger", referTo: "Tribunal de Grande Instance" },

  // ═══ VIOLENCES ═══
  { keywords: ["violence", "agression", "coups", "blessure", "peine violence"],
    question: "Quelles sont les peines pour violences ?",
    answer: "Coups et blessures : 2 mois à 5 ans selon l'ITT (incapacité temporaire de travail). Violence avec arme : 2 à 10 ans. Violence conjugale : circonstance aggravante, peine doublée. Homicide involontaire : 1 à 5 ans. Meurtre : réclusion criminelle à perpétuité.",
    articles: "Art. 222-228 Code Pénal Niger", referTo: "Commissariat / Hôpital (certificat médical) / Tribunal" },

  { keywords: ["violence conjugale", "femme battue", "mari violent", "violences domestiques"],
    question: "Que faire en cas de violence conjugale ?",
    answer: "1) Rendez-vous au commissariat le plus proche pour déposer plainte. 2) Faites constater vos blessures par un médecin (certificat médical). 3) La violence conjugale est une circonstance aggravante (peine doublée). 4) Vous pouvez demander une ordonnance de protection au juge. 5) Contactez les associations d'aide aux victimes.",
    articles: "Art. 222-228 + Loi n°2020-31 Niger", referTo: "Commissariat / Hôpital / Association SOS Femmes" },

  // ═══ DÉTENTION ═══
  { keywords: ["détention préventive", "prison préventive", "durée détention"],
    question: "Quelle est la durée maximale de la détention préventive ?",
    answer: "En matière correctionnelle : 6 mois maximum, renouvelable une seule fois (12 mois total). En matière criminelle : 12 mois maximum, renouvelable deux fois (36 mois total). Le détenu peut demander sa mise en liberté provisoire à tout moment.",
    articles: "Art. 132-142 CPP Niger", referTo: "Juge d'Instruction / Avocat" },

  { keywords: ["liberté provisoire", "sortir prison", "libération"],
    question: "Comment demander une mise en liberté provisoire ?",
    answer: "La demande peut être faite par le détenu ou son avocat auprès du Juge d'Instruction. Le juge statue dans les 5 jours. La mise en liberté peut être assortie de conditions : caution, interdiction de quitter le territoire, pointage régulier.",
    articles: "Art. 142-148 CPP Niger", referTo: "Juge d'Instruction / Avocat" },

  // ═══ MANDATS ═══
  { keywords: ["mandat arrêt", "mandat amener", "arrestation"],
    question: "Quels sont les types de mandats judiciaires ?",
    answer: "1) Mandat de comparution : convocation à se présenter. 2) Mandat d'amener : ordre de conduire devant le juge. 3) Mandat d'arrêt : ordre d'arrêter et d'incarcérer. 4) Mandat de dépôt : ordre d'incarcération après interrogatoire. Tous sont délivrés par le Juge d'Instruction.",
    articles: "Art. 120-127 CPP Niger", referTo: "Juge d'Instruction" },

  // ═══ PERQUISITION ═══
  { keywords: ["perquisition", "fouille domicile", "police chez moi", "heure perquisition"],
    question: "Quelles sont les règles pour une perquisition ?",
    answer: "Les perquisitions ne peuvent être effectuées avant 6h du matin et après 21h du soir, sauf flagrant délit. L'occupant du domicile doit être présent, ou à défaut, deux témoins majeurs. Tout objet saisi doit être inventorié et scellé.",
    articles: "Art. 48-55 CPP Niger", referTo: "OPJ / Juge d'Instruction" },

  // ═══ CYBERCRIMINALITÉ ═══
  { keywords: ["cybercriminalité", "arnaque internet", "piratage", "cyber", "facebook", "whatsapp"],
    question: "Que faire en cas de cybercriminalité ?",
    answer: "La cybercriminalité est punie de 1 à 10 ans d'emprisonnement selon l'infraction. Cela inclut : fraude en ligne, usurpation d'identité numérique, piratage, harcèlement en ligne, diffusion de contenus illicites. Conservez toutes les preuves (captures d'écran, messages).",
    articles: "Loi n°2019-33 sur la Cybercriminalité au Niger", referTo: "Police Judiciaire / Division Cybercriminalité" },

  // ═══ CORRUPTION ═══
  { keywords: ["corruption", "pot de vin", "bakchich", "fonctionnaire corrompu"],
    question: "Quelles sont les peines pour corruption ?",
    answer: "La corruption active et passive est punie de 2 à 10 ans d'emprisonnement et d'une amende. Le fonctionnaire corrompu encourt en plus la destitution et l'interdiction d'exercer. Le Niger dispose de la HALCIA (Haute Autorité de Lutte contre la Corruption).",
    articles: "Art. 128-133 Code Pénal + Loi n°2003-025", referTo: "HALCIA / Procureur de la République" },

  // ═══ STUPÉFIANTS ═══
  { keywords: ["drogue", "stupéfiant", "cannabis", "trafic drogue"],
    question: "Quelles sont les peines liées aux stupéfiants ?",
    answer: "Usage de stupéfiants : 2 mois à 1 an. Détention : 1 à 5 ans. Trafic et vente : 5 à 20 ans d'emprisonnement et amende. Trafic international : 10 à 20 ans. Les peines sont alourdies si l'infraction implique des mineurs.",
    articles: "Loi n°2007-08 relative aux stupéfiants", referTo: "Police Judiciaire / Tribunal" },

  // ═══ APPEL ET RECOURS ═══
  { keywords: ["appel", "faire appel", "contester jugement", "recours"],
    question: "Comment faire appel d'un jugement ?",
    answer: "L'appel doit être interjeté dans un délai de 10 jours à compter du prononcé du jugement (ou de sa notification si rendu par défaut). L'appel est porté devant la Cour d'Appel. Il suspend l'exécution de la peine sauf en cas de mandat de dépôt.",
    articles: "Art. 290-310 CPP Niger", referTo: "Greffe du Tribunal / Cour d'Appel / Avocat" },

  // ═══ AIDE JURIDICTIONNELLE ═══
  { keywords: ["aide juridique", "avocat gratuit", "pas argent avocat", "aide juridictionnelle"],
    question: "Comment obtenir une aide juridictionnelle gratuite ?",
    answer: "Si vous n'avez pas les moyens de payer un avocat, vous pouvez demander l'aide juridictionnelle auprès du tribunal. Un avocat sera désigné d'office et les frais seront pris en charge par l'État. L'aide est accordée sous condition de ressources.",
    articles: "Loi n°2011-42 sur l'aide juridictionnelle", referTo: "Greffe du Tribunal / Barreau de Niamey" },

  // ═══ MINEUR ═══
  { keywords: ["mineur", "enfant", "adolescent", "juge enfant"],
    question: "Quelle est la procédure pour un mineur en conflit avec la loi ?",
    answer: "Les mineurs de moins de 13 ans ne peuvent être condamnés à une peine. De 13 à 18 ans, le juge des enfants est compétent. Les mesures éducatives sont privilégiées. La garde à vue d'un mineur ne peut excéder 24 heures. La présence d'un avocat est obligatoire.",
    articles: "Ordonnance n°99-11 sur la justice des mineurs", referTo: "Juge des Enfants / Service Social" },

  // ═══ FONCIER ═══
  { keywords: ["terrain", "foncier", "terre", "litige terrain", "propriété"],
    question: "Comment régler un litige foncier au Niger ?",
    answer: "Les litiges fonciers relèvent : 1) Du chef de quartier/village pour la conciliation, 2) De la Commission foncière (COFO) pour les terres rurales, 3) Du Tribunal de Grande Instance pour les litiges urbains. Munissez-vous de votre titre foncier, permis d'occuper ou attestation coutumière.",
    articles: "Ordonnance n°93-015 (Principes d'orientation du Code Rural)", referTo: "Commission foncière / Tribunal de Grande Instance" },

  // ═══ ÉTAT CIVIL ═══
  { keywords: ["état civil", "acte naissance", "mariage", "divorce"],
    question: "Comment obtenir un acte d'état civil ?",
    answer: "Les actes d'état civil (naissance, mariage, décès) sont délivrés par la mairie de la commune concernée. En cas de perte, un jugement supplétif est nécessaire auprès du Tribunal d'Instance. Pour un divorce, saisir le Tribunal de Grande Instance.",
    articles: "Loi n°62-11 portant organisation de l'état civil", referTo: "Mairie / Tribunal d'Instance" },

  // ═══ HARCÈLEMENT ═══
  { keywords: ["harcèlement", "harcèlement sexuel", "harcèlement travail"],
    question: "Que faire en cas de harcèlement ?",
    answer: "Le harcèlement est puni de 1 à 3 ans d'emprisonnement. Conservez les preuves (messages, témoignages). Déposez plainte au commissariat. Le harcèlement sexuel par un supérieur hiérarchique est une circonstance aggravante.",
    articles: "Art. 281 Code Pénal Niger", referTo: "Commissariat / Inspection du Travail / Tribunal" },

  // ═══ ORIENTATION GÉNÉRALE ═══
  { keywords: ["commissariat", "où aller", "qui contacter", "urgence"],
    question: "Où se référer en cas de problème juridique ?",
    answer: "• Urgence / Danger immédiat : Police (17) ou Gendarmerie\n• Déposer une plainte : Commissariat ou Gendarmerie\n• Conseil juridique : Avocat au Barreau de Niamey\n• Litige civil : Tribunal d'Instance ou TGI\n• Corruption : HALCIA\n• Violence faite aux femmes : SOS Femmes / Commissariat\n• Aide gratuite : Aide juridictionnelle (Greffe du Tribunal)",
    articles: "Annuaire des juridictions du Niger", referTo: "Selon la nature du problème (voir ci-dessus)" },
];

export const searchLocalKB = (query: string): LegalEntry | null => {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let bestMatch: LegalEntry | null = null;
  let bestScore = 0;

  for (const entry of LEGAL_KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwNorm = kw.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (q.includes(kwNorm)) score += 3;
      else {
        const words = kwNorm.split(" ");
        for (const w of words) {
          if (w.length > 2 && q.includes(w)) score += 1;
        }
      }
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }

  return bestScore >= 2 ? bestMatch : null;
};

export const SUGGESTED_QUESTIONS = [
  "Comment déposer une plainte ?",
  "Quels sont mes droits en garde à vue ?",
  "Quelles sont les peines pour vol ?",
  "Que faire en cas de violence conjugale ?",
  "Comment obtenir un avocat gratuit ?",
  "Où se référer en cas de problème ?",
];
