// PATH: src/screens/police/PolicePVScreen.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";

import { ENV } from "../../config/env";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { useAuthStore } from "../../stores/useAuthStore";
import { PoliceScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import {
  transitionComplaint,
  getComplaintById,
  updateComplaint,
} from "../../services/complaint.service";

const alertMsg = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

type PVType = "AUDITION" | "CONSTAT" | "INTERPELLATION" | "PERQUISITION";

interface Attachment {
  uri:  string;
  type: "image" | "audio" | "video" | "document";
  name: string;
}

export default function PolicePVScreen({ route, navigation }: PoliceScreenProps<"PolicePVScreen">) {
  const { theme, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const primaryColor = theme.colors.primary;
  const complaintId  = route.params?.complaintId;

  const [pvType,         setPvType]         = useState<PVType>("AUDITION");
  const [subject,        setSubject]        = useState("");
  const [content,        setContent]        = useState("");
  const [involvedPerson, setInvolvedPerson] = useState("");
  const [loading,        setLoading]        = useState(false);
  const [fetchingData,   setFetchingData]   = useState(!!complaintId);
  const [attachments,    setAttachments]    = useState<Attachment[]>([]);
  const [complaint,      setComplaint]      = useState<any>(null);
  // ✅ Garde en mémoire si l'OPJ a déjà modifié le contenu manuellement
  const userEditedContent = useRef(false);

  const colors = useMemo(() => ({
    bgMain:         isDark ? "#0F172A" : "#F8FAFC",
    bgCard:         isDark ? "#1E293B" : "#FFFFFF",
    textMain:       isDark ? "#FFFFFF" : "#1E293B",
    textSub:        isDark ? "#94A3B8" : "#64748B",
    border:         isDark ? "#334155" : "#E2E8F0",
    inputBg:        isDark ? "#0F172A" : "#F8FAFC",
    chipUnselected: isDark ? "#1E293B" : "#F1F5F9",
  }), [isDark]);

  // ── 1. Chargement plainte ─────────────────────────────────────
  useEffect(() => {
    if (!complaintId) return;
    const load = async () => {
      try {
        const res  = await getComplaintById(Number(complaintId));
        const data = (res as any)?.data || res;
        setComplaint(data);
        setSubject(data.title || "");

        const nom = data?.complainant
          ? `${(data.complainant.lastname || "").toUpperCase()} ${data.complainant.firstname || ""}`.trim()
          : data?.citizen
          ? `${(data.citizen.lastname || "").toUpperCase()} ${data.citizen.firstname || ""}`.trim()
          : "";
        setInvolvedPerson(nom);

        // Si l'OPJ avait déjà rédigé une synthèse, on la charge
        if (data.pvDetails) {
          setContent(data.pvDetails);
          userEditedContent.current = true;
        }
      } catch (e) {
        console.error("Erreur chargement plainte:", e);
      } finally {
        setFetchingData(false);
      }
    };
    load();
  }, [complaintId]);

  // ── 2. Template par type — ✅ ne remplace pas si l'OPJ a déjà tapé ──
  useEffect(() => {
    if (userEditedContent.current) return; // Ne pas écraser les saisies

    const ref    = complaint?.trackingCode || `#${complaintId}` || "N/A";
    const date   = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const header = `L'an deux mille vingt-six et le ${date},\nDevant nous, Officier de Police Judiciaire en poste à Niamey...\n\n`;
    const base   = `OBJET : DOSSIER N°${ref}\n${"─".repeat(30)}\n`;

    const templates: Record<PVType, string> = {
      AUDITION:       `${base}${header}Comparaît par devant nous la personne suivante :\n\nNOM : ${involvedPerson || "..."}\n\nQUESTION : \nRÉPONSE : `,
      CONSTAT:        `${base}${header}Étant informés de faits portés à notre connaissance, nous nous sommes transportés sur les lieux où nous avons constaté que...`,
      INTERPELLATION: `${base}${header}Agissant en vertu de nos attributions (Art. 17 CPP), nous avons procédé à l'interpellation de la personne suivante :\n\nNOM : ${involvedPerson || "..."}`,
      PERQUISITION:   `${base}${header}En présence de témoins, conformément aux articles 51-52 CPP, nous avons procédé à la perquisition du domicile de :\n\nNOM : ${involvedPerson || "..."}\n\nOBJETS SAISIS : `,
    };
    setContent(templates[pvType]);
  }, [pvType, complaint]);

  // ── 3. Génération PDF — ✅ compatible web et mobile ───────────
  const generatePDF = async (): Promise<void> => {
    const date      = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const dateShort = new Date().toLocaleDateString("fr-FR");
    const dateTime  = new Date().toLocaleString("fr-FR");
    const ref       = complaint?.trackingCode || `#${complaintId}` || "N/A";
    const pvNumber  = `A-${new Date().getFullYear()}-${String(complaintId || "000").padStart(4, "0")}`;
    const opjName   = user ? `${(user.lastname || "").toUpperCase()} ${user.firstname || ""}`.trim() : "L'O.P.J.";

    const scellesRows = attachments.length > 0
      ? attachments.map((a, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${a.type === "image" ? "Photographie" : a.type === "video" ? "Enregistrement vidéo" : "Enregistrement audio"}</td>
            <td>${a.name}</td>
            <td>${dateShort}</td>
          </tr>`).join("")
      : `<tr><td colspan="4" class="center">Aucun scellé constitué</td></tr>`;

    const verifyToken = complaint?.verification_token || complaint?.trackingCode || complaintId;
    const verifyUrl = `${ENV.API_URL}/public/verify/${verifyToken}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

    const sectionTitle: Record<PVType, string> = {
      AUDITION:       "Audition et Dépositions",
      CONSTAT:        "État des Lieux et Constatations",
      INTERPELLATION: "Circonstances de l'Interpellation",
      PERQUISITION:   "Opérations de Perquisition",
    };

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: "Times New Roman", serif; margin: 40px 60px; font-size: 12pt; line-height: 1.9; color: #000; }
    .header-grid { display: table; width: 100%; margin-bottom: 10px; }
    .header-left  { display: table-cell; width: 50%; vertical-align: top; font-size: 11pt; }
    .header-right { display: table-cell; width: 50%; vertical-align: top; text-align: right; font-size: 11pt; }
    .pv-title    { text-align: center; margin: 18px 0 8px; }
    .pv-title h1 { font-size: 14pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px double #000; display: inline-block; padding-bottom: 6px; }
    .pv-title p  { font-size: 10pt; font-style: italic; margin: 3px; }
    .analyse     { border-left: 4px solid #000; padding-left: 12px; margin: 14px 0; font-size: 11pt; }
    .preambule   { border: 1px solid #000; padding: 12px 16px; margin: 16px 0; font-size: 11pt; }
    h2 { font-size: 12pt; text-transform: uppercase; font-weight: bold; margin-top: 20px; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 3px; }
    .corps    { text-align: justify; font-size: 12pt; }
    .corps p  { margin: 7px 0; }
    .deposition { border: 1px dashed #555; padding: 10px 14px; margin: 10px 0; font-size: 11pt; background: #fafafa; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11pt; }
    th  { background: #000; color: #fff; padding: 6px 10px; text-align: left; }
    td  { border: 1px solid #000; padding: 5px 10px; }
    td.center { text-align: center; font-style: italic; }
    .cloture       { border: 2px solid #000; padding: 14px; margin-top: 20px; font-size: 11pt; }
    .cloture-title { text-align: center; font-weight: bold; text-transform: uppercase; font-size: 12pt; margin-bottom: 10px; }
    .footer { margin-top: 40px; font-size: 9pt; color: #444; border-top: 1px solid #999; padding-top: 6px; text-align: center; }
  </style>
</head>
<body>
  <div class="header-grid">
    <div class="header-left">
      <strong>REPUBLIQUE DU NIGER</strong><br/>
      Fraternité — Travail — Progrès<br/>
      ───────────────────────<br/>
      Ministère de l'Intérieur<br/>
      Direction Générale de la Police Nationale<br/>
      <strong>Commissariat Central de Niamey</strong>
    </div>
    <div class="header-right">
      N° PV : <strong>${pvNumber}</strong><br/>
      Du : ${dateShort}<br/><br/>
      Vu les articles 17 à 20 et 75<br/>
      du Code de Procédure Pénale du Niger
    </div>
  </div>

  <div class="pv-title">
    <h1>Procès-Verbal de ${pvType}</h1>
    <p>Enquête Préliminaire — Art. 17, 69 et suivants du CPP Niger</p>
  </div>

  <div class="analyse">
    <strong>ANALYSE :</strong><br/>
    Dossier Réf. : <strong>${ref}</strong> &nbsp;|&nbsp;
    Objet : <strong>${subject || "Infraction non qualifiée"}</strong><br/>
    Personne concernée : <strong>${involvedPerson || "Non renseignée"}</strong><br/>
    O.P.J. rédacteur : <strong>${opjName}</strong>
  </div>

  <div class="preambule">
    Nous soussigné(e)s, <strong>${opjName}</strong>, Officier de Police Judiciaire en poste au
    Commissariat Central de Niamey,<br/><br/>
    Ce jour, <strong>${date}</strong>,<br/>
    Agissant conformément aux ordres de nos chefs et en application
    des articles 17 à 20 du Code de Procédure Pénale du Niger,<br/>
    rapportons les opérations suivantes :
  </div>

  <h2>I — Préambule et Saisine</h2>
  <div class="corps">
    <p>
      Nous avons été saisi(e)s d'une plainte enregistrée sous la référence
      <strong>${ref}</strong>. Nous nous sommes immédiatement mis(e)s en mesure
      d'ouvrir une enquête préliminaire conformément aux articles 69 et suivants du CPP Niger.
    </p>
  </div>

  <h2>II — ${sectionTitle[pvType]}</h2>
  <div class="corps">
    <div class="deposition">${content.replace(/\n/g, "<br/>")}</div>
  </div>

  <h2>III — Inventaire des Scellés</h2>
  <table>
    <thead>
      <tr><th>Scellé N°</th><th>Nature</th><th>Désignation</th><th>Date de versement</th></tr>
    </thead>
    <tbody>${scellesRows}</tbody>
  </table>

  <div class="cloture">
    <div class="cloture-title">IV — Clôture du Procès-Verbal</div>
    <p>
      Le présent procès-verbal sera transmis, avec les scellés, au Commissaire
      de Police pour visa hiérarchique et transmission au Parquet (Art. 19 CPP).
    </p>
  </div>

  <div style="margin-top:50px;display:flex;justify-content:space-between;text-align:center;font-size:11pt;">
    <div style="width:45%;">
      L'Officier de Police Judiciaire<br/>
      <strong>${opjName}</strong><br/><br/><br/>
      <div style="border-top:1px solid #000;padding-top:5px;">Signature, grade et cachet</div>
    </div>
  </div>

  <div style="margin-top:25px;text-align:center;font-size:11pt;">
    Fait et clos à Niamey, le ${date}
  </div>

  <div style="margin-top:30px;text-align:center;border-top:1px solid #ccc;padding-top:15px;">
    <img src="${qrUrl}" width="100" height="100" style="border:1px solid #eee;padding:4px;" />
    <div style="font-size:8pt;color:#666;margin-top:8px;">
      <strong>VÉRIFICATION D'AUTHENTICITÉ</strong><br/>
      Scannez ce QR Code pour vérifier l'authenticité de cet acte officiel.<br/>
      Système National E-JUSTICE — République du Niger
    </div>
  </div>

  <div class="footer">
    PV N° ${pvNumber} — Système e-Justice Niger — Réf. dossier : ${ref}<br/>
    Établi conformément aux Arts. 17, 19, 69-75 du CPP Niger (Éd. 2018) — Généré le ${dateTime}
  </div>
</body>
</html>`;

    try {
      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          setTimeout(() => win.print(), 500);
        } else {
          const blob = new Blob([html], { type: "text/html" });
          window.open(URL.createObjectURL(blob), "_blank");
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch {
      alertMsg("Erreur PDF", "Impossible de générer le PDF.");
    }
  };

  // ── 4. Pièces jointes ─────────────────────────────────────────
  const pickMedia = async (type: "image" | "video" | "audio") => {
    try {
      let result: any;
      if (type === "image") {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          type: type === "audio" ? "audio/*" : "video/*"
        });
      }
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setAttachments(prev => [...prev, {
          uri:  asset.uri,
          type,
          name: (asset as any).name || `pj_${type}_${Date.now()}`,
        }]);
      }
    } catch {
      alertMsg("Erreur", "Impossible d'accéder aux fichiers.");
    }
  };

  // ── 5. ✅ Sauvegarder pvDetails + transitionner ───────────────
  const handleSubmit = async () => {
    if (!subject.trim() || content.length < 30) {
      alertMsg("Champs requis", "Veuillez saisir un objet et un récit minimal.");
      return;
    }
    setLoading(true);
    try {
      // ✅ CORRECTION PRINCIPALE : sauvegarder pvDetails avant tout
      if (complaintId) {
        await updateComplaint(Number(complaintId), { pvDetails: content } as any);
      }

      // Générer et afficher le PDF
      await generatePDF();

      // Transitionner vers attente_validation (transmission au Commissaire)
      if (complaintId) {
        await transitionComplaint(Number(complaintId), "attente_validation");
      }

      alertMsg("Acte Scellé ⚖️", "PV certifié et synthèse sauvegardée. Dossier transmis au Commissaire pour visa (Art. 19 CPP).");
      navigation.goBack();
    } catch (e: any) {
      alertMsg("Erreur", e?.response?.data?.message || "Échec de la transmission.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sauvegarder le brouillon (sans transitionner) ─────────────
  const handleSaveDraft = async () => {
    if (!complaintId || !content.trim()) return;
    try {
      await updateComplaint(Number(complaintId), { pvDetails: content } as any);
      alertMsg("Brouillon sauvegardé", "La synthèse a été enregistrée. Vous pouvez continuer plus tard.");
    } catch {
      alertMsg("Erreur", "Impossible de sauvegarder le brouillon.");
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Procès-Verbal Numérique" showBack />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

            {/* CARTE DOSSIER SOURCE */}
            {complaintId && !fetchingData && complaint && (
              <View style={[styles.infoCard, { backgroundColor: primaryColor + "15", borderLeftColor: primaryColor }]}>
                <View style={styles.infoRow}>
                  <Ionicons name="folder-open" size={24} color={primaryColor} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.infoLabel, { color: primaryColor }]}>DOSSIER SOURCE</Text>
                    <Text style={[styles.infoValue, { color: colors.textMain }]}>{subject}</Text>
                    <Text style={[styles.metaText, { color: colors.textSub }]}>
                      Plaignant : <Text style={{ fontWeight: "bold" }}>{involvedPerson || "Non renseigné"}</Text>
                    </Text>
                    <Text style={[styles.metaText, { color: colors.textSub }]}>
                      Réf. : {complaint?.trackingCode || `#${complaint.id}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {fetchingData && <ActivityIndicator color={primaryColor} style={{ marginBottom: 20 }} />}

            {/* TYPE DE PV */}
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>NATURE DE L'ACTE (CPP Niger)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {(["AUDITION", "CONSTAT", "INTERPELLATION", "PERQUISITION"] as PVType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => { userEditedContent.current = false; setPvType(type); }}
                  style={[styles.typeChip, {
                    backgroundColor: pvType === type ? primaryColor : colors.chipUnselected,
                    borderColor:     pvType === type ? primaryColor : colors.border,
                  }]}
                >
                  <Text style={[styles.typeText, { color: pvType === type ? "#FFF" : colors.textSub }]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* FORMULAIRE */}
            <View style={[styles.formCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.headerForm, { backgroundColor: primaryColor + "10", borderBottomColor: colors.border }]}>
                <Ionicons name="create-outline" size={20} color={primaryColor} />
                <Text style={[styles.headerTitle, { color: primaryColor }]}>RÉDACTION : PV DE {pvType}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>OBJET / INFRACTION *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
                  value={subject} onChangeText={setSubject}
                  placeholder="Saisir l'objet de l'enquête..."
                  placeholderTextColor={colors.textSub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>IDENTITÉ DU PLAIGNANT / CONCERNÉ</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
                  value={involvedPerson} onChangeText={setInvolvedPerson}
                  placeholder="Nom complet..."
                  placeholderTextColor={colors.textSub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>SYNTHÈSE & RÉCIT DES FAITS *</Text>
                <TextInput
                  style={[styles.textArea, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
                  multiline numberOfLines={12} textAlignVertical="top"
                  value={content}
                  onChangeText={(t) => { userEditedContent.current = true; setContent(t); }}
                  placeholderTextColor={colors.textSub}
                />
                <Text style={[styles.charCount, { color: colors.textSub }]}>{content.length} caractères</Text>
              </View>

              {/* PIÈCES JOINTES */}
              <View style={[styles.attachmentSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.textSub }]}>SCELLÉS ET PIÈCES JOINTES ({attachments.length})</Text>
                <View style={styles.attachmentButtons}>
                  {(["image", "video", "audio"] as const).map((t) => (
                    <TouchableOpacity key={t} onPress={() => pickMedia(t)} style={[styles.mediaBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Ionicons
                        name={t === "image" ? "camera" : t === "video" ? "videocam" : "mic"}
                        size={18}
                        color={t === "image" ? primaryColor : t === "video" ? "#E11D48" : "#0EA5E9"}
                      />
                      <Text style={[styles.mediaBtnText, { color: colors.textSub }]}>
                        {t === "image" ? "Photo" : t === "video" ? "Vidéo" : "Audio"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {attachments.map((item, index) => (
                  <View key={index} style={[styles.attachmentItem, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name={item.type === "image" ? "image" : item.type === "video" ? "film" : "musical-note"} size={18} color={colors.textSub} />
                    <Text style={[styles.attachmentName, { color: colors.textMain }]} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity onPress={() => setAttachments(prev => prev.filter((_, i) => i !== index))}>
                      <Ionicons name="trash-outline" size={18} color="#F43F5E" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* ACTIONS */}
            <View style={styles.actions}>
              {/* Brouillon */}
              <TouchableOpacity
                style={[styles.draftBtn, { borderColor: colors.border, backgroundColor: colors.bgCard }]}
                onPress={handleSaveDraft} disabled={loading}
              >
                <Ionicons name="save-outline" size={18} color={colors.textSub} />
                <Text style={[styles.draftText, { color: colors.textSub }]}>SAUVEGARDER BROUILLON</Text>
              </TouchableOpacity>

              {/* Aperçu PDF */}
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: primaryColor }]}
                onPress={generatePDF} disabled={loading}
              >
                <Ionicons name="document-text-outline" size={20} color={primaryColor} />
                <Text style={[styles.secondaryBtnText, { color: primaryColor }]}>APERÇU PDF</Text>
              </TouchableOpacity>

              {/* Signer et transmettre */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSubmit} disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="send" size={20} color="#FFF" />
                    <Text style={styles.submitText}>SIGNER ET TRANSMETTRE AU COMMISSAIRE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container:         { padding: 20 },
  infoCard:          { padding: 16, borderRadius: 16, marginBottom: 20, borderLeftWidth: 5, borderWidth: 1 },
  infoRow:           { flexDirection: "row", alignItems: "center" },
  infoLabel:         { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 4 },
  infoValue:         { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  metaText:          { fontSize: 12, marginTop: 2 },
  sectionTitle:      { fontSize: 10, fontWeight: "900", marginBottom: 12, letterSpacing: 1 },
  typeScroll:        { marginBottom: 15 },
  typeChip:          { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, marginRight: 10 },
  typeText:          { fontSize: 10, fontWeight: "800" },
  formCard:          { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  headerForm:        { flexDirection: "row", alignItems: "center", gap: 10, padding: 15, borderBottomWidth: 1 },
  headerTitle:       { fontSize: 11, fontWeight: "900" },
  inputGroup:        { padding: 15 },
  label:             { fontSize: 9, fontWeight: "900", marginBottom: 8 },
  input:             { borderWidth: 1, borderRadius: 10, padding: 12, fontWeight: "600" },
  textArea:          { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 220 },
  charCount:         { fontSize: 10, fontWeight: "600", textAlign: "right", marginTop: 4 },
  attachmentSection: { padding: 15, borderTopWidth: 1 },
  attachmentButtons: { flexDirection: "row", gap: 8, marginBottom: 12 },
  mediaBtn:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, padding: 10, borderRadius: 8, borderWidth: 1 },
  mediaBtnText:      { fontSize: 11, fontWeight: "700" },
  attachmentItem:    { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 8, marginBottom: 5, gap: 10 },
  attachmentName:    { flex: 1, fontSize: 12 },
  actions:           { gap: 12 },
  draftBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1 },
  draftText:         { fontWeight: "700", fontSize: 12 },
  secondaryBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54, borderRadius: 15, borderWidth: 2 },
  secondaryBtnText:  { fontWeight: "900", fontSize: 13 },
  submitBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 60, borderRadius: 15 },
  submitText:        { color: "#FFF", fontWeight: "900", fontSize: 13 },
});