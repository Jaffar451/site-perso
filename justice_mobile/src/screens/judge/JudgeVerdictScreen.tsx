// PATH: src/screens/judge/JudgeVerdictScreen.tsx
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ Architecture & Theme
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { JudgeScreenProps } from "../../types/navigation";

// ✅ UI Components
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';

// ✅ Services
import { updateComplaint } from '../../services/complaint.service';

export default function JudgeVerdictScreen({ route, navigation }: JudgeScreenProps<'JudgeVerdict'>) {
  const { isDark } = useAppTheme();
  
  // ✅ Identité Cabinet d'Instruction
  const JUDGE_ACCENT = "#7C3AED"; 
  const { user } = useAuthStore(); 
  
  // Récupération sécurisée du dossier
  const { caseId } = route.params;

  const [verdictType, setVerdictType] = useState<'CONDAMNATION' | 'RELAXE' | 'NON_LIEU' | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  /**
   * ✍️ VALIDATION DU JUGEMENT
   */
  const handleSubmit = async () => {
    if (!verdictType) {
      const msg = "Le dispositif (Condamnation, Relaxe ou Non-lieu) est obligatoire.";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Verdict requis", msg);
      return;
    }
    
    if (comments.trim().length < 30) {
      const msg = "La minute doit être motivée en fait et en droit (min. 30 car.).";
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert("Motivation insuffisante", msg);
      return;
    }
    
    const title = "Prononcé du Verdict ⚖️";
    const msg = `Ce jugement sera immédiatement notifié aux parties et au Greffe. Confirmez-vous la signature ?`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) executeSubmit();
    } else {
        Alert.alert(title, msg, [
          { text: "Réviser", style: "cancel" },
          { text: "Signer le Verdict", style: verdictType === 'CONDAMNATION' ? "destructive" : "default", onPress: executeSubmit }
        ]);
    }
  };

  const executeSubmit = async () => {
    setLoading(true);
    try {
      const finalStatus = verdictType === 'NON_LIEU' ? 'non_lieu' : 'jugée';
      
      // ✅ Enregistrement du verdict dans le dossier
      await updateComplaint(caseId, { 
        status: finalStatus,
        verdictDetails: {
            type: verdictType,
            motivation: comments.trim(),
            signedBy: `Juge ${user?.lastname}`,
            judgeSignature: `J-VERDICT-${user?.id}-${Date.now()}`,
            date: new Date().toISOString(),
            jurisdiction: "Tribunal de Grande Instance"
        }
      } as any);

      if (Platform.OS === 'web') window.alert("✅ Jugement rendu et scellé.");
      else Alert.alert("Justice Rendue", "Le verdict a été prononcé et l'acte scellé numériquement.");
      
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Erreur Technique", "Le scellage de la décision a échoué.");
    } finally {
      setLoading(false);
    }
  };

  const getOptionColor = (type: string) => {
    // Couleurs sémantiques fortes pour guider la décision
    if (verdictType !== type && verdictType !== null) return isDark ? "#334155" : "#F1F5F9";
    switch(type) {
        case 'CONDAMNATION': return "#EF4444"; 
        case 'RELAXE': return "#10B981";       
        case 'NON_LIEU': return "#64748B";     
        default: return JUDGE_ACCENT;
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Prononcé du Verdict" showBack />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 🏛️ RÉFÉRENCE DU DOSSIER */}
          <View style={[styles.headerInfo, { borderLeftColor: JUDGE_ACCENT }]}>
              <Text style={[styles.caseRef, { color: JUDGE_ACCENT }]}>MINUTE DU DOSSIER RP-{caseId}/26</Text>
              <Text style={[styles.label, { color: colors.textMain }]}>Dispositif du Jugement</Text>
          </View>

          

          {/* SÉLECTEUR DE VERDICT */}
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>Sens de la Décision *</Text>
          <View style={styles.optionsRow}>
            {(['CONDAMNATION', 'RELAXE', 'NON_LIEU'] as const).map((type) => {
              const isActive = verdictType === type;
              const activeColor = getOptionColor(type);
              
              let iconName: any = "archive-outline";
              if (type === 'CONDAMNATION') iconName = "hammer-outline";
              if (type === 'RELAXE') iconName = "shield-checkmark-outline";

              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.8}
                  style={[
                    styles.optionBtn,
                    { 
                      borderColor: isActive ? activeColor : colors.border,
                      backgroundColor: isActive ? activeColor : colors.bgCard,
                      transform: isActive ? [{scale: 1.05}] : []
                    }
                  ]}
                  onPress={() => setVerdictType(type)}
                >
                  <Ionicons 
                    name={iconName} 
                    size={26} 
                    color={isActive ? '#fff' : colors.textSub} 
                  />
                  <Text style={[
                      styles.optionText, 
                      { color: isActive ? '#fff' : colors.textSub }
                  ]}>
                      {type === 'NON_LIEU' ? 'NON-LIEU' : type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RÉDACTION DE LA MINUTE */}
          <Text style={[styles.sectionLabel, { color: colors.textSub, marginTop: 40 }]}>
            Motifs de la Décision (Attendu que...) *
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
            multiline
            numberOfLines={12}
            placeholder="Énoncez les motifs de fait et de droit justifiant ce dispositif..."
            placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
            textAlignVertical="top"
            value={comments}
            onChangeText={setComments}
          />

          {/* 🚀 BOUTON DE SIGNATURE */}
          <TouchableOpacity 
            activeOpacity={0.85}
            style={[
              styles.submitBtn, 
              { backgroundColor: verdictType ? getOptionColor(verdictType) : JUDGE_ACCENT },
              loading && { opacity: 0.7 }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <>
                  <Ionicons name="ribbon-outline" size={24} color="#fff" />
                  <Text style={styles.submitText}>SCELLER ET RENDRE LE JUGEMENT</Text>
                </>
            )}
          </TouchableOpacity>

          <View style={[styles.legalNoticeBox, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }]}>
              <Ionicons name="finger-print-outline" size={20} color={colors.textSub} />
              <Text style={[styles.legalNotice, { color: colors.textSub }]}>
                Cette décision est signée numériquement par le Magistrat et transmise instantanément au Casier Judiciaire National.
              </Text>
          </View>
          
          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { padding: 22 },
  headerInfo: { marginBottom: 35, borderLeftWidth: 8, paddingLeft: 20, paddingVertical: 5 },
  caseRef: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  label: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  sectionLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1, marginLeft: 4 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  optionBtn: { flex: 1, height: 110, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 2, elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  optionText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  textArea: { borderRadius: 24, padding: 22, marginTop: 5, minHeight: 300, fontSize: 16, lineHeight: 26, fontWeight: '500', borderWidth: 1.5 },
  submitBtn: { 
    height: 68, 
    marginTop: 45, 
    borderRadius: 22, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  submitText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  legalNoticeBox: { flexDirection: 'row', marginTop: 40, gap: 15, padding: 20, borderRadius: 20, alignItems: 'center' },
  legalNotice: { flex: 1, fontSize: 11, fontStyle: 'italic', lineHeight: 18, fontWeight: '600' }
});