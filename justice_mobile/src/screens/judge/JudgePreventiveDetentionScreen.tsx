// PATH: src/screens/judge/JudgePreventiveDetentionScreen.tsx
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
  Modal,
  FlatList,
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
import { updateComplaint, transitionComplaint } from "../../services/complaint.service";

// Configuration des établissements pénitentiaires (Référentiel Niger)
const PRISONS = [
  { id: "niamey_civil", name: "Maison d'Arrêt de Niamey (Civile)" },
  { id: "koutoukale", name: "Prison de Haute Sécurité (Koutoukalé)" },
  { id: "say", name: "Maison d'Arrêt de Say" },
  { id: "kollo", name: "Maison d'Arrêt de Kollo" },
  { id: "tillaberi", name: "Maison d'Arrêt de Tillabéri" },
  { id: "ouallam", name: "Maison d'Arrêt de Ouallam" },
];

export default function JudgePreventiveDetentionScreen({ route, navigation }: JudgeScreenProps<'JudgePreventiveDetention'>) {
  const { isDark } = useAppTheme();
  
  // ✅ Identité Cabinet d'Instruction
  const JUDGE_ACCENT = "#7C3AED"; 
  const { user } = useAuthStore();
  
  // Récupération sécurisée des paramètres
  const { caseId, personName = "Le Prévenu" } = route.params;

  const [selectedPrison, setSelectedPrison] = useState<typeof PRISONS[0] | null>(null);
  const [duration, setDuration] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    alertBg: isDark ? "#450A0A" : "#FEF2F2",
    alertText: isDark ? "#FCA5A5" : "#EF4444",
  };

  /**
   * ✍️ VALIDATION DU MANDAT DE DÉPÔT
   */
  const handleIssueDetention = async () => {
    if (!selectedPrison || !reason.trim() || !duration) {
      const msg = "L'établissement, la durée et les motifs sont obligatoires pour la validité du mandat.";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Données manquantes", msg);
      return;
    }

    const title = "MANDAT DE DÉPÔT ⚖️";
    const msg = `Vous ordonnez l'incarcération immédiate de ${personName.toUpperCase()} à la ${selectedPrison.name}. Confirmer ?`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) executeDetention();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Signer le Mandat", style: "destructive", onPress: executeDetention },
        ]);
    }
  };

  const executeDetention = async () => {
    setLoading(true);
    try {
      // ✅ Enregistrement des détails de détention
      await updateComplaint(Number(caseId), {
        detentionDetails: {
          prisonId: selectedPrison?.id,
          prisonName: selectedPrison?.name,
          durationEstimated: duration,
          reason: reason.trim(),
          issuedAt: new Date().toISOString(),
          judgeSignature: `J-SIG-${user?.id}-${caseId}`
        }
      } as any);

      // ✅ Mise à jour du statut : Passage en détention provisoire
      await transitionComplaint(Number(caseId), "detention_provisoire"); 

      if (Platform.OS === 'web') window.alert("✅ Mandat de dépôt signé et transmis au Greffe.");
      else Alert.alert("Incarcération Validée", "Le mandat de dépôt a été signé numériquement. L'ordre d'écrou est transmis au Chef de l'établissement pénitentiaire.");
      
      navigation.navigate("JudgeHome"); 
    } catch (error) {
      Alert.alert("Erreur Système", "Impossible de sceller le mandat numérique.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Mandat de Dépôt" showBack={true} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 🚨 CARTE D'IDENTITÉ JUDICIAIRE DU PRÉVENU */}
          <View style={[styles.suspectCard, { backgroundColor: colors.alertBg, borderColor: colors.alertText }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? "#7F1D1D" : "#FEE2E2" }]}>
              <Ionicons name="lock-closed" size={28} color={colors.alertText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.labelSmall, { color: colors.alertText }]}>INCARCÉRATION IMMÉDIATE</Text>
              <Text style={[styles.suspectName, { color: colors.textMain }]}>{personName.toUpperCase()}</Text>
              <Text style={[styles.caseIdText, { color: colors.textSub }]}>Instruction N° RP-{caseId}/26</Text>
            </View>
          </View>

          

          {/* SÉLECTEUR D'ÉTABLISSEMENT */}
          <Text style={[styles.label, { color: colors.textSub }]}>Lieu de détention *</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.selector, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={() => setModalVisible(true)}
          >
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
              <Ionicons name="business" size={22} color={selectedPrison ? JUDGE_ACCENT : colors.textSub} />
              <Text style={{ color: selectedPrison ? colors.textMain : colors.textSub, fontSize: 15, fontWeight: '700' }}>
                {selectedPrison ? selectedPrison.name : "Sélectionner la Maison d'Arrêt"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textSub} />
          </TouchableOpacity>

          {/* DURÉE */}
          <Text style={[styles.label, { color: colors.textSub }]}>Durée du titre de détention (Mois) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Ex: 6"
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />

          {/* MOTIVATION JURIDIQUE */}
          <Text style={[styles.label, { color: colors.textSub }]}>Motifs de droit et de fait *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Attendu que l'inculpé présente un risque de fuite avéré... Attendu la gravité des faits..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            multiline
            numberOfLines={6}
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />

          {/* AVERTISSEMENT LÉGAL */}
          <View style={[styles.legalWarning, { backgroundColor: isDark ? "#431407" : "#FFF7ED", borderColor: isDark ? "#9A3412" : "#F59E0B" }]}>
            <Ionicons name="alert-circle" size={24} color={isDark ? "#FB923C" : "#EA580C"} />
            <Text style={[styles.legalText, { color: isDark ? "#FB923C" : "#9A3412" }]}>
              Attention : La signature de ce mandat entraîne la privation de liberté immédiate de l'individu.
            </Text>
          </View>

          {/* 🚀 BOUTON DE SIGNATURE */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.detainBtn, { backgroundColor: "#EF4444" }, loading && { opacity: 0.7 }]}
            onPress={handleIssueDetention}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={24} color="#FFF" />
                <Text style={styles.detainBtnText}>SIGNER LE MANDAT DE DÉPÔT</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL SÉLECTION PRISON */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>ÉTABLISSEMENTS PÉNITENTIAIRES</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color={colors.textSub} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PRISONS}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedPrison(item);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="business-outline" size={22} color={JUDGE_ACCENT} style={{ marginRight: 15 }} />
                  <Text style={[styles.modalItemText, { color: colors.textMain }]}>{item.name}</Text>
                  {selectedPrison?.id === item.id && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  suspectCard: { flexDirection: "row", alignItems: "center", padding: 22, borderRadius: 24, borderWidth: 2, marginBottom: 35 },
  iconCircle: { width: 58, height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 18 },
  labelSmall: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 5 },
  suspectName: { fontSize: 21, fontWeight: "900", letterSpacing: -0.5 },
  caseIdText: { fontSize: 14, marginTop: 4, fontWeight: '700' },
  
  label: { fontSize: 11, fontWeight: "900", marginBottom: 12, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  selector: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderRadius: 18, borderWidth: 1.5 },
  input: { borderRadius: 18, padding: 18, borderWidth: 1.5, fontSize: 16, fontWeight: '600', marginBottom: 5 },
  textArea: { height: 160, lineHeight: 24 },
  
  legalWarning: { flexDirection: "row", marginTop: 40, padding: 20, borderRadius: 20, alignItems: "center", gap: 15, borderWidth: 1.5, borderStyle: 'dashed' },
  legalText: { fontSize: 12, flex: 1, fontStyle: "italic", fontWeight: '700', lineHeight: 18 },
  
  detainBtn: { 
    flexDirection: "row", 
    height: 68, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 40, 
    gap: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  detainBtnText: { color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: "75%", padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 15, borderBottomWidth: 1 },
  modalTitle: { fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  modalItem: { flexDirection: "row", alignItems: "center", paddingVertical: 22, borderBottomWidth: 1 },
  modalItemText: { fontSize: 16, fontWeight: '700', flex: 1 },
});