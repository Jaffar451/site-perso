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

  // ═══ FAUX ET USAGE DE FAUX ═══
  { keywords: ["faux", "usage de faux", "falsification", "faux document"],
    question: "Quelles sont les peines pour faux et usage de faux ?",
    answer: "La fabrication de faux documents est punie de 5 à 10 ans d'emprisonnement. L'usage de faux documents (utilisation en connaissance de cause) est puni des mêmes peines. En matière de faux en écriture publique (actes notariés, jugements), la peine peut aller jusqu'à 20 ans.",
    articles: "Art. 149-156 Code Pénal Niger", referTo: "Commissariat / Tribunal de Grande Instance" },

  { keywords: ["fausse identité", "usurpation identité", "faux papier"],
    question: "Quelles sont les peines pour usurpation d'identité ?",
    answer: "L'usurpation d'identité est punie de 1 à 5 ans d'emprisonnement. Si elle est commise via des moyens numériques (réseaux sociaux, email), la Loi sur la Cybercriminalité s'applique également avec des peines plus lourdes.",
    articles: "Art. 156 Code Pénal + Loi n°2019-33", referTo: "Commissariat / Division Cybercriminalité" },

  // ═══ INFRACTIONS ROUTIÈRES ═══
  { keywords: ["accident", "accident route", "accident circulation", "blessé route"],
    question: "Que faire en cas d'accident de la route ?",
    answer: "1) Sécurisez les lieux et appelez les secours. 2) Ne déplacez pas les véhicules avant l'arrivée de la police. 3) Prenez des photos et relevez les témoins. 4) Le constat doit être établi par un OPJ. L'homicide involontaire par accident est puni de 1 à 5 ans.",
    articles: "Art. 244-248 Code Pénal Niger", referTo: "Police / Gendarmerie / Hôpital" },

  { keywords: ["conduite ivresse", "alcool volant", "conduite dangereuse"],
    question: "Quelles sont les peines pour conduite en état d'ivresse ?",
    answer: "La conduite en état d'ivresse est punie de 1 mois à 1 an d'emprisonnement et d'une amende. En cas d'accident corporel : 2 à 5 ans. En cas d'homicide involontaire : 5 à 10 ans. Le permis peut être suspendu ou annulé.",
    articles: "Art. 244-248 Code Pénal + Code de la Route Niger", referTo: "Police / Gendarmerie / Tribunal de Police" },

  // ═══ INFRACTIONS CONTRE LA FAMILLE ═══
  { keywords: ["abandon famille", "pension alimentaire", "non paiement pension"],
    question: "Quelles sont les peines pour abandon de famille ?",
    answer: "L'abandon de famille (non-paiement de pension alimentaire pendant plus de 2 mois) est puni de 1 à 3 ans d'emprisonnement et d'une amende. La victime peut saisir directement le tribunal par citation directe.",
    articles: "Art. 269-271 Code Pénal Niger", referTo: "Tribunal de Grande Instance / Avocat" },

  { keywords: ["bigamie", "deux mariages", "polygamie illégale"],
    question: "La bigamie est-elle punie au Niger ?",
    answer: "Le Niger autorise la polygamie (jusqu'à 4 épouses) conformément au droit musulman, à condition que le mariage soit déclaré. La bigamie (mariage sans déclaration) peut être sanctionnée. Le consentement de la première épouse est recommandé mais non obligatoire.",
    articles: "Loi n°62-11 + Coutume et droit islamique", referTo: "Tribunal d'Instance / Mairie" },

  { keywords: ["mariage forcé", "mariage précoce", "mariage mineur"],
    question: "Le mariage forcé est-il interdit au Niger ?",
    answer: "Le mariage forcé est interdit. L'âge minimum légal est de 15 ans pour les filles et 18 ans pour les garçons (avec dérogation du juge). Tout mariage sans consentement libre est nul. Le mariage d'une mineure de moins de 15 ans est puni de 1 à 3 ans.",
    articles: "Code Civil Niger + Loi n°2014-72", referTo: "Tribunal d'Instance / Protection de l'Enfance" },

  { keywords: ["divorce", "comment divorcer", "procédure divorce"],
    question: "Comment obtenir un divorce au Niger ?",
    answer: "Le divorce peut être demandé : 1) Par consentement mutuel (tribunal d'instance). 2) Pour faute (violence, abandon, infidélité). 3) Par répudiation (droit musulman, avec compensation). Le juge statue sur la garde des enfants et la pension alimentaire.",
    articles: "Code Civil Niger + Droit coutumier/islamique", referTo: "Tribunal d'Instance / Tribunal de Grande Instance" },

  // ═══ DROIT DU TRAVAIL ═══
  { keywords: ["licenciement", "renvoyé travail", "licenciement abusif"],
    question: "Que faire en cas de licenciement abusif ?",
    answer: "Le licenciement doit être notifié par écrit avec motif. Le préavis est de 1 à 3 mois selon l'ancienneté. En cas de licenciement abusif, le salarié peut saisir l'Inspection du Travail puis le Tribunal du Travail. Les indemnités peuvent aller jusqu'à 24 mois de salaire.",
    articles: "Code du Travail Niger (Loi n°2012-45)", referTo: "Inspection du Travail / Tribunal du Travail" },

  { keywords: ["salaire impayé", "pas payé", "retard salaire"],
    question: "Que faire si mon employeur ne me paie pas ?",
    answer: "Le non-paiement du salaire est une infraction pénale. 1) Adressez une mise en demeure écrite à l'employeur. 2) Saisissez l'Inspection du Travail pour conciliation. 3) En cas d'échec, saisissez le Tribunal du Travail. Le SMIG au Niger est de 30 047 FCFA/mois.",
    articles: "Art. 152-168 Code du Travail Niger", referTo: "Inspection du Travail / Tribunal du Travail" },

  { keywords: ["accident travail", "blessé au travail", "maladie professionnelle"],
    question: "Que faire en cas d'accident du travail ?",
    answer: "1) Faites constater l'accident par un médecin sous 48h. 2) Déclarez l'accident à la CNSS (Caisse Nationale de Sécurité Sociale). 3) L'employeur doit prendre en charge les frais médicaux. 4) En cas d'invalidité, une rente est versée par la CNSS.",
    articles: "Loi n°2003-34 (régime de sécurité sociale)", referTo: "CNSS / Inspection du Travail / Hôpital" },

  // ═══ TERRORISME ET SÉCURITÉ ═══
  { keywords: ["terrorisme", "attentat", "sécurité nationale", "boko haram"],
    question: "Quelles sont les peines pour terrorisme au Niger ?",
    answer: "Le terrorisme est puni de la réclusion criminelle à perpétuité. Le financement du terrorisme : 10 à 20 ans. L'apologie du terrorisme : 5 à 10 ans. La garde à vue pour terrorisme peut aller jusqu'à 15 jours (renouvelable). Les affaires sont jugées par le Pôle Judiciaire Spécialisé.",
    articles: "Loi n°2016-22 + Loi n°2011-12 (anti-terrorisme)", referTo: "Pôle Judiciaire Spécialisé / DGSE / Gendarmerie" },

  // ═══ DROIT COMMERCIAL ═══
  { keywords: ["chèque sans provision", "chèque impayé", "chèque refusé"],
    question: "Quelles sont les peines pour chèque sans provision ?",
    answer: "L'émission de chèque sans provision est punie de 1 à 5 ans d'emprisonnement et d'une amende. La régularisation (paiement du montant) avant poursuites peut éteindre l'action pénale. Le bénéficiaire peut aussi engager une action civile.",
    articles: "Acte Uniforme OHADA (Art. 60-65)", referTo: "Tribunal de Commerce / Banque" },

  { keywords: ["dette", "créancier", "recouvrement", "argent prêté"],
    question: "Comment récupérer une dette au Niger ?",
    answer: "1) Mise en demeure par huissier (sommation de payer). 2) Si pas de réponse sous 30 jours : saisir le tribunal. 3) Le juge peut ordonner une injonction de payer. 4) L'huissier procède à la saisie des biens si nécessaire. Conservez toute preuve (reconnaissance de dette, messages).",
    articles: "Acte Uniforme OHADA (recouvrement)", referTo: "Huissier de Justice / Tribunal de Commerce" },

  // ═══ DÉTENTION ET PRISON ═══
  { keywords: ["condition détention", "traitement prison", "droit détenu prison"],
    question: "Quels sont les droits d'un détenu en prison ?",
    answer: "Le détenu a droit : 1) À la dignité et l'intégrité physique. 2) À l'alimentation et aux soins médicaux. 3) Aux visites familiales. 4) À la correspondance. 5) À l'exercice religieux. 6) À la formation professionnelle. Les traitements inhumains sont interdits et punissables.",
    articles: "Loi n°2017-05 (régime pénitentiaire Niger)", referTo: "Direction de l'Administration Pénitentiaire / CNDH" },

  { keywords: ["transfert prison", "changer prison", "rapprochement familial"],
    question: "Comment demander un transfert de prison ?",
    answer: "Le transfert peut être demandé par le détenu, sa famille ou son avocat au Directeur de l'Administration Pénitentiaire. Motifs acceptés : rapprochement familial, raisons médicales, surpopulation, sécurité. Le transfert est ordonné par le Garde des Sceaux.",
    articles: "Loi n°2017-05 (Art. 45-50)", referTo: "Direction de l'Administration Pénitentiaire / Avocat" },

  { keywords: ["grâce présidentielle", "amnistie", "réduction peine"],
    question: "Comment obtenir une grâce ou réduction de peine ?",
    answer: "La grâce présidentielle est accordée par le Président de la République sur proposition du Ministre de la Justice. La réduction de peine est accordée pour bonne conduite (1 à 3 mois par année de détention). L'amnistie est votée par l'Assemblée Nationale et efface la condamnation.",
    articles: "Constitution du Niger (Art. 79) + Code Pénal", referTo: "Ministère de la Justice / Direction des Grâces" },

  // ═══ ENVIRONNEMENT ═══
  { keywords: ["environnement", "pollution", "déforestation", "braconnage"],
    question: "Quelles sont les infractions environnementales au Niger ?",
    answer: "Le braconnage d'espèces protégées : 1 à 5 ans + amende. La coupe abusive de bois : amende + confiscation. La pollution des eaux : 2 à 5 ans. Le trafic de faune sauvage : 1 à 5 ans. Les infractions sont constatées par les agents des Eaux et Forêts.",
    articles: "Loi n°98-07 (régime de la faune) + Code de l'Environnement", referTo: "Direction des Eaux et Forêts / Tribunal" },

  // ═══ PROPRIÉTÉ INTELLECTUELLE ═══
  { keywords: ["contrefaçon", "copie", "marque", "propriété intellectuelle"],
    question: "Quelles sont les peines pour contrefaçon ?",
    answer: "La contrefaçon de marques et brevets est punie de 1 à 3 ans d'emprisonnement et d'une amende. La saisie et destruction des produits contrefaits est ordonnée. Le Niger est membre de l'OAPI (Organisation Africaine de la Propriété Intellectuelle).",
    articles: "Accord de Bangui (OAPI) + Code Pénal", referTo: "OAPI / Tribunal de Commerce" },

  // ═══ NATIONALITÉ ET IMMIGRATION ═══
  { keywords: ["nationalité", "devenir nigérien", "naturalisation"],
    question: "Comment obtenir la nationalité nigérienne ?",
    answer: "La nationalité nigérienne s'acquiert : 1) Par naissance (père ou mère nigérien). 2) Par naturalisation (10 ans de résidence + bonne moralité). 3) Par mariage (après 5 ans de mariage avec un nigérien). La demande se fait auprès du Ministère de la Justice.",
    articles: "Code de la Nationalité Niger (Ordonnance n°84-33)", referTo: "Ministère de la Justice / Tribunal de Grande Instance" },

  { keywords: ["expulsion", "étranger", "séjour irrégulier", "sans papier"],
    question: "Quelles sont les règles sur l'immigration au Niger ?",
    answer: "Le séjour irrégulier est puni d'une amende et de l'expulsion. La carte de séjour est obligatoire pour les étrangers résidant plus de 3 mois. L'aide à l'immigration clandestine est punie de 5 à 10 ans. Les réfugiés ont un statut protégé par la convention de Genève.",
    articles: "Ordonnance n°81-40 + Loi n°2015-36 (trafic de migrants)", referTo: "Direction de la Surveillance du Territoire / HCR" },

  // ═══ MÉDIATION ET CONCILIATION ═══
  { keywords: ["médiation", "conciliation", "régler à l'amiable", "arrangement"],
    question: "Peut-on régler un litige à l'amiable au Niger ?",
    answer: "Oui, la médiation est encouragée avant toute action judiciaire. Les modes de règlement : 1) Chef de quartier/village (litiges de voisinage). 2) Commission de conciliation au tribunal. 3) Médiateur agréé (litiges commerciaux). 4) Arbitrage OHADA (litiges d'affaires). La conciliation est gratuite au tribunal.",
    articles: "Code de Procédure Civile Niger + Acte Uniforme OHADA", referTo: "Chef de quartier / Tribunal d'Instance / Médiateur agréé" },

  // ═══ PRESSE ET LIBERTÉ D'EXPRESSION ═══
  { keywords: ["diffamation", "injure", "calomnie", "presse"],
    question: "Quelles sont les peines pour diffamation ?",
    answer: "La diffamation publique est punie de 3 mois à 1 an d'emprisonnement et d'une amende. L'injure : 1 à 6 mois. La diffamation par voie de presse est encadrée par la loi sur la liberté de la presse. La plainte doit être déposée dans les 3 mois suivant la publication.",
    articles: "Loi n°2010-24 (liberté de la presse) + Art. 263 Code Pénal", referTo: "Commissariat / CSC (Conseil Supérieur de la Communication)" },

  // ═══ DROIT ÉLECTORAL ═══
  { keywords: ["élection", "fraude électorale", "vote", "carte électeur"],
    question: "Quelles sont les infractions électorales au Niger ?",
    answer: "La fraude électorale est punie de 1 à 5 ans d'emprisonnement. Cela inclut : le bourrage d'urnes, l'achat de voix, la falsification de résultats, l'empêchement de voter. Le contentieux électoral relève de la Cour Constitutionnelle.",
    articles: "Code Électoral Niger (Loi n°2019-38)", referTo: "CENI / Cour Constitutionnelle" },

  // ═══ DOUANE ═══
  { keywords: ["douane", "contrebande", "fraude douanière", "importation"],
    question: "Quelles sont les peines pour contrebande ?",
    answer: "La contrebande (importation/exportation sans déclaration) est punie de 1 à 5 ans et d'une amende de 3 à 10 fois la valeur des marchandises. Les marchandises sont confisquées. Les agents des douanes peuvent procéder à des saisies et des arrestations.",
    articles: "Code des Douanes Niger + Tarif Extérieur Commun CEDEAO", referTo: "Direction Générale des Douanes / Tribunal" },

  // ═══ SANTÉ PUBLIQUE ═══
  { keywords: ["exercice illégal médecine", "faux médecin", "charlatanisme"],
    question: "Quelles sont les peines pour exercice illégal de la médecine ?",
    answer: "L'exercice illégal de la médecine est puni de 6 mois à 3 ans d'emprisonnement et d'une amende. Cela inclut les guérisseurs qui se font passer pour des médecins et prescrivent des médicaments. La vente de faux médicaments est punie de 5 à 10 ans.",
    articles: "Loi n°98-016 (Code de la Santé Publique)", referTo: "Ordre des Médecins / Tribunal / Direction de la Pharmacie" },

  // ═══ PROCÉDURES SPÉCIALES ═══
  { keywords: ["flagrant délit", "pris sur le fait", "flagrance"],
    question: "Qu'est-ce que le flagrant délit ?",
    answer: "Il y a flagrant délit quand l'infraction se commet ou vient de se commettre. En flagrance, l'OPJ dispose de pouvoirs étendus : perquisition sans mandat (même de nuit), garde à vue immédiate, saisie des preuves. Le Procureur est immédiatement informé.",
    articles: "Art. 41-68 CPP Niger", referTo: "Commissariat / Procureur de la République" },

  { keywords: ["prescription", "délai plainte", "trop tard plainte"],
    question: "Quel est le délai pour porter plainte ?",
    answer: "Les délais de prescription sont : Contravention : 1 an. Délit : 3 ans. Crime : 10 ans. Le délai court à partir du jour de la commission de l'infraction. Pour les crimes contre des mineurs, le délai ne court qu'à partir de la majorité de la victime.",
    articles: "Art. 7-9 CPP Niger", referTo: "Commissariat / Procureur de la République" },

  { keywords: ["casier judiciaire", "bulletin n°3", "extrait casier"],
    question: "Comment obtenir un extrait de casier judiciaire ?",
    answer: "Le bulletin n°3 (extrait destiné au demandeur) est délivré par le greffe du tribunal du lieu de naissance. Pièces requises : acte de naissance + pièce d'identité + timbre fiscal. Délai : 3 à 7 jours. Pour les personnes nées à l'étranger, s'adresser au Tribunal de Grande Instance de Niamey.",
    articles: "Art. 341-350 CPP Niger", referTo: "Greffe du Tribunal du lieu de naissance" },

  { keywords: ["témoin", "témoignage", "obligation témoigner"],
    question: "Est-on obligé de témoigner en justice ?",
    answer: "Oui, toute personne convoquée comme témoin est tenue de comparaître sous peine d'amende. Le faux témoignage est puni de 2 à 5 ans d'emprisonnement. Les exceptions : le conjoint, les ascendants et descendants du prévenu ne sont pas tenus de témoigner.",
    articles: "Art. 90-95 CPP Niger + Art. 160-165 Code Pénal", referTo: "Tribunal / Juge d'Instruction" },

  { keywords: ["récidive", "deuxième infraction", "récidiviste"],
    question: "Quelles sont les conséquences de la récidive ?",
    answer: "En cas de récidive, le maximum de la peine est doublé. Pour les contraventions : la récidive entraîne l'emprisonnement. Pour les délits : le maximum est doublé. Pour les crimes : la réclusion à perpétuité peut être prononcée.",
    articles: "Art. 58-62 Code Pénal Niger", referTo: "Tribunal / Avocat" },

  { keywords: ["sursis", "peine avec sursis", "sursis probatoire"],
    question: "Qu'est-ce qu'une peine avec sursis ?",
    answer: "Le sursis simple suspend l'exécution de la peine pendant 5 ans. Si le condamné ne commet pas de nouvelle infraction durant cette période, la peine est réputée non avenue. Le sursis avec mise à l'épreuve impose des obligations (travail, soins, pointage). Le sursis n'est possible que pour les peines de moins de 5 ans.",
    articles: "Art. 63-68 Code Pénal Niger", referTo: "Tribunal / Juge d'Application des Peines" },

  // ═══ VIOL ET AGRESSION SEXUELLE ═══
  { keywords: ["viol", "agression sexuelle", "abus sexuel", "attouchement"],
    question: "Quelles sont les peines pour viol au Niger ?",
    answer: "Le viol est un crime puni de 10 à 20 ans de réclusion criminelle. Si la victime est mineure de 13 ans : réclusion à perpétuité. Circonstances aggravantes : pluralité d'auteurs, utilisation d'une arme, lien d'autorité. L'attentat à la pudeur est puni de 2 à 5 ans.",
    articles: "Art. 278-283 Code Pénal Niger", referTo: "Commissariat (OPJ spécialisé) / Hôpital (certificat médical) / Tribunal" },

  { keywords: ["pédophilie", "abus enfant", "mineur victime"],
    question: "Que faire si un enfant est victime d'abus ?",
    answer: "1) Protégez l'enfant immédiatement. 2) Signalez aux services sociaux ou au commissariat. 3) Faites examiner l'enfant par un médecin. 4) Le délai de prescription ne court qu'à la majorité de l'enfant. Les peines sont aggravées quand la victime est mineure. L'auteur encourt la réclusion à perpétuité.",
    articles: "Art. 278-283 Code Pénal + Ordonnance n°99-11", referTo: "Protection de l'Enfance / Commissariat / Hôpital" },

  // ═══ TRAFIC D'ÊTRES HUMAINS ═══
  { keywords: ["traite", "trafic humain", "esclavage", "exploitation"],
    question: "Quelles sont les peines pour traite des personnes ?",
    answer: "La traite des personnes est punie de 5 à 10 ans d'emprisonnement. Si la victime est mineure : 10 à 30 ans. L'esclavage et les pratiques analogues : 10 à 30 ans. Le Niger dispose d'une Agence Nationale de Lutte contre la Traite (ANLTP).",
    articles: "Ordonnance n°2010-86 + Loi n°2003-025", referTo: "ANLTP / Commissariat / Tribunal" },

  // ═══ SÉQUESTRATION ═══
  { keywords: ["séquestration", "enfermé", "retenu contre gré", "enlèvement rançon"],
    question: "Quelles sont les peines pour séquestration ?",
    answer: "La séquestration est punie de 5 à 10 ans d'emprisonnement. Si elle dure plus d'un mois : 10 à 20 ans. Si elle est accompagnée de torture : réclusion à perpétuité. L'enlèvement avec demande de rançon : 10 à 20 ans. Si la victime décède : perpétuité.",
    articles: "Art. 270-274 Code Pénal Niger", referTo: "Commissariat / Gendarmerie / Procureur" },

  // ═══ INCENDIE ═══
  { keywords: ["incendie volontaire", "feu", "pyromanie", "brûler"],
    question: "Quelles sont les peines pour incendie volontaire ?",
    answer: "L'incendie volontaire d'un bien appartenant à autrui est puni de 5 à 10 ans. Si l'incendie met en danger des personnes : 10 à 20 ans. Si des personnes décèdent : réclusion à perpétuité. L'incendie de forêts ou récoltes : 2 à 5 ans.",
    articles: "Art. 345-351 Code Pénal Niger", referTo: "Sapeurs-Pompiers / Commissariat / Tribunal" },

  // ═══ RECEL ═══
  { keywords: ["recel", "acheter volé", "objet volé", "recéleur"],
    question: "Quelles sont les peines pour recel ?",
    answer: "Le recel (détenir ou acheter un bien en sachant qu'il provient d'un crime/délit) est puni de 1 à 5 ans d'emprisonnement. La peine peut être supérieure à celle du vol initial si le receleur connaissait les circonstances aggravantes. Les biens recelés sont confisqués.",
    articles: "Art. 341-343 Code Pénal Niger", referTo: "Commissariat / Tribunal" },

  // ═══ OUTRAGE ET RÉBELLION ═══
  { keywords: ["outrage", "insulter policier", "insulter juge", "rébellion"],
    question: "Quelles sont les peines pour outrage à agent ?",
    answer: "L'outrage à un agent public dans l'exercice de ses fonctions est puni de 1 mois à 1 an d'emprisonnement. L'outrage à un magistrat : 2 mois à 2 ans. La rébellion (résistance violente) : 6 mois à 2 ans. Si elle est commise en réunion avec armes : 1 à 5 ans.",
    articles: "Art. 167-175 Code Pénal Niger", referTo: "Commissariat / Tribunal de Police" },

  // ═══ ATTEINTE À LA VIE PRIVÉE ═══
  { keywords: ["vie privée", "espionnage", "écoute", "caméra cachée", "photo sans accord"],
    question: "Quelles sont les peines pour atteinte à la vie privée ?",
    answer: "L'enregistrement de conversations privées sans consentement : 1 à 5 ans. La publication de photos/vidéos intimes sans consentement : 1 à 3 ans + amende. La violation de domicile : 1 à 5 ans. L'ouverture de correspondance privée : 6 mois à 2 ans.",
    articles: "Art. 261-265 Code Pénal + Loi n°2019-33 (cyber)", referTo: "Commissariat / Division Cybercriminalité" },

  // ═══ MENDICITÉ ET VAGABONDAGE ═══
  { keywords: ["mendicité", "mendiant", "vagabondage", "enfant mendiant"],
    question: "La mendicité est-elle punie au Niger ?",
    answer: "Le vagabondage est puni de 15 jours à 6 mois. L'exploitation de la mendicité d'autrui (surtout d'enfants) est punie de 1 à 5 ans. Les maîtres coraniques qui forcent les enfants (talibés) à mendier peuvent être poursuivis. Des programmes de réinsertion existent.",
    articles: "Art. 274-277 Code Pénal Niger", referTo: "Services Sociaux / Protection de l'Enfance / Commissariat" },

  // ═══ BLANCHIMENT D'ARGENT ═══
  { keywords: ["blanchiment", "argent sale", "blanchiment argent", "centif"],
    question: "Quelles sont les peines pour blanchiment d'argent ?",
    answer: "Le blanchiment de capitaux est puni de 3 à 7 ans d'emprisonnement et d'une amende pouvant aller jusqu'à 5 fois la somme blanchie. Les personnes morales (sociétés) peuvent être condamnées à des amendes jusqu'à 5 fois le montant. La CENTIF est l'organe de renseignement financier du Niger.",
    articles: "Loi n°2004-041 (lutte contre le blanchiment) + CENTIF", referTo: "CENTIF / Procureur de la République / Tribunal" },

  // ═══ DÉTOURNEMENT DE FONDS PUBLICS ═══
  { keywords: ["détournement", "fonds publics", "détournement deniers", "fonctionnaire"],
    question: "Quelles sont les peines pour détournement de fonds publics ?",
    answer: "Le détournement de deniers publics par un fonctionnaire est puni de 5 à 10 ans d'emprisonnement et d'une amende égale au montant détourné. Si le montant dépasse 1 million FCFA : 10 à 20 ans. Le fonctionnaire est destitué et déchu de ses droits civiques.",
    articles: "Art. 134-140 Code Pénal Niger + Loi n°2003-025", referTo: "HALCIA / Procureur de la République / Cour des Comptes" },

  // ═══ EMPOISONNEMENT ═══
  { keywords: ["empoisonnement", "poison", "intoxication volontaire"],
    question: "Quelles sont les peines pour empoisonnement ?",
    answer: "L'empoisonnement (administration de substances mortelles) est un crime puni de la réclusion criminelle à perpétuité, quelle que soit l'issue (même si la victime survit). La tentative d'empoisonnement est punie des mêmes peines. L'administration de substances nuisibles : 2 à 5 ans.",
    articles: "Art. 219-221 Code Pénal Niger", referTo: "Commissariat / Hôpital (analyse toxicologique) / Tribunal" },

  // ═══ ASSOCIATION DE MALFAITEURS ═══
  { keywords: ["bande organisée", "association malfaiteurs", "gang", "mafia"],
    question: "Quelles sont les peines pour association de malfaiteurs ?",
    answer: "L'association de malfaiteurs est punie de 5 à 10 ans d'emprisonnement. Si l'association est en vue de commettre des crimes : 10 à 20 ans. Les chefs et organisateurs encourent le double de la peine. Les membres qui dénoncent avant l'action bénéficient d'une exemption de peine.",
    articles: "Art. 177-180 Code Pénal Niger", referTo: "Police Judiciaire / Procureur / Tribunal" },

  // ═══ USURE ═══
  { keywords: ["usure", "taux intérêt", "prêt usuraire", "prêteur"],
    question: "L'usure est-elle punie au Niger ?",
    answer: "Le prêt à un taux d'intérêt excessif (usure) est puni de 2 mois à 2 ans d'emprisonnement et d'une amende. Le taux d'intérêt maximum légal est fixé par la BCEAO. Le prêteur usuraire est tenu de restituer les intérêts perçus au-delà du taux légal.",
    articles: "Loi n°2007-14 + Réglementation BCEAO/UEMOA", referTo: "Tribunal d'Instance / BCEAO" },

  // ═══ PROCURATION ET TUTELLE ═══
  { keywords: ["tutelle", "curatelle", "procuration", "incapable majeur", "personne âgée"],
    question: "Comment mettre une personne sous tutelle au Niger ?",
    answer: "La mise sous tutelle est prononcée par le juge des tutelles (Tribunal d'Instance) pour les personnes atteintes d'une altération de leurs facultés. La demande peut être faite par la famille, le Procureur ou un médecin. Le tuteur gère les biens et représente la personne.",
    articles: "Code Civil Niger (Titre X : Tutelle)", referTo: "Tribunal d'Instance / Juge des Tutelles" },

  // ═══ NUMÉROS UTILES ═══
  { keywords: ["numéro urgence", "téléphone", "appeler police", "numéro utile"],
    question: "Quels sont les numéros d'urgence au Niger ?",
    answer: "• Police Secours : 17\n• Gendarmerie : 20 72 23 41\n• Sapeurs-Pompiers : 18\n• SAMU : 15\n• Protection Civile : 20 73 28 49\n• HALCIA (anti-corruption) : 20 72 29 00\n• SOS Femmes : 08 00 11 33\n• Croix-Rouge Niger : 20 73 31 64",
    articles: "Annuaire des services d'urgence du Niger", referTo: "Selon la nature de l'urgence (voir numéros ci-dessus)" },

  // ═══ E-JUSTICE NIGER ═══
  { keywords: ["e-justice", "application", "comment utiliser", "aide application"],
    question: "Comment utiliser l'application e-Justice Niger ?",
    answer: "L'application e-Justice permet de : 1) Déposer une plainte en ligne. 2) Suivre l'avancement de votre dossier avec un code de suivi. 3) Vérifier l'authenticité d'un acte judiciaire (QR Code). 4) Consulter vos droits via cet assistant juridique. 5) Recevoir des notifications sur votre dossier.",
    articles: "Système d'Information Judiciaire du Niger", referTo: "Support technique : mamanejaffar456@gmail.com" },

  { keywords: ["code suivi", "numéro dossier", "plt", "tracking"],
    question: "Comment retrouver mon code de suivi ?",
    answer: "Votre code de suivi (format PLT-AAAA-XXXXXX) vous est communiqué lors du dépôt de votre plainte. Il figure sur le récépissé (PDF) et dans l'email de confirmation. Si vous l'avez perdu, rendez-vous au commissariat avec votre pièce d'identité pour le récupérer.",
    articles: "Système e-Justice Niger", referTo: "Commissariat d'origine / Application e-Justice" },

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
  "Quel est le délai pour porter plainte ?",
  "Comment obtenir un casier judiciaire ?",
  "Que faire en cas d'accident de la route ?",
  "Comment régler un litige foncier ?",
  "Où se référer en cas de problème ?",
];
