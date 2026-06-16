// PATH: src/screens/commissaire/CommissaireReviewScreen.tsx
import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Platform, StatusBar, Linking
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { useAuthStore } from "../../stores/useAuthStore";
import { PoliceScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { getComplaintById, transitionComplaint } from "../../services/complaint.service";
import { ENV } from "../../config/env";

// ── Helpers cross-platform ────────────────────────────────────
const alertMsg = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: "Réviser", style: "cancel" },
      { text: "Confirmer", onPress: onConfirm },
    ]);
  }
};

export default function CommissaireReviewScreen({ navigation, route }: PoliceScreenProps<"CommissaireReview">) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const params = route.params as any;
  const complaintId = params?.id || params?.complaintId;
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const colors = {
    bgMain:   isDark ? "#0F172A" : "#F8FAFC",
    bgCard:   isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    pvBg:     isDark ? "#111827" : "#F0F7FF",
    opjBg:    isDark ? "#1E293B" : "#F8FAFC",
  };

  const { data: complaint, isLoading, isError } = useQuery({
    queryKey: ["complaint", complaintId],
    queryFn: () => getComplaintById(complaintId),
    enabled: !!complaintId,
    retry: 1,
  });

  // ── Helpers extraction données ────────────────────────────────

  const getPlaignantName = () => {
    const c = complaint as any;
    if (c?.complainant) return `${(c.complainant.lastname || "").toUpperCase()} ${c.complainant.firstname || ""}`.trim();
    if (c?.citizen)     return `${(c.citizen.lastname || "").toUpperCase()} ${c.citizen.firstname || ""}`.trim();
    return "Non renseigné";
  };

  // ✅ Nom de l'OPJ — cherche dans assignedOPJ (relation incluse par le backend)
  const getOPJName = () => {
    const c = complaint as any;
    if (c?.assignedOPJ) {
      return `${(c.assignedOPJ.lastname || "").toUpperCase()} ${c.assignedOPJ.firstname || ""}`.trim();
    }
    // Fallback si le backend retourne un champ plat
    if (c?.opjName) return c.opjName;
    return "OPJ non identifié";
  };

  const getOPJMatricule = () => {
    const c = complaint as any;
    return c?.assignedOPJ?.matricule || c?.assignedOPJ?.registrationNumber || null;
  };

  // ✅ pvDetails — cherche dans plusieurs champs possibles selon le backend
  const getPvDetails = () => {
    const c = complaint as any;
    return c?.pvDetails || c?.pv_details || c?.syntheseOPJ || c?.synthesis || null;
  };

  // ── Génération PV (Art. 19 CPP Niger) ────────────────────────
  const generateTransmissionPV = async (): Promise<void> => {
    if (!complaint) return;
    setGeneratingPDF(true);

    const date = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const commissaireName = user
      ? `${(user.lastname || "").toUpperCase()} ${user.firstname || ""}`
      : "Le Commissaire";
    const opjName = getOPJName();
    const opjMatricule = getOPJMatricule();
    const plaignant = getPlaignantName();
    const pvDetails = getPvDetails();
    const ref = (complaint as any).trackingCode || `#${complaintId}`;
    const pvNumber = `A-${new Date().getFullYear()}-${String(complaintId).padStart(4, "0")}`;
    const dateTime = new Date().toLocaleString("fr-FR");

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: "Times New Roman", serif; margin: 40px 60px; font-size: 12pt; line-height: 1.9; color: #000; }
    .header-grid { display: table; width: 100%; margin-bottom: 10px; }
    .header-left { display: table-cell; width: 45%; vertical-align: top; font-size: 11pt; }
    .header-right { display: table-cell; width: 55%; vertical-align: top; text-align: right; font-size: 11pt; }
    .pv-title { text-align: center; margin: 20px 0 5px; }
    .pv-title h1 { font-size: 14pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 3px double #000; display: inline-block; padding-bottom: 6px; }
    .pv-title p { font-size: 10pt; font-style: italic; margin: 4px; }
    .preambule { border: 1px solid #000; padding: 12px 16px; margin: 20px 0; font-size: 11pt; }
    h2 { font-size: 12pt; text-transform: uppercase; font-weight: bold; margin-top: 22px; margin-bottom: 6px; border-bottom: 1px solid #000; padding-bottom: 3px; }
    .corps { text-align: justify; font-size: 12pt; }
    .corps p { margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11pt; }
    th { background: #000; color: #fff; padding: 6px 10px; text-align: left; }
    td { border: 1px solid #000; padding: 5px 10px; }
    .analyse { border-left: 4px solid #000; padding-left: 12px; margin: 15px 0; font-size: 11pt; }
    .cloture { border: 2px solid #000; padding: 14px; margin-top: 20px; font-size: 11pt; }
    .cloture-title { text-align: center; font-weight: bold; text-transform: uppercase; font-size: 12pt; margin-bottom: 10px; }
    .footer { margin-top: 40px; font-size: 9pt; color: #444; border-top: 1px solid #999; padding-top: 6px; text-align: center; }
    .expeditions { font-size: 11pt; margin-top: 20px; font-style: italic; }
  </style>
</head>
<body>
  <div class="header-grid">
    <div class="header-left">
      <strong>REPUBLIQUE DU NIGER</strong><br/>
      Fraternité — Travail — Progrès<br/>
      ──────────────────────<br/>
      Ministère de l'Intérieur<br/>
      Direction Générale de la Police Nationale<br/>
      <strong>Commissariat Central de Niamey</strong>
    </div>
    <div class="header-right">
      N° PV : <strong>${pvNumber}</strong><br/>
      Du : ${date}<br/><br/>
      Vu les articles 17 à 20 et 75<br/>
      du Code de Procédure Pénale du Niger
    </div>
  </div>

  <div class="pv-title">
    <h1>Procès-Verbal d'Enquête Préliminaire</h1>
    <p>et de Transmission au Parquet — Conformément à l'Art. 19 CPP Niger</p>
  </div>

  <div class="analyse">
    <strong>ANALYSE :</strong><br/>
    Dossier Réf. : <strong>${ref}</strong><br/>
    Objet : <strong>${(complaint as any).title || "Infraction non qualifiée"}</strong><br/>
    Plaignant(e) : <strong>${plaignant}</strong><br/>
    OPJ enquêteur : <strong>${opjName}</strong>${opjMatricule ? ` — Matr. ${opjMatricule}` : ""}
  </div>

  <div class="preambule">
    Nous soussigné(e)s :<br/><br/>
    <strong>${opjName}</strong>, Officier de Police Judiciaire${opjMatricule ? `, Matricule ${opjMatricule}` : ""},<br/>
    en poste au Commissariat Central de Niamey ;<br/><br/>
    Ce jour, <strong>${dateTime}</strong>, agissant conformément aux ordres de nos chefs
    et en application des articles 17 à 20 du Code de Procédure Pénale du Niger,
    rapportons les opérations suivantes :
  </div>

  <h2>I — Préambule et Saisine</h2>
  <div class="corps">
    <p>
      La brigade / le commissariat a été saisi(e) d'une plainte déposée par
      <strong>${plaignant}</strong>, enregistrée sous la référence
      <strong>${ref}</strong> et déposée le
      <strong>${new Date((complaint as any).filedAt || (complaint as any).createdAt || Date.now()).toLocaleDateString("fr-FR")}</strong>.
    </p>
    <p>
      L'Officier de Police Judiciaire (O.P.J.) <strong>${opjName}</strong> s'est immédiatement saisi de
      l'affaire et a procédé aux opérations d'enquête préliminaire conformément aux
      dispositions de l'article 69 et suivants du Code de Procédure Pénale.
    </p>
  </div>

  <h2>II — Exposé des Faits Déclarés</h2>
  <div class="corps">
    <p>${(complaint as any).description?.replace(/\n/g, "<br/>") || "Aucune déclaration enregistrée."}</p>
  </div>

  <h2>III — Constatations et Diligences de l'O.P.J.</h2>
  <div class="corps">
    <p>
      ${pvDetails?.replace(/\n/g, "<br/>") ||
        `Procédant à l'enquête, l'Officier de Police Judiciaire <strong>${opjName}</strong> a entendu le(la) plaignant(e)
        et les personnes susceptibles de fournir des renseignements sur les faits dénoncés.
        Les auditions ont été recueillies et consignées dans le présent procès-verbal.`
      }
    </p>
    ${(complaint as any).location ? `<p><strong>Lieu des faits :</strong> ${(complaint as any).location}</p>` : ""}
  </div>

  <h2>IV — Inventaire des Scellés et Pièces à Conviction</h2>
  <table>
    <thead>
      <tr><th>Scellé N°</th><th>Désignation</th><th>Date</th><th>Accès</th></tr>
    </thead>
    <tbody>
      ${(complaint as any).attachments?.length > 0
        ? (complaint as any).attachments.map((f: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td>${f.filename || "Pièce jointe"}</td>
            <td>${f.createdAt ? new Date(f.createdAt).toLocaleDateString("fr-FR") : date}</td>
            <td><a href="${ENV.API_URL.replace("/api", "")}/${(f.fileUrl || f.file_url || "").replace(/^\//, "")}">Consulter</a></td>
          </tr>`).join("")
        : `<tr><td colspan="4" style="text-align:center;font-style:italic;">Aucune pièce à conviction répertoriée</td></tr>`
      }
    </tbody>
  </table>

  <div class="cloture">
    <div class="cloture-title">V — Clôture et Visa Hiérarchique</div>
    <p>
      Après examen des pièces du dossier et vérification de la régularité de la procédure,
      nous, <strong>${commissaireName}</strong>, Commissaire de Police, certifions que
      l'enquête préliminaire menée par l'OPJ <strong>${opjName}</strong> a été conduite
      conformément aux dispositions des articles 17 à 20 et 69 à 75 du Code de Procédure Pénale du Niger.
    </p>
    <p>
      En conséquence, nous ordonnons la <strong>transmission du présent dossier au
      Procureur de la République</strong> près le Tribunal de Grande Instance de Niamey (Art. 39 CPP).
    </p>
    <p style="text-align:center;font-weight:bold;font-size:13pt;margin-top:14px;letter-spacing:1px;">
      [ VISA HIÉRARCHIQUE APPOSÉ — DOSSIER CERTIFIÉ RÉGULIER ]
    </p>
  </div>

  <div class="expeditions">
    <strong>DEUX EXPÉDITIONS :</strong><br/>
    — La 1ère (avec copies) : à M. le Procureur de la République près le T.G.I. de Niamey.<br/>
    — La 2ème : aux archives du Commissariat Central.
  </div>

  <div style="margin-top:50px;display:flex;justify-content:space-between;text-align:center;font-size:11pt;">
    <div style="width:45%;">
      L'Officier de Police Judiciaire<br/>
      <strong>${opjName}</strong>${opjMatricule ? `<br/><em>Matr. ${opjMatricule}</em>` : ""}<br/><br/><br/>
      <div style="border-top:1px solid #000;padding-top:5px;">Signature et cachet</div>
    </div>
    <div style="width:45%;">
      Le Commissaire de Police<br/>
      <strong>${commissaireName}</strong><br/><br/><br/>
      <div style="border-top:1px solid #000;padding-top:5px;">Signature et cachet</div>
    </div>
  </div>

  <div style="margin-top:30px;text-align:center;font-size:11pt;">
    Fait et clos à Niamey, le ${date}
  </div>

  <div class="footer">
    PV N° ${pvNumber} — Système e-Justice Niger — Réf. dossier : ${ref}<br/>
    Établi conformément aux Arts. 17, 19, 39, 69-75 du Code de Procédure Pénale du Niger (Éd. 2018)<br/>
    Généré le ${dateTime}
  </div>
</body>
</html>`;

    try {
      if (Platform.OS === 'web') {
        // ✅ Web : ouvrir dans un nouvel onglet et imprimer
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
          newWindow.focus();
          setTimeout(() => newWindow.print(), 500);
        } else {
          // Fallback si popup bloqué : blob URL
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        }
      } else {
        // ✅ Mobile : expo-print natif
        await Print.printAsync({ html });
      }
    } catch {
      alertMsg("Erreur PDF", "Impossible de générer le procès-verbal.");
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ── Mutations ─────────────────────────────────────────────────
  const signMutation = useMutation({
    mutationFn: () => transitionComplaint(complaintId, "transmise_parquet"),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      await generateTransmissionPV();
      alertMsg("✅ Visa Apposé", "Dossier transmis au Procureur de la République (Art. 39 CPP).");
      navigation.goBack();
    },
    onError: (err: any) => {
      alertMsg("Erreur", err?.response?.data?.message || "Impossible d'apposer le visa.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => transitionComplaint(complaintId, "en_cours_OPJ"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      alertMsg("Renvoi effectué", "Dossier retourné à l'OPJ pour complément d'enquête.");
      navigation.goBack();
    },
    onError: (err: any) => {
      alertMsg("Erreur", err?.response?.data?.message || "Impossible de renvoyer le dossier.");
    },
  });

  const handleSign = () => {
    confirmAction(
      "Apposer le Visa Hiérarchique",
      "Certifier la régularité de cette enquête et transmettre au Parquet (Art. 19 CPP) ?",
      () => signMutation.mutate()
    );
  };

  const handleReject = () => {
    confirmAction(
      "Renvoyer pour complément",
      "Retourner le dossier à l'OPJ pour actes supplémentaires ?",
      () => rejectMutation.mutate()
    );
  };

  // ── États chargement ──────────────────────────────────────────
  if (isLoading) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Examen de procédure" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loaderText, { color: colors.textSub }]}>Récupération des pièces...</Text>
      </View>
    </ScreenContainer>
  );

  if (isError || !complaint) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Erreur" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
        <Text style={{ marginTop: 10, color: colors.textMain, fontWeight: "bold" }}>Dossier introuvable</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: primaryColor, fontWeight: "bold" }}>Retour au bureau</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );

  const isPending = signMutation.isPending || rejectMutation.isPending || generatingPDF;
  const pvDetails = getPvDetails();
  const opjName = getOPJName();
  const opjMatricule = getOPJMatricule();

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Révision Dossier #${(complaint as any).trackingCode || complaintId}`} showBack />

      <ScrollView
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* BANDEAU */}
        <View style={[styles.infoCard, { backgroundColor: primaryColor }]}>
          <View style={styles.headerIconRow}>
            <Ionicons name="shield-checkmark" size={22} color="#FFF" />
            <Text style={styles.whiteLabel}>VISA DU COMMISSAIRE — ART. 19 CPP NIGER</Text>
          </View>
          <Text style={styles.whiteOffenceTitle}>
            {(complaint as any).title || "Information Judiciaire"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 6 }}>
            Plaignant : {getPlaignantName()}
          </Text>
        </View>

        {/* ✅ CARTE OPJ */}
        <View style={[styles.opjCard, { backgroundColor: colors.opjBg, borderColor: colors.border }]}>
          <View style={[styles.opjIconBox, { backgroundColor: primaryColor + "20" }]}>
            <Ionicons name="shield-outline" size={22} color={primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.opjLabel, { color: colors.textSub }]}>OFFICIER DE POLICE JUDICIAIRE ENQUÊTEUR</Text>
            <Text style={[styles.opjName, { color: colors.textMain }]}>{opjName}</Text>
            {opjMatricule && (
              <Text style={[styles.opjMatricule, { color: colors.textSub }]}>Matr. {opjMatricule}</Text>
            )}
          </View>
        </View>

        {/* DÉCLARATION PLAIGNANT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={18} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Déclaration du Plaignant</Text>
          </View>
          <View style={[styles.textContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.description, { color: colors.textMain }]}>
              {(complaint as any).description || "Aucune déclaration enregistrée."}
            </Text>
          </View>
        </View>

        {/* ✅ SYNTHÈSE OPJ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Synthèse de l'Enquête (OPJ)</Text>
          </View>
          {pvDetails ? (
            <View style={[styles.textContainer, {
              backgroundColor: colors.pvBg,
              borderLeftColor: primaryColor,
              borderLeftWidth: 5,
              borderColor: colors.border,
            }]}>
              <Text style={[styles.pvText, { color: colors.textMain }]}>{pvDetails}</Text>
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
              <Text style={[styles.noData, { color: colors.textSub }]}>
                Synthèse non encore rédigée par l'OPJ.{"\n"}Le dossier peut être renvoyé pour complément.
              </Text>
            </View>
          )}
        </View>

        {/* SCELLÉS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 15, fontSize: 12, color: colors.textSub }]}>
            REGISTRE DES SCELLÉS ({(complaint as any).attachments?.length || 0})
          </Text>
          {(complaint as any).attachments?.length > 0 ? (
            <View style={styles.attachmentGrid}>
              {(complaint as any).attachments.map((file: any) => {
                const url = file.fileUrl || file.file_url;
                const fullUrl = url
                  ? `${ENV.API_URL.replace("/api", "")}/${url.replace(/^\//, "")}`
                  : null;
                return (
                  <TouchableOpacity
                    key={file.id}
                    style={[styles.attachmentBadge, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                    onPress={() => fullUrl && (Platform.OS === "web" ? window.open(fullUrl, "_blank") : Linking.openURL(fullUrl))}
                  >
                    <Ionicons name="cube-outline" size={16} color={primaryColor} />
                    <Text style={[styles.fileName, { color: colors.textMain }]} numberOfLines={1}>
                      {file.filename || `Scellé #${file.id}`}
                    </Text>
                    <Ionicons name="open-outline" size={14} color={colors.textSub} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.noData, { color: colors.textSub }]}>Aucune pièce à conviction.</Text>
            </View>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.btnOutline, { borderColor: primaryColor }]}
            onPress={generateTransmissionPV}
            disabled={isPending}
          >
            {generatingPDF ? (
              <ActivityIndicator color={primaryColor} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={22} color={primaryColor} />
                <Text style={[styles.btnOutlineText, { color: primaryColor }]}>APERÇU DU PV DE TRANSMISSION</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: "#10B981" }]}
            onPress={handleSign}
            disabled={isPending}
          >
            {signMutation.isPending || generatingPDF ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="ribbon-outline" size={26} color="#FFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.btnText}>APPOSER LE VISA ET TRANSMETTRE</Text>
                  <Text style={styles.btnSubText}>Génère le PV + transmet au Procureur (Art. 19)</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.btnSecondary, { borderColor: "#EF4444" }]}
            onPress={handleReject}
            disabled={isPending}
          >
            {rejectMutation.isPending ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={[styles.btnSecondaryText, { color: "#EF4444" }]}>
                Renvoyer pour complément d'enquête
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:            { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText:        { marginTop: 15, fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  scroll:            { padding: 16 },
  infoCard:          { padding: 24, borderRadius: 28, marginBottom: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10 }, android: { elevation: 6 }, web: { boxShadow: "0px 4px 20px rgba(0,0,0,0.15)" } }) },
  headerIconRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  whiteLabel:        { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  whiteOffenceTitle: { color: "#FFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },

  // ✅ Carte OPJ
  opjCard:      { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 25, gap: 15 },
  opjIconBox:   { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  opjLabel:     { fontSize: 9, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  opjName:      { fontSize: 17, fontWeight: "900", letterSpacing: -0.3 },
  opjMatricule: { fontSize: 12, fontWeight: "700", marginTop: 2 },

  section:           { marginBottom: 30 },
  sectionHeader:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 15 },
  sectionTitle:      { fontSize: 13, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  textContainer:     { padding: 20, borderRadius: 24, borderWidth: 1.5 },
  description:       { fontSize: 15, lineHeight: 24, fontWeight: "500" },
  pvText:            { fontSize: 15, lineHeight: 24, fontStyle: "italic", fontWeight: "600" },
  attachmentGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  attachmentBadge:   { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, gap: 8, width: "48%", borderWidth: 1.5 },
  fileName:          { fontSize: 12, fontWeight: "800", flex: 1 },
  emptyBox:          { padding: 20, borderRadius: 16, alignItems: "center", borderWidth: 1, borderStyle: "dashed", gap: 8 },
  noData:            { fontStyle: "italic", fontSize: 13, fontWeight: "600", textAlign: "center" },
  actions:           { gap: 14 },
  btnOutline:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 18, borderRadius: 20, borderWidth: 2 },
  btnOutlineText:    { fontWeight: "900", fontSize: 13, letterSpacing: 0.5 },
  btn:               { flexDirection: "row", alignItems: "center", padding: 22, borderRadius: 24, gap: 15, ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 4 }, web: { boxShadow: "0px 4px 15px rgba(0,0,0,0.15)" } }) },
  btnText:           { color: "#FFF", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  btnSubText:        { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "600", marginTop: 2 },
  btnSecondary:      { padding: 20, borderRadius: 24, borderWidth: 2, alignItems: "center" },
  btnSecondaryText:  { fontSize: 13, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
});