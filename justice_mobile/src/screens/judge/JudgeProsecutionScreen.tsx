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
  Switch,
  Platform,
  KeyboardAvoidingView,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Imports Architecture Alignés
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { updateComplaint } from "../../services/complaint.service";

export default function JudgeProsecutionScreen({ route, navigation }: JudgeScreenProps<'JudgeProsecution'>) {
  // ✅ 2. Thème Dynamique & Auth
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();
  
  // Récupération sécurisée des paramètres
  const params = route.params as { caseId: number; personName?: string };
  const { caseId, personName = "Le Prévenu" } = params || { caseId: 0 };

  const [charges, setCharges] = useState("");
  const [legalArticles, setLegalArticles] = useState("");
  const [observations, setObservations] = useState("");
  const [isFelony, setIsFelony] = useState(false); // Crime (true) vs Délit (false)
  const [loading, setLoading] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    headerBg: isDark ? "#1E293B" : "#F8FAFC",
    felonyColor: "#EF4444", // Rouge pour les Crimes
  };

  const handleConfirmProsecution = async () => {
    if (!charges.trim() || !legalArticles.trim()) {
      const msg = "Veuillez spécifier les chefs d'inculpation et les visas légaux.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Champs requis", msg);
      return;
    }

    const title = "Prononcer l'Inculpation";
    const msg = `Clore l'instruction et renvoyer ${personName} devant la juridiction ? \n\nNature : ${isFelony ? "CRIMINELLE" : "DÉLICTUELLE"}`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) submitProsecution();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Signer l'Ordonnance", style: isFelony ? "destructive" : "default", onPress: submitProsecution }
        ]);
    }
  };

  const submitProsecution = async () => {
    setLoading(true);
    try {
      await updateComplaint(caseId, {
        status: "audience_programmée", 
        prosecutionDetails: {
          charges: charges.trim(),
          articles: legalArticles.trim(),
          severity: isFelony ? "CRIME" : "DELIT",
          observations: observations.trim(),
          issuedAt: new Date().toISOString(),
          judgeSignature: `SIG-J-${user?.id}-${Date.now()}`
        }
      } as any);
      
      const successMsg = "Dossier Transmis au rôle pour jugement.";
      if (Platform.OS === 'web') window.alert(`✅ ${successMsg}`);
      else Alert.alert("Dossier Transmis ✅", successMsg);

      navigation.navigate("JudgeHome");
    } catch (error) {
      if (Platform.OS === 'web') window.alert("Erreur\n\nL'acte n'a pas pu être enregistré.");
      else Alert.alert("Erreur", "L'acte n'a pas pu être enregistré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Acte d'Accusation" showBack={true} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 📂 EN-TÊTE JURIDIQUE */}
          <View style={[styles.headerCard, { backgroundColor: colors.headerBg, borderLeftColor: isFelony ? colors.felonyColor : primaryColor, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.labelSmall, { color: colors.textSub }]}>PROCÉDURE RG</Text>
              <Text style={[styles.caseId, { color: isFelony ? colors.felonyColor : primaryColor }]}>#{caseId}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.labelSmall, { color: colors.textSub }]}>PRÉVENU / INCULPÉ</Text>
              <Text style={[styles.personName, { color: colors.textMain }]}>{personName.toUpperCase()}</Text>
            </View>
          </View>

          {/* Qualification Juridique */}
          <View style={styles.sectionTitleContainer}>
              <View style={[styles.accentBar, { backgroundColor: isFelony ? colors.felonyColor : primaryColor }]} />
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Qualification Juridique</Text>
          </View>

          <View style={[styles.switchContainer, { backgroundColor: colors.bgCard, borderColor: isFelony ? colors.felonyColor : colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: isFelony ? colors.felonyColor : colors.textMain }]}>
                {isFelony ? "CRIME (Cour d'Assises)" : "DÉLIT (Correctionnel)"}
              </Text>
              <Text style={[styles.switchSub, { color: colors.textSub }]}>Basculez pour une qualification criminelle.</Text>
            </View>
            <Switch
              value={isFelony}
              onValueChange={setIsFelony}
              trackColor={{ false: "#CBD5E1", true: colors.felonyColor }}
            />
          </View>

          {/* INPUTS DE RÉDACTION */}
          <Text style={[styles.label, { color: colors.textSub }]}>Chefs d'accusation retenus *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
            placeholder="Ex: Détournement de fonds publics..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            value={charges}
            onChangeText={setCharges}
          />

          <Text style={[styles.label, { color: colors.textSub }]}>Visas (Articles du Code Pénal) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
            placeholder="Ex: Art. 142 al. 1 du Code Pénal"
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            value={legalArticles}
            onChangeText={setLegalArticles}
          />

          <Text style={[styles.label, { color: colors.textSub }]}>Observations de clôture</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
            placeholder="Circonstances de l'infraction ou éléments de personnalité..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            multiline
            numberOfLines={5}
            value={observations}
            onChangeText={setObservations}
            textAlignVertical="top"
          />

          {/* BOUTON DE SIGNATURE */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: isFelony ? colors.felonyColor : primaryColor }, loading && { opacity: 0.7 }]}
            onPress={handleConfirmProsecution}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="hammer-outline" size={22} color="#fff" />
                <Text style={styles.btnText}>SIGNER L'ORDONNANCE</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerCard: { flexDirection: "row", justifyContent: "space-between", padding: 20, borderRadius: 24, marginBottom: 30, borderLeftWidth: 8, borderWidth: 1, ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  labelSmall: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 5 },
  caseId: { fontSize: 20, fontWeight: "900" },
  personName: { fontSize: 16, fontWeight: "900" },
  
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  accentBar: { width: 5, height: 24, borderRadius: 3, marginRight: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "900", textTransform: 'uppercase', letterSpacing: 0.5 },
  
  label: { fontSize: 11, fontWeight: "900", marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderRadius: 16, padding: 18, borderWidth: 1.5, fontSize: 15, fontWeight: '600' },
  textArea: { height: 140, lineHeight: 22 },
  
  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderRadius: 24, borderWidth: 2, marginVertical: 10 },
  switchTitle: { fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
  switchSub: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  
  btn: { 
    flexDirection: "row", 
    height: 64, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 40, 
    gap: 12,
    ...Platform.select({
        ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
        android: { elevation: 6 },
        web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.15)" }
    })
  },
  btnText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
});