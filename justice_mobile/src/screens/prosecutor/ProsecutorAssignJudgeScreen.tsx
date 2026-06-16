// PATH: src/screens/prosecutor/ProsecutorAssignJudgeScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { ProsecutorScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

import { getComplaintById, updateComplaint } from "../../services/complaint.service";
import api from "../../services/api";

const alertMsg = (title: string, msg: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

export default function ProsecutorAssignJudgeScreen({ route, navigation }: ProsecutorScreenProps<'ProsecutorAssignJudge'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const rawCaseId = route.params?.caseId;
  const caseId = rawCaseId ? Number(rawCaseId) : null;
  const isValidId = caseId !== null && !isNaN(caseId);

  const [selectedJudge, setSelectedJudge] = useState<any>(null);

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    accent:   "#7C2D12",
  };

  // ✅ Récupération du dossier
  const { data: complaintRaw, isLoading: loadingCase, isError } = useQuery({
    queryKey: ["complaint", caseId],
    queryFn: () => getComplaintById(caseId!),
    enabled: isValidId,
    retry: 1,
  });
  const complaint = (complaintRaw as any)?.data || complaintRaw;

  // ✅ Récupération des vrais juges depuis l'API (role=judge)
  const { data: judgesRaw, isLoading: loadingJudges } = useQuery({
    queryKey: ["judges"],
    queryFn: async () => {
      const res = await api.get("/users?role=judge");
      return res.data?.data || res.data || [];
    },
    retry: 1,
  });
  const judges: any[] = Array.isArray(judgesRaw) ? judgesRaw : [];

  // ✅ Mutation saisine — stocke le nom du juge dans les notes du dossier
  // et met à jour le courtId si disponible
  const mutation = useMutation({
    mutationFn: async (judge: any) => {
      const payload: any = {
        // Stocke la désignation dans caseNumber si pas d'autre champ
        // Si tu ajoutes assignedJudgeId en DB, remplace par : assignedJudgeId: judge.id
        caseNumber: `RG-${caseId}/26 — Cabinet : ${judge.lastname?.toUpperCase()} ${judge.firstname}`,
      };
      if (judge.courtId) payload.courtId = judge.courtId;
      return updateComplaint(caseId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaint", caseId] });

      const msg = `Réquisitoire Introductif transmis au cabinet de M. le Juge ${selectedJudge?.lastname?.toUpperCase()}.`;
      alertMsg("✅ Saisine Enregistrée", msg);
      navigation.popToTop();
    },
    onError: (err: any) => {
      alertMsg("Échec de saisine", err?.response?.data?.message || "Erreur de liaison serveur.");
    },
  });

  const handleConfirm = () => {
    if (!selectedJudge) {
      alertMsg("Attention", "Veuillez désigner un Juge d'Instruction.");
      return;
    }

    const title = "Confirmation de Saisine";
    const msg = `Désigner M. le Juge ${selectedJudge.lastname?.toUpperCase()} ${selectedJudge.firstname} pour l'instruction de l'affaire n°${caseId} ?`;

    if (Platform.OS === "web") {
      if (window.confirm(`${title}\n\n${msg}`)) mutation.mutate(selectedJudge);
    } else {
      Alert.alert(title, msg, [
        { text: "Réviser", style: "cancel" },
        { text: "Confirmer la saisine", onPress: () => mutation.mutate(selectedJudge) },
      ]);
    }
  };

  // ── États ─────────────────────────────────────────────────────

  if (!isValidId) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Erreur" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
        <Text style={{ color: colors.textMain, marginTop: 10, fontWeight: "bold" }}>Aucun dossier spécifié.</Text>
      </View>
    </ScreenContainer>
  );

  if (loadingCase || loadingJudges) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Chargement..." showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 10, color: colors.textSub }}>Accès au dossier pénal...</Text>
      </View>
    </ScreenContainer>
  );

  if (isError || !complaint) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Introuvable" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <Ionicons name="file-tray-outline" size={60} color="#EF4444" />
        <Text style={[styles.mainLabel, { color: colors.textMain, marginTop: 20 }]}>Dossier Introuvable</Text>
        <Text style={{ color: colors.textSub, textAlign: "center", paddingHorizontal: 40, marginTop: 8 }}>
          Le dossier #{caseId} est introuvable sur le serveur.
        </Text>
        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: colors.border, marginTop: 20, width: 200 }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.btnText, { color: colors.textMain }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Désignation du Juge" showBack={true} />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>

          {/* RÉQUISITOIRE */}
          <View style={[styles.requisitoireBox, { backgroundColor: colors.bgCard, borderLeftColor: colors.accent, borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <Ionicons name="ribbon" size={20} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.accent }]}>RÉQUISITOIRE INTRODUCTIF</Text>
            </View>

            <Text style={[styles.prosecutorMention, { color: colors.textSub }]}>
              Par le Procureur :{" "}
              <Text style={styles.boldText}>
                M. {user?.lastname?.toUpperCase()} {user?.firstname}
              </Text>
            </Text>

            {/* ✅ title à la place de provisionalOffence */}
            <Text style={[styles.offenceTitle, { color: colors.textMain }]}>
              {complaint.title || "Information Judiciaire"}
            </Text>
            <Text style={[styles.descriptionText, { color: colors.textSub }]} numberOfLines={3}>
              {complaint.description}
            </Text>

            <View style={[styles.caseBadge, { backgroundColor: colors.accent + "15" }]}>
              <Text style={[styles.caseBadgeText, { color: colors.accent }]}>
                RG-#{caseId}/26
              </Text>
            </View>
          </View>

          <Text style={[styles.mainLabel, { color: colors.textMain }]}>Cabinet d'Instruction compétent</Text>
          <Text style={[styles.subLabel, { color: colors.textSub }]}>
            Sélectionnez le juge d'instruction pour ce dossier.
          </Text>

          {/* ✅ LISTE RÉELLE DES JUGES */}
          {judges.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={40} color={colors.textSub} />
              <Text style={[styles.subLabel, { color: colors.textSub, textAlign: "center", marginTop: 10 }]}>
                Aucun juge disponible dans le système.{"\n"}Vérifiez que des comptes avec le rôle «juge» existent.
              </Text>
            </View>
          ) : (
            <View style={styles.judgeList}>
              {judges.map((judge: any) => {
                const isSelected = selectedJudge?.id === judge.id;
                return (
                  <TouchableOpacity
                    key={judge.id}
                    activeOpacity={0.8}
                    style={[
                      styles.judgeCard,
                      { backgroundColor: colors.bgCard, borderColor: isSelected ? primaryColor : colors.border },
                      isSelected && { backgroundColor: primaryColor + "10" },
                    ]}
                    onPress={() => setSelectedJudge(judge)}
                  >
                    <View style={styles.judgeInfo}>
                      <View style={[styles.iconCircle, { backgroundColor: isSelected ? primaryColor : (isDark ? "#334155" : "#F1F5F9") }]}>
                        <Ionicons name="briefcase" size={20} color={isSelected ? "#FFF" : colors.textSub} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.judgeName, { color: colors.textMain }]}>
                          M. le Juge {(judge.lastname || "").toUpperCase()} {judge.firstname}
                        </Text>
                        <Text style={[styles.cabinetText, { color: colors.textSub }]}>
                          {judge.organization || judge.station?.name || "Cabinet d'Instruction"}
                        </Text>
                        {judge.matricule && (
                          <Text style={[styles.cabinetText, { color: colors.textSub }]}>
                            Matr. {judge.matricule}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={26}
                      color={isSelected ? primaryColor : colors.border}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* BOUTON VALIDER */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.mainBtn, { backgroundColor: primaryColor, opacity: mutation.isPending ? 0.7 : 1 }]}
            onPress={handleConfirm}
            disabled={mutation.isPending || !selectedJudge}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnText}>VALIDER LA SAISINE</Text>
                <Ionicons name="send" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:             { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollPadding:      { padding: 20, paddingBottom: 140 },
  requisitoireBox:    { padding: 20, borderRadius: 24, marginBottom: 30, borderLeftWidth: 8, borderWidth: 1, elevation: 3 },
  headerRow:          { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionTitle:       { fontSize: 11, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  prosecutorMention:  { fontSize: 13, marginBottom: 15 },
  boldText:           { fontWeight: "900" },
  offenceTitle:       { fontWeight: "900", fontSize: 20, marginBottom: 8 },
  descriptionText:    { fontSize: 14, lineHeight: 20 },
  caseBadge:          { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginTop: 15 },
  caseBadgeText:      { fontSize: 11, fontWeight: "900" },
  mainLabel:          { fontSize: 18, fontWeight: "900", marginBottom: 5 },
  subLabel:           { fontSize: 13, marginBottom: 20, opacity: 0.8 },
  emptyBox:           { padding: 30, borderRadius: 24, borderWidth: 1, borderStyle: "dashed", alignItems: "center", marginBottom: 20 },
  judgeList:          { gap: 12, marginBottom: 10 },
  judgeCard:          { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 22, borderWidth: 2 },
  judgeInfo:          { flexDirection: "row", alignItems: "center", gap: 15, flex: 1 },
  iconCircle:         { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  judgeName:          { fontSize: 16, fontWeight: "800" },
  cabinetText:        { fontSize: 12, marginTop: 2, fontWeight: "600" },
  mainBtn:            { height: 64, borderRadius: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 35, elevation: 4 },
  btnText:            { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.5 },
});