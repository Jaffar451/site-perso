// PATH: src/screens/judge/CreateDecisionScreen.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator,
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Architecture & Theme
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";

// ✅ Composants UI
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { createDecision } from "../../services/decision.service";

/**
 * ⚖️ CONFIGURATION DES VERDICTS
 */
const VERDICT_OPTIONS = [
  { key: "guilty", label: "COUPABLE", color: "#EF4444", icon: "hammer", desc: "Condamnation pénale ferme ou avec sursis" },
  { key: "not_guilty", label: "RELAXE", color: "#10B981", icon: "shield-checkmark", desc: "Acquittement des fins de la poursuite" },
  { key: "dismissed", label: "NON-LIEU", color: "#64748B", icon: "close-circle", desc: "Clôture de l'instruction sans poursuite" },
];

export default function CreateDecisionScreen({ route, navigation }: JudgeScreenProps<'CreateDecision'>) {
  const { theme, isDark } = useAppTheme();
  
  // ✅ Identité visuelle du Cabinet d'Instruction (Violet)
  const JUDGE_ACCENT = "#7C3AED"; 
  
  // Récupération sécurisée du dossier
  const { caseId } = route.params; 
  
  const [content, setContent] = useState("");
  const [verdict, setVerdict] = useState("guilty");
  const [isLoading, setIsLoading] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    infoCardBg: isDark ? "#1e1b4b" : "#F5F3FF", // Indigo très léger pour le juge
  };

  /**
   * ✍️ VALIDATION ET PUBLICATION DE LA MINUTE
   */
  const confirmPublish = () => {
    if (content.trim().length < 30) {
      const msg = "Le délibéré doit être motivé en fait et en droit (min. 30 caractères).";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Motivation insuffisante", msg);
      return;
    }

    const title = "Prononcé du Verdict ⚖️";
    const msg = "Cette décision sera scellée et versée définitivement au dossier RP/2026. Confirmer la publication ?";

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) handlePublish();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Rendre le jugement", style: "destructive", onPress: handlePublish }
        ]);
    }
  };

  const handlePublish = async () => {
    setIsLoading(true);
    try {
      // ✅ Certification de l'acte sur le serveur e-Justice
      await createDecision({
        caseId: Number(caseId),
        content: content.trim(),
        verdict: verdict,
        date: new Date().toISOString(),
      }); 
      
      if (Platform.OS === 'web') {
          window.alert("✅ Décision rendue et notifiée aux parties.");
      } else {
          Alert.alert("Justice Rendue ✅", "La décision a été signée électroniquement et transmise au Greffe.");
      }
      
      navigation.popToTop(); 
    } catch (error) {
      if (Platform.OS === 'web') window.alert("Erreur de Scellage\n\nImpossible d'enregistrer l'acte sur la blockchain judiciaire.");
      else Alert.alert("Erreur de Scellage", "Impossible d'enregistrer l'acte sur la blockchain judiciaire.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Rédaction du Délibéré" showBack={true} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* 🏛️ RÉFÉRENCE DU DOSSIER */}
          <View style={[styles.infoCard, { backgroundColor: colors.infoCardBg, borderColor: JUDGE_ACCENT + "40" }]}>
            <View style={[styles.iconBox, { backgroundColor: JUDGE_ACCENT }]}>
                <Ionicons name="document-text" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: JUDGE_ACCENT }]}>CABINET D'INSTRUCTION</Text>
              <Text style={[styles.infoValue, { color: colors.textMain }]}>Dossier N° RP-{caseId}/26</Text>
            </View>
          </View>

          {/* ⚖️ SÉLECTION DU DISPOSITIF (VERDICT) */}
          <Text style={[styles.label, { color: colors.textSub }]}>Dispositif de la décision *</Text>
          <View style={styles.verdictGrid}>
            {VERDICT_OPTIONS.map((opt) => {
              const isActive = verdict === opt.key;
              return (
                <TouchableOpacity 
                  key={opt.key} 
                  activeOpacity={0.8}
                  style={[
                    styles.verdictCard, 
                    { 
                      backgroundColor: colors.bgCard,
                      borderColor: isActive ? opt.color : colors.border,
                      borderLeftWidth: isActive ? 8 : 1
                    }
                  ]}
                  onPress={() => setVerdict(opt.key)}
                >
                  <View style={[styles.verdictIcon, { backgroundColor: isActive ? opt.color + "15" : colors.bgMain }]}>
                    <Ionicons name={opt.icon as any} size={22} color={isActive ? opt.color : colors.textSub} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.verdictLabel, { color: isActive ? opt.color : colors.textMain }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.verdictDesc, { color: colors.textSub }]} numberOfLines={1}>
                      {opt.desc}
                    </Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={24} color={opt.color} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ✍️ ZONE DE RÉDACTION JURIDIQUE */}
          <Text style={[styles.label, { color: colors.textSub }]}>Motivations du Tribunal *</Text>
          <TextInput
            multiline
            numberOfLines={12}
            style={[
              styles.textArea, 
              { 
                backgroundColor: colors.inputBg, 
                borderColor: colors.border,
                color: colors.textMain
              }
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="Par ces motifs : \nAttendu que... \nDéclarons le nommé... \nLe condamnons à..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            textAlignVertical="top"
          />

          {/* 🚀 BOUTON DE PUBLICATION OFFICIELLE */}
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[
              styles.publishBtn, 
              { backgroundColor: JUDGE_ACCENT },
              isLoading && { opacity: 0.7 }
            ]} 
            onPress={confirmPublish}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="ribbon-outline" size={24} color="#FFF" />
                <Text style={styles.btnText}>SCELLER ET RENDRE LE JUGEMENT</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.legalNotice}>
            <Ionicons name="shield-checkmark" size={16} color={colors.textSub} />
            <Text style={[styles.noticeText, { color: colors.textSub }]}>
              Cet acte est certifié conforme au Code de Procédure Pénale nigérien.
            </Text>
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  container: { padding: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 25, borderLeftWidth: 1, borderWidth: 1, elevation: 3 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  infoValue: { fontSize: 19, fontWeight: '900', marginTop: 2 },
  label: { fontSize: 11, fontWeight: '900', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 },
  verdictGrid: { gap: 12, marginBottom: 30 },
  verdictCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, gap: 15, elevation: 2, borderWidth: 1 },
  verdictIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  verdictLabel: { fontWeight: '900', fontSize: 15 },
  verdictDesc: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  textArea: { borderRadius: 24, padding: 20, borderWidth: 1.5, minHeight: 350, fontSize: 16, lineHeight: 24, marginBottom: 30, textAlignVertical: 'top' },
  publishBtn: { 
    flexDirection: 'row', 
    height: 68, 
    borderRadius: 22, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
  legalNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 25, opacity: 0.6 },
  noticeText: { fontSize: 11, fontWeight: '700', fontStyle: 'italic' }
});