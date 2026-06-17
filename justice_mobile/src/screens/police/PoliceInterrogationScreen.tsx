// PATH: src/screens/police/PoliceInterrogationScreen.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  StatusBar 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Architecture & Store
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";

// ✅ Composants de mise en page
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { updateComplaint } from "../../services/complaint.service";

export default function PoliceInterrogationScreen({ route, navigation }: PoliceScreenProps<'PoliceInterrogation'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary; 
  const { user } = useAuthStore();
  
  // ✅ Extraction typée des paramètres (Synchronisé avec navigation.ts)
  const { complaintId, suspectName = "Le Prévenu" } = route.params;

  // État initial avec un template de PV d'audition
  const interrogationTemplate = "QUESTION : \nREPONSE : \n\n-------------------\n\nQUESTION : \nREPONSE : ";
  
  const [statement, setStatement] = useState(interrogationTemplate); 
  const [lawyerPresent, setLawyerPresent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    headerCard: isDark ? "#1E293B" : "#FFFFFF",
  };

  /**
   * ⚖️ ENREGISTREMENT ET SCELLAGE DU PV D'AUDITION
   */
  const alertMsg = (t: string, m: string, onOk?: () => void) => {
    if (Platform.OS === 'web') { window.alert(`${t}\n\n${m}`); onOk?.(); }
    else Alert.alert(t, m, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
  };

  const handleSaveStatement = async () => {
    if (!complaintId) {
      return alertMsg("Erreur Dossier", "L'identifiant du dossier est manquant.");
    }

    if (statement.trim().length < 50 || statement === interrogationTemplate) {
      return alertMsg("Saisie insuffisante", "Le contenu de l'audition est trop succinct ou non modifié.");
    }

    const doSeal = async () => {
      try {
        setIsSubmitting(true);
        await updateComplaint(Number(complaintId), {
          interrogationContent: statement.trim(),
          lawyerPresence: lawyerPresent,
          interrogationDate: new Date().toISOString(),
          status: "en_cours_OPJ",
          signingOfficer: `${user?.firstname} ${user?.lastname}`
        } as any);
        alertMsg("Acte Certifié ✅", "Le procès-verbal d'audition a été scellé et versé au dossier RG.", () => navigation.goBack());
      } catch (error) {
        alertMsg("Erreur", "L'enregistrement sécurisé a échoué. Vérifiez votre connexion.");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Clôture de l'Audition\n\nUne fois scellé, ce procès-verbal ne pourra plus être modifié. Confirmer ?")) doSeal();
    } else {
      Alert.alert("Clôture de l'Audition ⚖️", "Une fois scellé, ce procès-verbal d'audition ne pourra plus être modifié. Confirmer ?", [
        { text: "Réviser", style: "cancel" },
        { text: "Signer & Sceller", onPress: doSeal }
      ]);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Audition Judiciaire" showBack={true} />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollPadding}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            {/* BANDEAU D'IDENTIFICATION DU PRÉVENU */}
            <View style={[styles.headerCard, { borderLeftColor: primaryColor, backgroundColor: colors.headerCard, borderColor: colors.border }]}>
              <Text style={[styles.miniLabel, { color: primaryColor }]}>PROCÈS-VERBAL D'AUDITION NUMÉRIQUE</Text>
              <Text style={[styles.suspectName, { color: colors.textMain }]}>{suspectName.toUpperCase()}</Text>
              <Text style={[styles.caseRef, { color: colors.textSub }]}>Réf. Dossier : RG-#{complaintId}</Text>
            </View>

            

            {/* DROITS DE LA DÉFENSE */}
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[
                styles.lawyerToggle, 
                { 
                  borderColor: lawyerPresent ? "#10B981" : colors.border,
                  backgroundColor: lawyerPresent ? "#10B98110" : colors.bgCard
                }
              ]}
              onPress={() => setLawyerPresent(!lawyerPresent)}
            >
              <Ionicons 
                name={lawyerPresent ? "shield-checkmark" : "shield-outline"} 
                size={24} 
                color={lawyerPresent ? "#10B981" : colors.textSub} 
              />
              <View style={{ flex: 1 }}>
                  <Text style={[styles.lawyerText, { color: colors.textMain }]}>Assistance d'un Conseil</Text>
                  <Text style={[styles.lawyerSub, { color: colors.textSub }]}>L'avocat a assisté à l'intégralité de l'acte</Text>
              </View>
              <View style={[styles.radio, { borderColor: lawyerPresent ? "#10B981" : colors.border }]}>
                  {lawyerPresent && <View style={[styles.radioDot, { backgroundColor: "#10B981" }]} />}
              </View>
            </TouchableOpacity>

            {/* TRANSCRIPTION DES DÉCLARATIONS */}
            <View style={styles.inputHeader}>
                <Text style={[styles.inputLabel, { color: colors.textSub }]}>Récit de l'audition (Q/R) *</Text>
                <Ionicons name="document-text-outline" size={18} color={primaryColor} />
            </View>
            
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
              multiline
              placeholder={"Commencez la saisie ici..."}
              placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
              value={statement}
              onChangeText={setStatement}
              textAlignVertical="top"
            />

            {/* AVERTISSEMENT LÉGAL */}
            <View style={[styles.legalNotice, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC", borderColor: colors.border }]}>
              <Ionicons name="information-circle" size={22} color={primaryColor} />
              <Text style={[styles.noticeText, { color: colors.textSub }]}>
                Important : Les déclarations recueillies sont enregistrées sous la responsabilité de l'OPJ instrumentaire.
              </Text>
            </View>

            {/* ACTION DE VALIDATION */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.submitBtn, { backgroundColor: primaryColor, opacity: isSubmitting ? 0.7 : 1 }]}
              onPress={handleSaveStatement}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="ribbon" size={22} color="#FFF" />
                  <Text style={styles.submitText}>SCELLER L'AUDITION</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { padding: 20, paddingBottom: 120 },
  headerCard: { borderLeftWidth: 6, padding: 20, borderRadius: 20, marginBottom: 25, elevation: 2, borderWidth: 1 },
  miniLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  suspectName: { fontSize: 20, fontWeight: "900", marginTop: 4 },
  caseRef: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  lawyerToggle: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18, borderWidth: 1.5, marginBottom: 30, gap: 12 },
  lawyerText: { fontWeight: '800', fontSize: 15 },
  lawyerSub: { fontSize: 11, marginTop: 1, opacity: 0.8 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 5 },
  inputLabel: { fontSize: 11, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea: { borderRadius: 20, borderWidth: 1.5, padding: 20, minHeight: 350, fontSize: 15, lineHeight: 22, marginBottom: 25 },
  legalNotice: { flexDirection: 'row', padding: 15, borderRadius: 15, alignItems: 'center', gap: 12, marginBottom: 35, borderWidth: 1 },
  noticeText: { flex: 1, fontSize: 11, fontWeight: '600', fontStyle: 'italic' },
  submitBtn: { flexDirection: "row", height: 62, borderRadius: 20, justifyContent: "center", alignItems: "center", gap: 12, elevation: 4 },
  submitText: { color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 0.5 }
});