// PATH: src/screens/clerk/ClerkRegisterCaseScreen.tsx
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAppTheme } from "../../theme/AppThemeProvider";
import { ClerkScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { updateComplaint, transitionComplaint } from "../../services/complaint.service";
import { createHearing } from "../../services/hearing.service";

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function ClerkRegisterCaseScreen({ navigation, route }: ClerkScreenProps<'ClerkRegisterCase'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const params      = route.params as any;
  const complaintId = params?.complaintId;

  const [caseNumber, setCaseNumber]   = useState("");
  const [chamber, setChamber]         = useState("Chambre Correctionnelle I");
  const [judgeName, setJudgeName]     = useState("");
  const [hearingDate, setHearingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes]             = useState("");
  const [submitting, setSubmitting]   = useState(false);

  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    inputBg:  isDark ? "#0F172A" : "#F8FAFC",
    infoBg:   isDark ? "#0C4A6E" : "#F0F9FF",
  };

  const generateAutoNumber = () => {
    const year   = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    setCaseNumber(`RG-${year}-${random}`);
  };

  const handleSubmit = async () => {
    if (!caseNumber.trim() || !judgeName.trim()) {
      alertMsg("Champs requis", "Le Numéro RG et le Juge désigné sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Immatriculation + transition vers audience_programmée (Art. 74 CPP)
      await updateComplaint(complaintId, {
        caseNumber: caseNumber.toUpperCase(),
        notes,
      });

      // 2. Transition officielle → audience_programmée
      await transitionComplaint(Number(complaintId), "audience_programmée");

      // 3. Création de l'acte d'audience (Première Comparution)
      await createHearing({
        caseId:     Number(complaintId),
        caseNumber: caseNumber.toUpperCase(),
        date:       hearingDate.toISOString(),
        room:       chamber,
        type:       "Première Comparution",
        judgeName,
      });

      alertMsg(
        "✅ Dossier Enrôlé",
        `L'affaire ${caseNumber.toUpperCase()} est inscrite au rôle.\nAudience fixée le ${hearingDate.toLocaleDateString("fr-FR")}.`
      );
      navigation.popToTop();
    } catch (error: any) {
      alertMsg("Erreur Registre", error?.response?.data?.message || "Impossible de valider l'enrôlement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Enrôlement RG" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BANDEAU */}
          <View style={[styles.infoBox, { backgroundColor: colors.infoBg, borderColor: primaryColor }]}>
            <Ionicons name="ribbon-outline" size={24} color={primaryColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: primaryColor }]}>Acte d'Immatriculation</Text>
              <Text style={[styles.infoText, { color: isDark ? "#BAE6FD" : "#0369A1" }]}>
                Attribuez un numéro de Répertoire Général (RG) pour officialiser la saisine du tribunal.
                La plainte passera au statut "Audience programmée" (Art. 74 CPP Niger).
              </Text>
            </View>
          </View>

          {/* NUMÉRO RG */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>NUMÉRO DE RÉPERTOIRE GÉNÉRAL (RG) *</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMain }]}
                placeholder="Ex: RG-2026-042"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={caseNumber}
                onChangeText={setCaseNumber}
                autoCapitalize="characters"
              />
              <TouchableOpacity activeOpacity={0.7} onPress={generateAutoNumber} style={[styles.autoBtn, { backgroundColor: primaryColor }]}>
                <Ionicons name="flash-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* JUGE */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>JUGE DE SIÈGE DÉSIGNÉ *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMain }]}
              placeholder="Nom du Juge du Cabinet..."
              placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
              value={judgeName}
              onChangeText={setJudgeName}
            />
          </View>

          {/* CHAMBRE */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>CHAMBRE / SALLE D'AUDIENCE</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMain }]}
              placeholder="Ex: Chambre Correctionnelle I"
              placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
              value={chamber}
              onChangeText={setChamber}
            />
          </View>

          {/* DATE D'AUDIENCE */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>DATE DE PREMIÈRE COMPARUTION</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateBtn, { borderColor: colors.border, backgroundColor: colors.bgCard }]}
            >
              <Ionicons name="calendar-outline" size={20} color={primaryColor} />
              <Text style={[styles.dateText, { color: colors.textMain }]}>
                {hearingDate.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={hearingDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, date) => { setShowDatePicker(false); if (date) setHearingDate(date); }}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* NOTES */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>NOTES DU GREFFE (FACULTATIF)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMain }]}
              placeholder="Annotations sur le dossier physique ou pièces jointes..."
              placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* BOUTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.submitBtn, { backgroundColor: primaryColor }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
                <Text style={styles.submitText}>VALIDER L'ENRÔLEMENT</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content:    { padding: 20 },
  infoBox:    { flexDirection: "row", padding: 18, borderRadius: 24, borderLeftWidth: 8, marginBottom: 30, gap: 15, alignItems: "center" },
  infoTitle:  { fontWeight: "900", fontSize: 13, textTransform: 'uppercase', marginBottom: 2 },
  infoText:   { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  inputGroup: { marginBottom: 25 },
  label:      { fontSize: 10, fontWeight: "900", marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  rowInput:   { flexDirection: 'row', gap: 12 },
  autoBtn:    { width: 58, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center", elevation: 2 },
  input:      { height: 58, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 18, fontSize: 16, fontWeight: "700" },
  textArea:   { minHeight: 120, borderRadius: 18, borderWidth: 1.5, padding: 18, fontSize: 15, fontWeight: '600' },
  dateBtn:    { flexDirection: "row", alignItems: "center", gap: 12, height: 60, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 18 },
  dateText:   { fontSize: 15, fontWeight: "700" },
  submitBtn:  {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    height: 64, borderRadius: 22, gap: 12, marginTop: 10,
    ...Platform.select({
      android: { elevation: 6 },
      ios:     { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
      web:     { boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }
    })
  },
  submitText: { color: "#FFF", fontSize: 15, fontWeight: "900", letterSpacing: 1.5 },
});