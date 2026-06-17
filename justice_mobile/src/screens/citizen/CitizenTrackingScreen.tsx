import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Keyboard,
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// ✅ 1. Imports Architecture
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Import correct pour le thème dynamique

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

interface TrackingResult {
  caseNumber: string;
  status: string;
  location: string;
  lastUpdate: string;
  steps: {
    label: string;
    date?: string;
    completed: boolean;
    current: boolean;
  }[];
}

export default function CitizenTrackingScreen() {
  // ✅ 2. Thème via Helper
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const navigation = useNavigation();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackingResult | null>(null);

  // 🎨 PALETTE DYNAMIQUE
  const bgMain = isDark ? "#0F172A" : "#F8FAFC";
  const bgCard = isDark ? "#1E293B" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#1E293B";
  const textSub = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "#334155" : "#F1F5F9";
  const inputBg = isDark ? "#1E293B" : "#F8FAFC";

  const handleSearch = () => {
    Keyboard.dismiss();
    if (code.trim().length < 5) {
      setError("Entrez une référence valide (ex: RG-...)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Simulation d'appel API
    setTimeout(() => {
      if (code.toUpperCase().includes("ERROR")) {
        setError("Référence introuvable. Vérifiez votre code de suivi.");
        setLoading(false);
      } else {
        setResult({
          caseNumber: code.toUpperCase(),
          status: "INSTRUCTION",
          location: "Tribunal de Grande Instance de Niamey",
          lastUpdate: "28 Déc. 2025",
          steps: [
            { label: "Dépôt de la plainte", date: "10 Déc. 2025", completed: true, current: false },
            { label: "Enquête préliminaire (Police)", date: "15 Déc. 2025", completed: true, current: false },
            { label: "Transmission au Parquet", date: "20 Déc. 2025", completed: true, current: false },
            { label: "Phase d'Instruction", date: "En cours", completed: false, current: true },
            { label: "Jugement / Verdict", completed: false, current: false },
          ]
        });
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Suivi de Dossier" showBack />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: bgMain }]}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* 🔍 ZONE DE RECHERCHE */}
          <View style={[styles.searchSection, { backgroundColor: bgCard, borderColor: borderCol }]}>
            <Text style={[styles.label, { color: textSub }]}>Référence du dossier (RG)</Text>
            <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <Ionicons name="search" size={20} color={primaryColor} style={{ marginLeft: 15 }} />
              <TextInput
                style={[styles.input, { color: textMain }]}
                placeholder="Ex: RG-2025-0842"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={code}
                onChangeText={(t) => { setCode(t); setError(null); }}
                autoCapitalize="characters"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {code.length > 0 && (
                <TouchableOpacity onPress={() => setCode("")} style={{ padding: 10 }}>
                  <Ionicons name="close-circle" size={18} color={textSub} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.searchBtn, { backgroundColor: primaryColor }, loading && { opacity: 0.7 }]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.searchBtnText}>RECHERCHER</Text>
              )}
            </TouchableOpacity>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: isDark ? "#450a0a" : "#FEF2F2" }]}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* 📊 RÉSULTATS DU TRACKING */}
          {result && (
            <View style={[styles.resultCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
              <View style={[styles.resultHeader, { borderBottomColor: borderCol }]}>
                <View>
                  <Text style={[styles.resultLabel, { color: textSub }]}>RÉFÉRENCE</Text>
                  <Text style={[styles.resultTitle, { color: textMain }]}>{result.caseNumber}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: primaryColor + "15" }]}>
                  <Text style={[styles.statusText, { color: primaryColor }]}>{result.status}</Text>
                </View>
              </View>

              <View style={styles.locationBox}>
                <Ionicons name="location-sharp" size={16} color={primaryColor} />
                <Text style={[styles.locationText, { color: textSub }]}>
                  {result.location}
                </Text>
              </View>

              <Text style={[styles.timelineTitle, { color: textMain }]}>Étapes de la procédure</Text>
              
              <View style={styles.timelineContainer}>
                {result.steps.map((step, index) => {
                  const isLast = index === result.steps.length - 1;
                  const isActive = step.completed || step.current;
                  const dotColor = step.completed ? "#10B981" : (step.current ? primaryColor : (isDark ? "#334155" : "#E2E8F0"));
                  
                  return (
                    <View key={index} style={styles.timelineItem}>
                      {/* Ligne verticale */}
                      {!isLast && (
                        <View style={[styles.timelineLine, { backgroundColor: step.completed ? "#10B981" : (isDark ? "#334155" : "#E2E8F0") }]} />
                      )}
                      
                      {/* Point indicateur */}
                      <View style={[
                        styles.timelineDot, 
                        { backgroundColor: dotColor, borderColor: isDark ? bgCard : "#FFF" }
                      ]}>
                        {step.completed && <Ionicons name="checkmark" size={10} color="#FFF" />}
                        {step.current && <View style={styles.pulseDot} />}
                      </View>

                      {/* Texte de l'étape */}
                      <View style={styles.timelineContent}>
                        <Text style={[
                          styles.stepLabel, 
                          { color: isActive ? textMain : textSub, fontWeight: step.current ? "900" : "700" }
                        ]}>
                          {step.label}
                        </Text>
                        {step.date && (
                          <Text style={[styles.stepDate, { color: textSub }]}>{step.date}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {!result && !loading && !error && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
                <Ionicons name="search-outline" size={50} color={textSub} />
              </View>
              <Text style={[styles.emptyText, { color: textSub }]}>
                Entrez le numéro RG fourni par le Greffe pour consulter la progression de votre dossier.
              </Text>
            </View>
          )}

          {/* ✅ ESPACE FINAL POUR SMARTFOOTER */}
          <View style={styles.footerSpacing} />

        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  searchSection: { 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    })
  },
  label: { fontSize: 10, fontWeight: "900", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1.5 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1.5, height: 58 },
  input: { flex: 1, height: 58, paddingHorizontal: 12, fontSize: 16, fontWeight: "700" },
  searchBtn: { marginTop: 15, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  searchBtnText: { color: "#FFF", fontWeight: "900", letterSpacing: 1, fontSize: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", marginTop: 15, padding: 12, borderRadius: 12, gap: 10 },
  errorText: { fontSize: 12, fontWeight: "700", flex: 1, color: "#EF4444" },
  
  resultCard: { marginTop: 25, borderRadius: 24, padding: 22, borderWidth: 1 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20, borderBottomWidth: 1.5, marginBottom: 20 },
  resultLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  resultTitle: { fontSize: 24, fontWeight: "900", marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: 'uppercase' },
  locationBox: { flexDirection: "row", alignItems: "center", marginBottom: 30, gap: 8 },
  locationText: { fontSize: 12, fontWeight: "700" },
  
  timelineTitle: { fontSize: 14, fontWeight: "900", marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
  timelineContainer: { marginLeft: 10 },
  timelineItem: { flexDirection: "row", minHeight: 75 },
  timelineLine: { position: "absolute", left: 10, top: 22, bottom: 0, width: 2 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 3, alignItems: "center", justifyContent: "center", zIndex: 1 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFF" },
  timelineContent: { marginLeft: 20, flex: 1, marginTop: -2 },
  stepLabel: { fontSize: 14, lineHeight: 20 },
  stepDate: { fontSize: 11, marginTop: 4, fontWeight: "700", opacity: 0.7 },
  
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { textAlign: "center", lineHeight: 22, fontSize: 14, fontWeight: "600", opacity: 0.8 },
  footerSpacing: { height: 120 }
});