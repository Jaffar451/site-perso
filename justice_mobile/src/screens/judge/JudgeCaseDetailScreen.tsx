// PATH: src/screens/judge/JudgeCaseDetailScreen.tsx
import StatusBadge from '../../components/ui/StatusBadge';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  ScrollView, Alert, Image, StatusBar, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';

import { useAppTheme } from '../../theme/AppThemeProvider';
import { useAuthStore } from "../../stores/useAuthStore";
import { JudgeScreenProps } from '../../types/navigation';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { getComplaintById, transitionComplaint } from '../../services/complaint.service';
import { ENV } from '../../config/env';

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

const confirmAction = (t: string, m: string, fn: () => void) => {
  if (Platform.OS === 'web') { if (window.confirm(`${t}\n\n${m}`)) fn(); }
  else Alert.alert(t, m, [{ text: "Annuler", style: "cancel" }, { text: "Confirmer", onPress: fn }]);
};

const openFile = (url: string) => {
  if (Platform.OS === 'web') window.open(url, '_blank');
  else Linking.openURL(url);
};

export default function JudgeCaseDetailScreen({ route, navigation }: JudgeScreenProps<'JudgeCaseDetail'>) {
  const { isDark } = useAppTheme();
  const JUDGE_ACCENT = "#7C3AED";
  const { caseId } = route.params;
  const { user } = useAuthStore();

  const [complaint, setComplaint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acting, setActing]       = useState(false);

  const colors = {
    bgMain:        isDark ? "#0F172A" : "#F8FAFC",
    bgCard:        isDark ? "#1E293B" : "#FFFFFF",
    textMain:      isDark ? "#FFFFFF" : "#1E293B",
    textSub:       isDark ? "#94A3B8" : "#64748B",
    border:        isDark ? "#334155" : "#E2E8F0",
    integrityBg:   isDark ? "#064E3B" : "#F0FDF4",
    integrityText: isDark ? "#6EE7B7" : "#166534",
  };

  const reload = async () => {
    const data = await getComplaintById(caseId);
    setComplaint((data as any)?.data || data);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await reload();
      } catch {
        alertMsg("Accès Refusé", "Le dossier est protégé ou momentanément indisponible.");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [caseId]);

  const getPlaignantName = () => {
    if (!complaint) return "—";
    if (complaint.complainant) return `${(complaint.complainant.lastname || "").toUpperCase()} ${complaint.complainant.firstname || ""}`.trim();
    if (complaint.citizen)     return `${(complaint.citizen.lastname || "").toUpperCase()} ${complaint.citizen.firstname || ""}`.trim();
    return "Ministère Public";
  };

  const getFileUrl = (file: any): string | null => {
    const url = file?.fileUrl || file?.file_url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${ENV.API_URL.replace('/api', '')}/${url.replace(/^\//, '')}`;
  };

  // ── ✅ NOUVEAU : Ouverture de l'information judiciaire (saisi_juge → instruction) ──
  const handleOuvertureInstruction = () => {
    confirmAction(
      "Ouverture de l'Information Judiciaire",
      "Ouvrir l'information judiciaire et démarrer l'instruction de ce dossier (Art. 72 CPP) ?",
      async () => {
        setActing(true);
        try {
          await transitionComplaint(caseId, "instruction");
          alertMsg("✅ Instruction ouverte", "L'information judiciaire est ouverte. Vous pouvez maintenant instruire le dossier.");
          await reload();
        } catch (e: any) {
          alertMsg("Erreur", e?.response?.data?.message || "Impossible d'ouvrir l'instruction.");
        } finally {
          setActing(false);
        }
      }
    );
  };

  // ── Renvoi en jugement (instruction → audience_programmée) ───
  const handleRenvoi = () => {
    confirmAction(
      "Renvoi en Jugement",
      "Prononcer l'ordonnance de renvoi et inscrire l'affaire au rôle d'audience (Art. 74 CPP) ?",
      async () => {
        setActing(true);
        try {
          await transitionComplaint(caseId, "audience_programmée");
          alertMsg("✅ Ordonnance rendue", "L'affaire est inscrite au rôle. Le greffier peut fixer l'audience.");
          await reload();
        } catch (e: any) {
          alertMsg("Erreur", e?.response?.data?.message || "Impossible de rendre l'ordonnance.");
        } finally {
          setActing(false);
        }
      }
    );
  };

  // ── Non-lieu (instruction → non_lieu) ────────────────────────
  const handleNonLieu = () => {
    confirmAction(
      "Ordonnance de Non-Lieu",
      "Prononcer un non-lieu et clore l'instruction (Art. 74 CPP) ? Cette action est irréversible.",
      async () => {
        setActing(true);
        try {
          await transitionComplaint(caseId, "non_lieu");
          alertMsg("Non-lieu prononcé", "L'affaire est classée. Les parties seront notifiées.");
          navigation.goBack();
        } catch (e: any) {
          alertMsg("Erreur", e?.response?.data?.message || "Impossible de prononcer le non-lieu.");
        } finally {
          setActing(false);
        }
      }
    );
  };

  // ── Génération ordonnance PDF ─────────────────────────────────
  const generateOrdonnance = async (type: 'renvoi' | 'non_lieu' | 'ouverture') => {
    const date      = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const ref       = complaint?.trackingCode || `RP-${caseId}/26`;
    const plaignant = getPlaignantName();
    const jugeName  = user ? `${(user.lastname || "").toUpperCase()} ${user.firstname || ""}` : "Le Juge";

    const labels = {
      ouverture: "OUVERTURE D'INFORMATION JUDICIAIRE",
      renvoi:    "RENVOI EN JUGEMENT",
      non_lieu:  "NON-LIEU",
    };

    const bodies = {
      ouverture: `Attendu que le réquisitoire introductif du Procureur de la République saisit le Cabinet d'Instruction ;<br/><br/>
        <strong>ORDONNONS</strong> l'ouverture de l'information judiciaire conformément aux articles 72 à 74 du CPP Niger.`,
      renvoi: `Attendu que l'instruction est complète et que les charges réunies sont suffisantes ;<br/><br/>
        <strong>ORDONNONS</strong> le renvoi de l'affaire devant le tribunal compétent (Art. 74 CPP Niger).`,
      non_lieu: `Attendu qu'il n'existe pas de charges suffisantes contre quiconque ;<br/><br/>
        <strong>DISONS</strong> qu'il n'y a pas lieu à poursuites et ordonnons le classement du dossier (Art. 74 CPP Niger).`,
    };

    const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<style>
  body { font-family:"Times New Roman",serif; margin:50px 70px; font-size:12pt; line-height:1.9; }
  .entete { text-align:center; margin-bottom:25px; }
  h1 { font-size:14pt; text-transform:uppercase; border-bottom:3px double #000; display:inline-block; padding-bottom:6px; }
  .ref { border-left:5px solid #000; padding:10px 15px; margin:20px 0; background:#f9f9f9; }
  .corps { text-align:justify; margin:20px 0; }
  .dispositif { border:2px solid #000; padding:16px; margin-top:25px; }
  .dispositif-title { text-align:center; font-weight:bold; text-transform:uppercase; font-size:13pt; }
  .signature { margin-top:60px; text-align:right; }
  .footer { margin-top:40px; font-size:9pt; color:#555; border-top:1px solid #999; padding-top:6px; text-align:center; }
</style></head><body>
  <div class="entete">
    <p><strong>REPUBLIQUE DU NIGER</strong><br/>Fraternité — Travail — Progrès<br/>
    Tribunal de Grande Instance de Niamey<br/><strong>Cabinet d'Instruction</strong></p>
    <h1>Ordonnance de ${labels[type]}</h1>
    <p style="font-style:italic;">Art. 72-74 du Code de Procédure Pénale du Niger</p>
  </div>
  <div class="ref">
    <strong>Référence :</strong> ${ref}<br/>
    <strong>Date :</strong> ${date}<br/>
    <strong>Juge d'Instruction :</strong> ${jugeName}<br/>
    <strong>Partie plaignante :</strong> ${plaignant}
  </div>
  <div class="corps">
    <p><strong>Objet :</strong> ${complaint?.title || "Information Judiciaire"}</p>
    <p>${bodies[type]}</p>
  </div>
  <div class="dispositif">
    <div class="dispositif-title">Par ces motifs</div>
    <p>${bodies[type]}</p>
  </div>
  <div class="signature">
    <p>Fait à Niamey, le ${date}</p><br/><br/>
    <p>${jugeName}<br/>Juge d'Instruction</p>
    <p>____________________________</p>
    <p><em>Signature et sceau du Tribunal</em></p>
  </div>
  <div class="footer">
    Ordonnance N° — Système e-Justice Niger — Réf. ${ref}<br/>
    Établie conformément aux Arts. 72-74 CPP Niger (Éd. 2018)
  </div>
</body></html>`;

    try {
      if (Platform.OS === 'web') {
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
        else { const blob = new Blob([html], { type: 'text/html' }); window.open(URL.createObjectURL(blob), '_blank'); }
      } else {
        await Print.printAsync({ html });
      }
    } catch { alertMsg("Erreur PDF", "Impossible de générer l'ordonnance."); }
  };

  if (isLoading) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Examen du dossier" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={JUDGE_ACCENT} />
        <Text style={{ marginTop: 15, color: colors.textSub, fontWeight: '700' }}>Chargement des pièces...</Text>
      </View>
    </ScreenContainer>
  );

  if (!complaint) return null;

  // ✅ Tous les statuts couverts
  const isSaisiJuge     = complaint.status === 'saisi_juge';
  const isInInstruction = complaint.status === 'instruction';
  const isAudienceProg  = complaint.status === 'audience_programmée';
  const isTerminal      = ['jugée', 'non_lieu'].includes(complaint.status);

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Dossier N° ${complaint.trackingCode || `RP-${complaint.id}/26`}`} showBack />

      <ScrollView style={{ backgroundColor: colors.bgMain }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* EN-TÊTE */}
        <View style={[styles.refCard, { backgroundColor: colors.bgCard, borderLeftColor: JUDGE_ACCENT, borderColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.refTitle, { color: JUDGE_ACCENT }]}>CABINET D'INSTRUCTION</Text>
            <StatusBadge status={complaint.status} />
          </View>
          <Text style={[styles.offenceLabel, { color: colors.textSub }]}>PRÉVENTION RETENUE :</Text>
          <Text style={[styles.offenceValue, { color: colors.textMain }]}>
            {complaint.title || "Qualification Judiciaire en cours"}
          </Text>
          <Text style={[styles.offenceLabel, { color: colors.textSub, marginTop: 10 }]}>
            PARTIE PLAIGNANTE : <Text style={{ color: colors.textMain, fontWeight: "800" }}>{getPlaignantName()}</Text>
          </Text>
          {complaint.originStation && (
            <Text style={[styles.offenceLabel, { color: colors.textSub, marginTop: 6 }]}>
              UNITÉ : <Text style={{ color: colors.textMain, fontWeight: "800" }}>{complaint.originStation.name}</Text>
            </Text>
          )}
        </View>

        {/* SYNTHÈSE OPJ */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="document-text" size={20} color={JUDGE_ACCENT} />
            <Text style={[styles.cardTitle, { color: colors.textMain }]}>Synthèse de l'Enquête Préliminaire</Text>
          </View>
          <Text style={[styles.pvDetails, { color: colors.textMain }]}>
            {complaint.pvDetails || "Aucun rapport de synthèse versé au dossier par l'OPJ."}
          </Text>
          <View style={[styles.initialDescription, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}>
            <Text style={[styles.filedAt, { color: colors.textSub }]}>
              <Text style={{ fontWeight: '900' }}>Faits dénoncés : </Text>{complaint.description}
            </Text>
          </View>
        </View>

        {/* SCELLÉS */}
        <Text style={[styles.sectionLabel, { color: colors.textMain }]}>
          Scellés Numériques & Pièces ({complaint.attachments?.length || 0})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceRow}>
          {complaint.attachments?.length > 0 ? (
            complaint.attachments.map((file: any) => {
              const url   = getFileUrl(file);
              const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file.filename || "");
              return (
                <TouchableOpacity key={file.id} style={[styles.evidenceCard, { borderColor: colors.border }]} activeOpacity={0.8} onPress={() => url && openFile(url)}>
                  {isImg && url ? (
                    <Image source={{ uri: url }} style={styles.evidenceImg} />
                  ) : (
                    <View style={[styles.evidenceDoc, { backgroundColor: JUDGE_ACCENT + '15' }]}>
                      <Ionicons name="document-text" size={32} color={JUDGE_ACCENT} />
                      <Text style={{ fontSize: 9, color: JUDGE_ACCENT, fontWeight: '800', marginTop: 4 }}>
                        {file.filename?.split('.').pop()?.toUpperCase() || 'DOC'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.evidenceOverlay}><Ionicons name="eye" size={16} color="#FFF" /></View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyEvidence, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name="images-outline" size={32} color={colors.textSub} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucun scellé iconographique.</Text>
            </View>
          )}
        </ScrollView>

        {/* ACTES DU MAGISTRAT */}
        <Text style={[styles.actionTitle, { color: colors.textMain }]}>Actes et Décisions du Cabinet</Text>

        {/* ✅ NOUVEAU — Dossier reçu du parquet : ouvrir l'instruction */}
        {isSaisiJuge && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.verdictButton, { backgroundColor: JUDGE_ACCENT, marginBottom: 12 }]}
            onPress={() => { generateOrdonnance('ouverture'); handleOuvertureInstruction(); }}
            disabled={acting}
          >
            {acting ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="folder-open" size={22} color="#FFF" />
                <Text style={styles.buttonText}>OUVRIR L'INFORMATION JUDICIAIRE</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Actions toujours disponibles */}
        {!isTerminal && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              onPress={() => navigation.navigate("IssueArrestWarrant", { caseId: complaint.id })}
            >
              <Ionicons name="document-lock" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Signer Mandat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, { backgroundColor: JUDGE_ACCENT }]}
              onPress={() => navigation.navigate("JudgeHearing", {} as any)}
            >
              <Ionicons name="mic-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Calendrier</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ordonnances — pendant l'instruction */}
        {isInInstruction && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, { backgroundColor: "#10B981" }]}
              onPress={() => { generateOrdonnance('renvoi'); handleRenvoi(); }}
              disabled={acting}
            >
              {acting ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Ionicons name="hammer" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Renvoi en jugement</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
              onPress={() => { generateOrdonnance('non_lieu'); handleNonLieu(); }}
              disabled={acting}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Non-lieu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Verdict — audience programmée */}
        {isAudienceProg && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.verdictButton, { backgroundColor: JUDGE_ACCENT }]}
            onPress={() => navigation.navigate("JudgeVerdict" as any, { caseId: complaint.id })}
          >
            <Ionicons name="hammer" size={22} color="#FFF" />
            <Text style={styles.buttonText}>Rendre le Verdict</Text>
          </TouchableOpacity>
        )}

        {/* Dossier terminal */}
        {isTerminal && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle" size={40} color="#10B981" />
            <Text style={[styles.cardTitle, { color: colors.textMain, marginTop: 10 }]}>Dossier Clôturé</Text>
            <Text style={[styles.filedAt, { color: colors.textSub, textAlign: 'center', marginTop: 5 }]}>
              Ce dossier est en état terminal et ne peut plus être modifié.
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent:      { padding: 20, paddingBottom: 150 },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  refCard:            { padding: 22, borderRadius: 24, marginBottom: 20, borderLeftWidth: 10, borderWidth: 1, elevation: 4 },
  headerRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  refTitle:           { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  offenceLabel:       { fontSize: 10, fontWeight: "900", letterSpacing: 1, opacity: 0.7 },
  offenceValue:       { fontSize: 20, fontWeight: "900", marginTop: 5, letterSpacing: -0.5 },
  card:               { padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, elevation: 2 },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 12, borderBottomWidth: 1 },
  cardTitle:          { fontSize: 13, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 0.5 },
  pvDetails:          { fontSize: 15, lineHeight: 26, fontWeight: '500', marginBottom: 20 },
  initialDescription: { padding: 15, borderRadius: 12 },
  filedAt:            { fontSize: 13, lineHeight: 20 },
  sectionLabel:       { fontSize: 11, fontWeight: "900", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1.5 },
  evidenceRow:        { marginBottom: 35 },
  evidenceCard:       { width: 120, height: 120, borderRadius: 20, marginRight: 15, overflow: 'hidden', borderWidth: 1 },
  evidenceImg:        { width: '100%', height: '100%' },
  evidenceDoc:        { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  evidenceOverlay:    { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 6 },
  emptyEvidence:      { width: 180, height: 120, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5 },
  emptyText:          { fontSize: 11, marginTop: 10, fontWeight: '700' },
  actionTitle:        { fontSize: 18, fontWeight: "900", marginBottom: 20, marginTop: 10, letterSpacing: -0.5 },
  buttonRow:          { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionButton:       { flex: 1, flexDirection: "row", height: 62, borderRadius: 20, alignItems: 'center', justifyContent: "center", gap: 10, elevation: 3 },
  verdictButton:      { flexDirection: "row", height: 68, borderRadius: 22, alignItems: 'center', justifyContent: "center", gap: 12, marginTop: 5, elevation: 5 },
  buttonText:         { color: 'white', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});