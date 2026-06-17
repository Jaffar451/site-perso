// PATH: src/screens/judge/JudgeReparationScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Architecture & Theme
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";

// ✅ UI Components
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { updateDecision } from "../../services/decision.service";

export default function JudgeReparationScreen({ route, navigation }: JudgeScreenProps<'JudgeReparation'>) {
  const { theme, isDark } = useAppTheme();
  
  // ✅ Identité Cabinet d'Instruction
  const JUDGE_ACCENT = "#7C3AED"; 
  const { user } = useAuthStore();
  
  // Récupération sécurisée des paramètres
  const { caseId, decisionId } = route.params;

  const [moralDamage, setMoralDamage] = useState("");
  const [materialDamage, setMaterialDamage] = useState("");
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    infoBg: isDark ? "#1e1b4b" : "#F5F3FF",
    totalBg: isDark ? "#0F172A" : "#F8FAFC",
  };

  const total = (Number(moralDamage) || 0) + (Number(materialDamage) || 0);

  /**
   * ✍️ SIGNATURE DE L'ORDONNANCE CIVILE
   */
  const handleSaveReparation = async () => {
    if (!moralDamage && !materialDamage) {
      const msg = "Veuillez saisir au moins un montant de réparation (Matériel ou Moral).";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Montant requis", msg);
      return;
    }

    if (!justification.trim() || justification.trim().length < 15) {
      const msg = "La motivation du calcul est obligatoire pour justifier le quantum (min. 15 car.).";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Motivation requise", msg);
      return;
    }

    const title = "Ordonnance Civile ⚖️";
    const msg = `Confirmez-vous l'allocation de ${total.toLocaleString()} FCFA à la partie civile ? Cet acte sera annexé au jugement principal.`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) executeSave();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Signer l'Acte", onPress: executeSave }
        ]);
    }
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const payload = {
        reparations: {
          moral: Number(moralDamage) || 0,
          material: Number(materialDamage) || 0,
          total: total,
        },
        reparationJustification: justification.trim(),
        judgeSignature: `CIVIL-SIG-${user?.id}-${Date.now()}`,
        updatedAt: new Date().toISOString()
      };

      if (decisionId) {
        await updateDecision(decisionId, payload as any);
      }

      const successMsg = "L'ordonnance sur intérêts civils a été scellée et transmise au Greffe.";
      if (Platform.OS === 'web') window.alert(`✅ ${successMsg}`);
      else Alert.alert("Réparation Validée", successMsg);

      navigation.goBack();
    } catch (error) {
      if (Platform.OS === 'web') window.alert("Erreur Technique\n\nImpossible d'enregistrer l'ordonnance civile.");
      else Alert.alert("Erreur Technique", "Impossible d'enregistrer l'ordonnance civile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Intérêts Civils" showBack={true} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 🏛️ BANDEAU DU DOSSIER */}
          <View style={[styles.infoBox, { backgroundColor: colors.infoBg, borderLeftColor: JUDGE_ACCENT, borderColor: colors.border }]}>
            <View style={[styles.iconCircle, { backgroundColor: JUDGE_ACCENT }]}>
               <Ionicons name="cash-outline" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[styles.infoText, { color: JUDGE_ACCENT }]}>
                  FIXATION DES RÉPARATIONS
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMain, fontWeight: '800', marginTop: 4 }}>
                  Dossier N° RP-{caseId}/26
                </Text>
            </View>
          </View>

          {/* PRÉJUDICE MATÉRIEL */}
          <Text style={[styles.label, { color: colors.textSub }]}>Préjudice Matériel (FCFA)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Montant des pertes financières..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            keyboardType="numeric"
            value={materialDamage}
            onChangeText={setMaterialDamage}
          />

          {/* PRÉJUDICE MORAL */}
          <Text style={[styles.label, { color: colors.textSub }]}>Préjudice Moral (FCFA)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Montant pour souffrance ou atteinte..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            keyboardType="numeric"
            value={moralDamage}
            onChangeText={setMoralDamage}
          />

          {/* MOTIVATION */}
          <Text style={[styles.label, { color: colors.textSub }]}>Motivation du calcul *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Attendu que la victime a fourni les factures n°... Attendu le certificat médical..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            multiline
            numberOfLines={6}
            value={justification}
            onChangeText={setJustification}
            textAlignVertical="top"
          />

          {/* 📊 RÉCAPITULATIF FINANCIER */}
          <View style={[styles.totalBox, { backgroundColor: colors.totalBg, borderColor: JUDGE_ACCENT }]}>
            <Text style={[styles.totalLabel, { color: colors.textSub }]}>TOTAL ALLOUÉ À LA PARTIE CIVILE</Text>
            <Text style={[styles.totalAmount, { color: JUDGE_ACCENT }]}>
              {total.toLocaleString("fr-FR")} FCFA
            </Text>
          </View>

          {/* BOUTON DE SIGNATURE */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.saveBtn, { backgroundColor: JUDGE_ACCENT }, loading && { opacity: 0.7 }]}
            onPress={handleSaveReparation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="ribbon-outline" size={24} color="#fff" />
                <Text style={styles.saveBtnText}>SCELLER L'ORDONNANCE CIVILE</Text>
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
  container: { padding: 20 },
  infoBox: { flexDirection: "row", alignItems: "center", padding: 22, borderRadius: 24, marginBottom: 30, borderLeftWidth: 8, elevation: 3, borderWidth: 1 },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  label: { fontSize: 11, fontWeight: "900", marginBottom: 12, marginTop: 18, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: { borderRadius: 18, padding: 18, borderWidth: 1.5, fontSize: 16, fontWeight: '700' },
  textArea: { height: 150, lineHeight: 24 },
  totalBox: { marginTop: 40, padding: 30, borderRadius: 24, alignItems: "center", borderWidth: 2, borderStyle: 'dashed' },
  totalLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  totalAmount: { fontSize: 32, fontWeight: "900", marginTop: 10, letterSpacing: -1 },
  saveBtn: { 
    flexDirection: "row", 
    height: 68, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 40, 
    gap: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
});