// PATH: src/screens/police/PoliceCustodyScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Alert, Switch, Platform, ActivityIndicator, StatusBar,
  KeyboardAvoidingView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ Architecture & Store
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";

// ✅ UI Components
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ✅ Services
import { updateComplaint } from "../../services/complaint.service";

export default function PoliceCustodyScreen({ route, navigation }: PoliceScreenProps<'PoliceCustody'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  // 🛡️ Récupération sécurisée des paramètres
  const { complaintId, suspectName = "Individu non identifié" } = route.params;

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [rightsNotified, setRightsNotified] = useState(false);
  const [medicalExamRequested, setMedicalExamRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    divider: isDark ? "#334155" : "#F1F5F9",
    timerBg: isDark ? "#1E1B4B" : "#F8FAFC",
    timerBgActive: isDark ? "#450A0A" : "#FFF1F2",
    timerTextActive: "#EF4444"
  };

  /**
   * 🕒 GESTION DU CHRONOMÈTRE LÉGAL
   */
  useEffect(() => {
    let interval: any;
    if (startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        setElapsed(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  /**
   * ⚖️ DÉMARRAGE OFFICIEL DE LA G.A.V
   */
  const handleStartCustody = () => {
    if (!rightsNotified) {
      Alert.alert(
        "Procédure Incomplète", 
        "La loi exige la notification des droits avant le placement en cellule."
      );
      return;
    }
    
    Alert.alert(
      "Démarrage de la G.A.V",
      `Confirmez-vous le placement en garde à vue de ${suspectName} à cet instant précis ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: () => setStartTime(new Date()),
          style: "destructive" 
        }
      ]
    );
  };

  /**
   * 💾 ENREGISTREMENT ET MISE À JOUR DU DOSSIER
   */
  const handleSaveAndExit = async () => {
    if (!startTime) {
      return Alert.alert("Action Requise", "Vous devez débuter le délai avant de sceller le registre.");
    }

    try {
      setIsSubmitting(true);
      
      // Mise à jour de la plainte vers le statut G.A.V
      await updateComplaint(Number(complaintId), {
        status: "garde_a_vue",
        // @ts-ignore - On étend l'objet pour le backend
        custodyData: {
          startTime: startTime.toISOString(),
          rightsNotified,
          medicalExamRequested,
          officerId: useAuthStore.getState().user?.id
        }
      });

      Alert.alert("Registre Scellé ✅", "La procédure de Garde à Vue a été officiellement enregistrée.");
      navigation.popToTop(); // Retour au registre des enquêtes
    } catch (error) {
      Alert.alert("Erreur CID", "Impossible de synchroniser le registre avec le serveur central.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Registre Garde à Vue" showBack={true} />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
            
            {/* CARTE DU SUSPECT */}
            <View style={[styles.suspectCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.avatarBox, { backgroundColor: primaryColor + "15" }]}>
                <Ionicons name="person" size={30} color={primaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.suspectLabel, { color: primaryColor }]}>PRÉVENU EN CELLULE</Text>
                <Text style={[styles.suspectName, { color: colors.textMain }]}>{suspectName}</Text>
                <Text style={[styles.caseId, { color: colors.textSub }]}>DOSSIER RG-#{complaintId}</Text>
              </View>
            </View>

            {/* TIMER LÉGAL */}
            <View style={[
                styles.timerContainer, 
                { 
                    backgroundColor: startTime ? colors.timerBgActive : colors.timerBg,
                    borderColor: startTime ? colors.timerTextActive : colors.border 
                }
            ]}>
              <Text style={[styles.timerTitle, { color: startTime ? colors.timerTextActive : colors.textSub }]}>DÉLAI LÉGAL ÉCOULÉ</Text>
              <Text style={[styles.timerValue, { color: startTime ? colors.timerTextActive : colors.textSub }]}>{elapsed}</Text>
              
              {!startTime ? (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.startBtn, { backgroundColor: primaryColor }]} 
                  onPress={handleStartCustody}
                >
                  <Ionicons name="play-circle" size={22} color="#fff" />
                  <Text style={styles.btnText}>DÉBUTER LA G.A.V</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={styles.extendBtn} 
                  onPress={() => {
                    navigation.navigate("PoliceCustodyExtension", { 
                      complaintId: Number(complaintId), 
                      caseId: Number(complaintId),
                      suspectName: suspectName 
                    });
                  }}
                >
                  <Ionicons name="time-outline" size={16} color="#EAB308" style={{marginRight: 8}} />
                  <Text style={styles.extendText}>DEMANDER PROLONGATION</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ACTIONS PROCÉDURALES */}
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>FORMALITÉS OBLIGATOIRES</Text>

            <View style={[styles.switchRow, { borderBottomColor: colors.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.textMain }]}>Notification des Droits</Text>
                <Text style={[styles.switchSub, { color: colors.textSub }]}>Lecture faite à l'individu</Text>
              </View>
              <Switch 
                value={rightsNotified} 
                onValueChange={setRightsNotified} 
                trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                disabled={!!startTime} // Désactivé une fois lancé
              />
            </View>

            <View style={[styles.switchRow, { borderBottomColor: colors.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.textMain }]}>Examen Médical</Text>
                <Text style={[styles.switchSub, { color: colors.textSub }]}>Réquisition médecin effectuée</Text>
              </View>
              <Switch 
                value={medicalExamRequested} 
                onValueChange={setMedicalExamRequested} 
                trackColor={{ false: "#CBD5E1", true: primaryColor }} 
              />
            </View>

            {/* VALIDATION FINALE */}
            <TouchableOpacity 
                activeOpacity={0.8}
                style={[
                    styles.saveBtn, 
                    { 
                        backgroundColor: startTime ? "#10B981" : colors.textSub, 
                        opacity: isSubmitting ? 0.6 : 1 
                    }
                ]}
                onPress={handleSaveAndExit}
                disabled={isSubmitting || !startTime}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" style={{marginRight: 10}} />
                  <Text style={styles.btnText}>SCELLER ET SYNCHRONISER</Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { padding: 20, paddingBottom: 120 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 10 },
  suspectCard: { flexDirection: 'row', padding: 20, borderRadius: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1.5 },
  avatarBox: { width: 55, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  suspectLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  suspectName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  caseId: { fontSize: 12, fontWeight: "700", marginTop: 2, opacity: 0.7 },
  timerContainer: { padding: 30, borderRadius: 32, borderWidth: 2, alignItems: 'center', marginBottom: 30, borderStyle: 'dashed' },
  timerTitle: { fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1.2 },
  timerValue: { fontSize: 48, fontWeight: '900', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  startBtn: { marginTop: 20, height: 55, paddingHorizontal: 30, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5 },
  extendBtn: { marginTop: 20, height: 45, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: "#EAB308", justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  extendText: { fontWeight: '800', fontSize: 11, color: "#EAB308" },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  switchLabel: { fontSize: 16, fontWeight: '700' },
  switchSub: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  saveBtn: { marginTop: 35, height: 65, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', elevation: 4 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }
});