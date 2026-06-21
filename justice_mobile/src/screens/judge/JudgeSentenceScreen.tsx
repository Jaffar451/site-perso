// PATH: src/screens/judge/JudgeSentenceScreen.tsx
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
import { createDecision } from "../../services/decision.service";

export default function JudgeSentenceScreen({ route, navigation }: JudgeScreenProps<'JudgeSentence'>) {
  const { theme, isDark } = useAppTheme();
  
  // ✅ Identité Cabinet d'Instruction
  const JUDGE_ACCENT = "#7C3AED"; 
  const { user } = useAuthStore();
  
  // Récupération sécurisée du dossier
  // Note: Ce paramètre est optionnel ici car on peut arriver via le calendrier
  const params = route.params as any;
  const { caseId } = params || { caseId: "N/A" };

  const [verdict, setVerdict] = useState<"condamnation" | "relaxe">("condamnation");
  const [sentenceLength, setSentenceLength] = useState("");
  const [fineAmount, setFineAmount] = useState("");
  const [motivations, setMotivations] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    headerLine: isDark ? "#334155" : "#F1F5F9",
  };

  /**
   * ✍️ SIGNATURE DU JUGEMENT
   */
  const handleFinalizeSentence = async () => {
    if (!motivations.trim() || motivations.trim().length < 20) {
      const msg = "Le délibéré doit être motivé en fait et en droit (min. 20 car.).";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Motivation insuffisante", msg);
      return;
    }

    if (verdict === "condamnation" && !sentenceLength.trim()) {
      if (Platform.OS === 'web') window.alert("Précision requise\n\nVeuillez spécifier la durée de la peine d'emprisonnement.");
      else Alert.alert("Précision requise", "Veuillez spécifier la durée de la peine d'emprisonnement.");
      return;
    }

    const title = "Prononcé du Jugement ⚖️";
    const msg = `Vous êtes sur le point de rendre un verdict de ${verdict.toUpperCase()}. Cette décision clôture l'instance. Confirmer ?`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) executePublish();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Signer la Minute", style: verdict === "condamnation" ? "destructive" : "default", onPress: executePublish },
        ]);
    }
  };

  const executePublish = async () => {
    setLoading(true);
    try {
      const payload = {
        caseId: Number(caseId),
        verdict: verdict.toUpperCase(),
        content: motivations.trim(),
        sentenceDetails: verdict === "condamnation" ? {
          length: sentenceLength.trim(),
          fine: fineAmount.trim() || "0"
        } : null,
        signedBy: `${user?.firstname} ${user?.lastname}`,
        judgeSignature: `J-DEC-${user?.id}-${Date.now()}`,
        date: new Date().toISOString(),
      };

      // Enregistrement via le service de décision
      await createDecision(payload as any);
      
      const successMsg = "Le jugement a été scellé et versé aux minutes du Greffe.";
      
      if (Platform.OS === 'web') window.alert(`✅ ${successMsg}`);
      else Alert.alert("Justice Rendue", successMsg);
      
      navigation.popToTop(); 
    } catch (error) {
      if (Platform.OS === 'web') window.alert("Erreur de Scellage\n\nImpossible d'enregistrer la décision sur le serveur.");
      else Alert.alert("Erreur de Scellage", "Impossible d'enregistrer la décision sur le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Prononcé de Peine" showBack={true} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 🏛️ ENTÊTE DU CABINET */}
          <View style={[styles.caseHeader, { borderColor: colors.headerLine }]}>
            <Text style={[styles.caseTitle, { color: colors.textMain }]}>Minute N° {caseId}/26</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="ribbon" size={14} color={JUDGE_ACCENT} style={{ marginRight: 6 }} />
                <Text style={[styles.caseSubtitle, { color: colors.textSub }]}>
                  Magistrat : M. le Juge {user?.lastname?.toUpperCase()}
                </Text>
            </View>
          </View>

          {/* 📚 RÉFÉRENCE LÉGALE CPP */}
          <View style={{ flexDirection: 'row', padding: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: JUDGE_ACCENT, marginBottom: 16, gap: 10, alignItems: 'center', backgroundColor: isDark ? '#1a1a2e' : '#EFF6FF', borderWidth: 1, borderColor: isDark ? '#1E40AF' : '#BFDBFE' }}>
            <Ionicons name="book-outline" size={18} color={isDark ? '#93C5FD' : '#1E40AF'} />
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16, color: isDark ? '#93C5FD' : '#1E40AF' }}>
              Art. 270-290 CPP Niger — Le jugement doit être motivé en fait et en droit. La peine prononcée ne peut excéder le maximum prévu par le Code Pénal. Le condamné dispose d'un délai de 10 jours pour interjeter appel.
            </Text>
          </View>

          {/* SÉLECTEUR DE VERDICT */}
          <Text style={[styles.label, { color: colors.textSub }]}>Sens du Jugement *</Text>
          <View style={styles.verdictRow}>
            {(["condamnation", "relaxe"] as const).map((type) => {
              const isSelected = verdict === type;
              // Rouge pour condamnation, Vert pour relaxe
              const activeColor = type === "relaxe" ? "#10B981" : "#EF4444";
              
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.85}
                  onPress={() => setVerdict(type)}
                  style={[
                    styles.verdictBtn,
                    { 
                      backgroundColor: isSelected ? activeColor : colors.bgCard,
                      borderColor: isSelected ? activeColor : colors.border 
                    },
                  ]}
                >
                  <Ionicons 
                    name={type === "relaxe" ? "shield-checkmark" : "hammer"} 
                    size={28} 
                    color={isSelected ? "#FFF" : colors.textSub} 
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={[styles.verdictBtnText, { color: isSelected ? "#FFF" : colors.textSub }]}>
                    {type === "relaxe" ? "RELAXE" : "CONDAMNATION"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DÉTAILS DE LA PEINE (Si Condamnation) */}
          {verdict === "condamnation" && (
            <View style={styles.sentenceForm}>
              <Text style={[styles.label, { color: colors.textSub }]}>Quantum de la peine *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
                placeholder="Ex: 2 ans d'emprisonnement ferme"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={sentenceLength}
                onChangeText={setSentenceLength}
              />

              <Text style={[styles.label, { color: colors.textSub }]}>Amende (FCFA)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
                placeholder="Ex: 500 000"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                keyboardType="numeric"
                value={fineAmount}
                onChangeText={setFineAmount}
              />
            </View>
          )}

          {/* MOTIVATION JURIDIQUE */}
          <Text style={[styles.label, { color: colors.textSub }]}>Motifs de la Décision *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Par ces motifs, le Tribunal statuant publiquement, contradictoirement..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
            value={motivations}
            onChangeText={setMotivations}
          />

          {/* BOUTON DE SIGNATURE */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.finalBtn, 
              { backgroundColor: verdict === 'condamnation' ? '#EF4444' : JUDGE_ACCENT }, 
              loading && { opacity: 0.7 }
            ]}
            onPress={handleFinalizeSentence}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="ribbon-outline" size={24} color="#FFF" />
                <Text style={styles.finalBtnText}>SCELLER LE JUGEMENT</Text>
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
  caseHeader: { marginBottom: 25, borderBottomWidth: 1, paddingBottom: 15 },
  caseTitle: { fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  caseSubtitle: { fontSize: 13, fontWeight: "700" },
  
  label: { fontSize: 11, fontWeight: "900", marginBottom: 10, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  verdictRow: { flexDirection: "row", gap: 15, marginBottom: 15 },
  verdictBtn: { flex: 1, height: 110, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 2, elevation: 2 },
  verdictBtnText: { fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  
  sentenceForm: { marginTop: 5 },
  input: { borderRadius: 18, padding: 18, borderWidth: 1.5, fontSize: 16, fontWeight: '600' },
  textArea: { height: 250, lineHeight: 24 },
  
  finalBtn: { 
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
  finalBtnText: { color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
});