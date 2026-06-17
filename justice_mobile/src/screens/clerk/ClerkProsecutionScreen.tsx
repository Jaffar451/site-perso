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
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Architecture & Thème
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export default function ClerkProsecutionScreen() {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  const { caseId, reference = "RG-2025-000" } = route.params || { caseId: 0 };

  const [requisitionNumber, setRequisitionNumber] = useState("");
  const [prosecutorName, setProsecutorName] = useState("");
  const [currentCharge, setCurrentCharge] = useState("");
  const [charges, setCharges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    badgeBg: isDark ? "#4C1D95" : "#F3E8FF",
    badgeText: isDark ? "#DDD6FE" : "#6B21A8",
  };

  const addCharge = () => {
    const trimmedCharge = currentCharge.trim();
    if (!trimmedCharge) return;
    if (charges.some(c => c.toLowerCase() === trimmedCharge.toLowerCase())) {
      if (Platform.OS === 'web') window.alert("Doublon\n\nCette infraction est déjà listée dans le réquisitoire.");
      else Alert.alert("Doublon", "Cette infraction est déjà listée dans le réquisitoire.");
      return;
    }
    setCharges([...charges, trimmedCharge]);
    setCurrentCharge("");
  };

  const removeCharge = (index: number) => {
    setCharges(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!requisitionNumber.trim() || !prosecutorName.trim()) {
      const msg = "Veuillez remplir le numéro d'acte et le nom du magistrat.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Champs manquants", msg);
      return;
    }
    if (charges.length === 0) {
      if (Platform.OS === 'web') window.alert("Action requise\n\nVeuillez spécifier au moins un chef d'inculpation.");
      else Alert.alert("Action requise", "Veuillez spécifier au moins un chef d'inculpation.");
      return;
    }

    const title = "Validation de l'acte";
    const msg = `Confirmez-vous l'enrôlement du réquisitoire n°${requisitionNumber} au registre ?`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) processSubmission();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Confirmer", onPress: processSubmission }
        ]);
    }
  };

  const processSubmission = () => {
    setLoading(true);
    // Simulation e-Justice : Transmission au Cabinet d'Instruction
    setTimeout(() => {
      setLoading(false);
      if (Platform.OS === 'web') {
        window.alert("✅ Réquisitoire enrôlé avec succès.");
      } else {
        Alert.alert("Succès", "Réquisitoire enregistré. Le dossier est transmis au Cabinet d'Instruction.");
      }
      navigation.goBack();
    }, 1500);
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Réquisitoire du Parquet" showBack={true} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 🏛️ BANDEAU DOSSIER */}
          <View style={[styles.infoCard, { backgroundColor: primaryColor + "15", borderColor: primaryColor }]}>
            <View style={[styles.iconBox, { backgroundColor: primaryColor }]}>
                <Ionicons name="briefcase-outline" size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: primaryColor }]}>DOSSIER RÉCEPTIONNÉ</Text>
              <Text style={[styles.infoRef, { color: colors.textMain }]}>REF: {reference}</Text>
            </View>
          </View>

          {/* ✍️ FORMULAIRE IDENTIFICATION */}
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Identification de l'Acte</Text>
            
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>N° RÉQUISITOIRE INTRODUCTIF (RI) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
                  placeholder="Ex: RI-2026/042-NY"
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  value={requisitionNumber}
                  onChangeText={setRequisitionNumber}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>MAGISTRAT REQUÉRANT *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
                  placeholder="Nom du Procureur"
                  placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                  value={prosecutorName}
                  onChangeText={setProsecutorName}
                />
            </View>
          </View>

          {/* ⚖️ CHEFS D'INCULPATION */}
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Chefs d'Inculpation</Text>
            <Text style={[styles.helper, { color: colors.textSub }]}>Inscrivez les infractions telles qu'elles figurent sur l'acte original.</Text>

            <View style={styles.addChargeRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
                placeholder="Inscrire une infraction..."
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={currentCharge}
                onChangeText={setCurrentCharge}
                onSubmitEditing={addCharge}
              />
              <TouchableOpacity 
                activeOpacity={0.7}
                style={[styles.addBtn, { backgroundColor: primaryColor }]} 
                onPress={addCharge}
              >
                <Ionicons name="add" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.chargesList}>
              {charges.length === 0 ? (
                <Text style={[styles.emptyCharges, { color: colors.textSub }]}>Aucune infraction enregistrée.</Text>
              ) : (
                charges.map((charge, index) => (
                  <View key={index} style={[styles.chargeBadge, { backgroundColor: colors.badgeBg, borderColor: isDark ? colors.badgeText : "#A855F7" }]}>
                    <Text style={[styles.chargeText, { color: colors.badgeText }]}>{charge.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => removeCharge(index)}>
                      <Ionicons name="close-circle" size={18} color={colors.badgeText} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* 🚀 VALIDATION */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.submitBtn, { backgroundColor: primaryColor }, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.submitText}>VALIDER L'ENRÔLEMENT</Text>
                <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  infoCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 24, borderLeftWidth: 6, marginBottom: 25 },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  infoLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  infoRef: { fontSize: 18, fontWeight: "900", marginTop: 4 },

  section: { 
    padding: 22, 
    borderRadius: 28, 
    marginBottom: 20, 
    borderWidth: 1,
    ...Platform.select({
        ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
        android: { elevation: 2 },
        web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }
    })
  },
  sectionTitle: { fontSize: 17, fontWeight: "900", marginBottom: 15, letterSpacing: -0.5 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 9, fontWeight: "900", marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  helper: { fontSize: 12, marginBottom: 18, fontWeight: "600", lineHeight: 18 },
  input: { borderWidth: 1.5, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: "600" },

  addChargeRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  addBtn: { width: 56, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  chargesList: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 22 },
  emptyCharges: { width: "100%", textAlign: "center", fontStyle: "italic", padding: 15, fontWeight: "600" },
  chargeBadge: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 15, borderRadius: 14, gap: 10, borderWidth: 1 },
  chargeText: { fontWeight: "900", fontSize: 11, letterSpacing: 0.3 },

  submitBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    height: 64, 
    borderRadius: 22, 
    gap: 12, 
    marginTop: 15,
    ...Platform.select({ 
        android: { elevation: 6 }, 
        ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
        web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }
    })
  },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: 1.5 },
  footerSpacing: { height: 140 }
});