// PATH: src/screens/police/PoliceCustodyExtensionScreen.tsx
import React, { useState } from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StatusBar 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Architecture & Logic
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";

// ✅ UI Components
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { updateComplaint } from "../../services/complaint.service";

export default function PoliceCustodyExtensionScreen({ route, navigation }: PoliceScreenProps<'PoliceCustodyExtension'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary; 
  const { user } = useAuthStore();
  
  // ✅ Extraction typée des paramètres
  const { complaintId, suspectName = "Individu gardé à vue" } = route.params;

  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("48");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Palette de couleurs dynamique
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  /**
   * ⚖️ TRANSMISSION DE LA REQUÊTE AU PROCUREUR
   */
  const alertMsg = (t: string, m: string, onOk?: () => void) => {
    if (Platform.OS === 'web') { window.alert(`${t}\n\n${m}`); onOk?.(); }
    else Alert.alert(t, m, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
  };

  const handleRequestExtension = async () => {
    if (!complaintId) {
      return alertMsg("Erreur Dossier", "L'identifiant du dossier est manquant.");
    }

    if (reason.trim().length < 15) {
      return alertMsg("Motivation insuffisante", "Veuillez détailler davantage les raisons de la prolongation (minimum 15 caractères).");
    }

    const doSubmit = async () => {
      try {
        setIsSubmitting(true);
        await updateComplaint(Number(complaintId), {
          status: "attente_validation",
          custodyExtensionRequested: true,
          extensionReason: reason,
          requestedDuration: duration,
          extensionStatus: "pending_prosecutor",
          requestingOfficer: `${user?.firstname} ${user?.lastname}`
        } as any);
        alertMsg("Requête Transmise ✅", "Le Procureur de la République a été saisi numériquement de votre demande.", () => navigation.pop(2));
      } catch (error) {
        alertMsg("Échec Système", "Impossible de joindre les services du Parquet.");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Saisine du Parquet\n\nTransmettre cette demande de prolongation de ${duration}h pour ${suspectName} ?`)) doSubmit();
    } else {
      Alert.alert("Saisine du Parquet 🏛️", `Transmettre cette demande de prolongation de ${duration}h pour ${suspectName} ?`, [
        { text: "Réviser", style: "cancel" },
        { text: "Confirmer l'envoi", onPress: doSubmit }
      ]);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Demande de Prolongation" showBack={true} />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollPadding}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 🕒 RÉSUMÉ DE LA SITUATION */}
            <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderLeftColor: primaryColor }]}>
              <View style={[styles.iconBox, { backgroundColor: primaryColor + "15" }]}>
                <Ionicons name="timer-outline" size={24} color={primaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: primaryColor }]}>DOSSIER RG-#{complaintId}</Text>
                <Text style={[styles.infoSuspect, { color: colors.textMain }]}>{suspectName}</Text>
              </View>
            </View>

            {/* ⏳ CHOIX DE LA DURÉE */}
            <Text style={[styles.inputLabel, { color: colors.textSub }]}>Durée sollicitée *</Text>
            <View style={styles.durationRow}>
              {["24", "48"].map((h) => {
                const isActive = duration === h;
                return (
                  <TouchableOpacity
                    key={h}
                    activeOpacity={0.7}
                    style={[
                      styles.durationBtn,
                      { 
                          backgroundColor: isActive ? primaryColor : colors.bgCard,
                          borderColor: isActive ? primaryColor : colors.border 
                      }
                    ]}
                    onPress={() => setDuration(h)}
                  >
                    <Text style={[styles.durationText, { color: isActive ? "#FFF" : colors.textMain }]}>+{h}H</Text>
                    <Text style={[styles.durationSub, { color: isActive ? "rgba(255,255,255,0.7)" : colors.textSub }]}>PROLONGATION</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 📝 MOTIVATION JURIDIQUE */}
            <Text style={[styles.inputLabel, { color: colors.textSub }]}>Motivations de la requête (OPJ) *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
              multiline
              numberOfLines={6}
              placeholder="Ex: Nécessité de confronter le suspect avec les nouveaux éléments de preuve..."
              placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
              value={reason}
              onChangeText={setReason}
              textAlignVertical="top"
            />

            {/* 🚀 BOUTON D'ENVOI AU PARQUET */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.submitBtn, { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }]}
              onPress={handleRequestExtension}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFF" style={{marginRight: 10}} />
                  <Text style={styles.submitText}>SAISIR LE PROCUREUR</Text>
                </>
              )}
            </TouchableOpacity>

            {/* ⚖️ RAPPEL LÉGAL */}
            <View style={[styles.legalNotice, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9", borderColor: colors.border }]}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={[styles.warningNote, { color: colors.textSub }]}>
                La prolongation de la garde à vue est un acte exceptionnel qui doit être motivé par les nécessités de l'enquête.
              </Text>
            </View>
            
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { padding: 20, paddingBottom: 120 },
  infoCard: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 25, borderLeftWidth: 6, elevation: 2 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  infoSuspect: { fontSize: 18, fontWeight: '900' },
  inputLabel: { fontSize: 11, fontWeight: "900", marginBottom: 10, textTransform: 'uppercase' },
  durationRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  durationBtn: { flex: 1, padding: 15, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  durationText: { fontWeight: '900', fontSize: 16 },
  durationSub: { fontSize: 8, fontWeight: '800' },
  textArea: { borderRadius: 18, borderWidth: 2, padding: 15, minHeight: 140, fontSize: 15, marginBottom: 25 },
  submitBtn: { flexDirection: "row", height: 60, borderRadius: 18, justifyContent: "center", alignItems: "center", elevation: 4 },
  submitText: { color: "#FFF", fontWeight: "900", fontSize: 15 },
  legalNotice: { flexDirection: 'row', padding: 15, borderRadius: 15, marginTop: 20, gap: 10, alignItems: 'center', borderWidth: 1 },
  warningNote: { flex: 1, fontSize: 11, fontStyle: 'italic', fontWeight: '600' }
});