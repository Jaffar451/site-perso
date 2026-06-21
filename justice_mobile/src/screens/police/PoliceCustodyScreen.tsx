import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, Platform, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { updateComplaint } from "../../services/complaint.service";

const MAX_GAV_HOURS = 48;
const FAMILY_NOTIFY_HOURS = 3;
const LAWYER_ACCESS_HOURS = 24;

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [{ text: "Annuler", style: "cancel" }, { text: "Confirmer", onPress: onConfirm, style: "destructive" }]);
  }
};

export default function PoliceCustodyScreen({ route, navigation }: PoliceScreenProps<'PoliceCustody'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { complaintId, suspectName = "Individu non identifié" } = route.params;

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [rightsNotified, setRightsNotified] = useState(false);
  const [familyNotified, setFamilyNotified] = useState(false);
  const [medicalExamRequested, setMedicalExamRequested] = useState(false);
  const [lawyerRequested, setLawyerRequested] = useState(false);
  const [prosecutorNotified, setProsecutorNotified] = useState(false);
  const [mealsLog, setMealsLog] = useState<string[]>([]);
  const [observations, setObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [elapsedHours, setElapsedHours] = useState(0);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
  };

  useEffect(() => {
    let interval: any;
    if (startTime) {
      interval = setInterval(() => {
        const diff = Date.now() - startTime.getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        setElapsedHours(diff / 3600000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  const getTimerColor = () => {
    if (!startTime) return colors.textSub;
    if (elapsedHours >= MAX_GAV_HOURS) return colors.danger;
    if (elapsedHours >= MAX_GAV_HOURS - 6) return colors.warning;
    return colors.success;
  };

  const getTimerStatus = () => {
    if (!startTime) return "EN ATTENTE";
    if (elapsedHours >= MAX_GAV_HOURS) return "DÉLAI LÉGAL DÉPASSÉ";
    if (elapsedHours >= MAX_GAV_HOURS - 6) return `ATTENTION : ${Math.ceil(MAX_GAV_HOURS - elapsedHours)}H RESTANTES`;
    return `${Math.ceil(MAX_GAV_HOURS - elapsedHours)}H RESTANTES SUR ${MAX_GAV_HOURS}H`;
  };

  const handleStartCustody = () => {
    if (!rightsNotified) {
      return alertMsg("Art. 71 CPP Niger", "La notification des droits est OBLIGATOIRE avant tout placement en garde à vue.");
    }
    if (!prosecutorNotified) {
      return alertMsg("Art. 69 CPP Niger", "Le Procureur de la République doit être informé immédiatement du placement en garde à vue.");
    }
    confirmAction(
      "Placement en Garde à Vue",
      `Confirmez le placement de ${suspectName} en GAV conformément aux Art. 69-75 du CPP Niger.\n\nDurée maximale : ${MAX_GAV_HOURS}h (renouvelable une fois sur autorisation du Procureur).`,
      () => setStartTime(new Date())
    );
  };

  const addMealLog = () => {
    const entry = `Repas servi à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    setMealsLog(prev => [...prev, entry]);
  };

  const handleSaveAndExit = async () => {
    if (!startTime) return alertMsg("Action Requise", "Vous devez débuter le délai avant de sceller le registre.");

    try {
      setIsSubmitting(true);
      await updateComplaint(Number(complaintId), {
        status: "garde_a_vue",
        custodyData: {
          startTime: startTime.toISOString(),
          rightsNotified,
          familyNotified,
          medicalExamRequested,
          lawyerRequested,
          prosecutorNotified,
          mealsLog,
          observations,
          maxDurationHours: MAX_GAV_HOURS,
          officerId: useAuthStore.getState().user?.id,
        }
      } as any);
      alertMsg("Registre Scellé ✅", "La procédure de Garde à Vue a été officiellement enregistrée conformément au CPP Niger.");
      navigation.popToTop();
    } catch (error) {
      alertMsg("Erreur", "Impossible de synchroniser le registre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SwitchRow = ({ label, sub, value, onChange, icon, required, disabled }: any) => (
    <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={value ? colors.success : colors.textSub} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.switchLabel, { color: colors.textMain }]}>
          {label} {required && <Text style={{ color: colors.danger }}>*</Text>}
        </Text>
        <Text style={[styles.switchSub, { color: colors.textSub }]}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "#CBD5E1", true: colors.success }} disabled={disabled} />
    </View>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Registre Garde à Vue" showBack />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* RÉFÉRENCE LÉGALE */}
          <View style={[styles.legalBox, { backgroundColor: isDark ? "#1a1a2e" : "#EFF6FF", borderColor: isDark ? "#1E40AF" : "#BFDBFE" }]}>
            <Ionicons name="book-outline" size={18} color="#1E40AF" />
            <Text style={[styles.legalText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
              Art. 69-75 CPP Niger — Durée max {MAX_GAV_HOURS}h, renouvelable une fois sur autorisation écrite du Procureur. Notification des droits obligatoire.
            </Text>
          </View>

          {/* SUSPECT */}
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.avatar, { backgroundColor: primaryColor + "15" }]}>
                <Ionicons name="person" size={28} color={primaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: primaryColor }]}>PRÉVENU</Text>
                <Text style={[styles.suspectName, { color: colors.textMain }]}>{suspectName}</Text>
                <Text style={[styles.caseId, { color: colors.textSub }]}>Dossier RG-#{complaintId}</Text>
              </View>
            </View>
          </View>

          {/* TIMER */}
          <View style={[styles.timerCard, { backgroundColor: colors.bgCard, borderColor: getTimerColor() }]}>
            <Text style={[styles.timerStatus, { color: getTimerColor() }]}>{getTimerStatus()}</Text>
            <Text style={[styles.timerValue, { color: getTimerColor() }]}>{elapsed}</Text>
            <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${Math.min((elapsedHours / MAX_GAV_HOURS) * 100, 100)}%`, backgroundColor: getTimerColor() }]} />
            </View>
            <Text style={[styles.timerLimit, { color: colors.textSub }]}>Limite légale : {MAX_GAV_HOURS}h00</Text>

            {!startTime ? (
              <TouchableOpacity style={[styles.startBtn, { backgroundColor: primaryColor }]} onPress={handleStartCustody}>
                <Ionicons name="play-circle" size={22} color="#FFF" />
                <Text style={styles.btnText}>DÉBUTER LA G.A.V</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.extendBtn} onPress={() => navigation.navigate("PoliceCustodyExtension", { complaintId: Number(complaintId), caseId: Number(complaintId), suspectName })}>
                <Ionicons name="time-outline" size={16} color="#EAB308" />
                <Text style={styles.extendText}>DEMANDER PROLONGATION AU PROCUREUR</Text>
              </TouchableOpacity>
            )}

            {/* ALERTES AUTOMATIQUES */}
            {startTime && elapsedHours >= FAMILY_NOTIFY_HOURS && !familyNotified && (
              <View style={[styles.alertBanner, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
                <Ionicons name="warning" size={16} color="#D97706" />
                <Text style={{ color: "#92400E", fontSize: 11, fontWeight: '700', flex: 1 }}>Art. 71 : La famille doit être notifiée (délai 3h dépassé)</Text>
              </View>
            )}
            {startTime && elapsedHours >= LAWYER_ACCESS_HOURS && !lawyerRequested && (
              <View style={[styles.alertBanner, { backgroundColor: "#FEE2E2", borderColor: "#EF4444" }]}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={{ color: "#991B1B", fontSize: 11, fontWeight: '700', flex: 1 }}>Art. 73 : L'accès à un avocat doit être autorisé (24h atteintes)</Text>
              </View>
            )}
            {startTime && elapsedHours >= MAX_GAV_HOURS && (
              <View style={[styles.alertBanner, { backgroundColor: "#FEE2E2", borderColor: "#EF4444" }]}>
                <Ionicons name="skull" size={16} color="#DC2626" />
                <Text style={{ color: "#991B1B", fontSize: 11, fontWeight: '800', flex: 1 }}>DÉLAI LÉGAL DÉPASSÉ — Libération ou prolongation obligatoire</Text>
              </View>
            )}
          </View>

          {/* FORMALITÉS OBLIGATOIRES */}
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>FORMALITÉS OBLIGATOIRES (CPP NIGER)</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <SwitchRow label="Notification des droits" sub="Art. 71 — Lecture faite au prévenu" value={rightsNotified} onChange={setRightsNotified} icon="shield-checkmark-outline" required disabled={!!startTime} />
            <SwitchRow label="Notification au Procureur" sub="Art. 69 — Information immédiate obligatoire" value={prosecutorNotified} onChange={setProsecutorNotified} icon="business-outline" required disabled={!!startTime} />
            <SwitchRow label="Notification à la famille" sub="Art. 71 — Dans un délai de 3 heures" value={familyNotified} onChange={setFamilyNotified} icon="people-outline" />
            <SwitchRow label="Examen médical" sub="Art. 72 — Réquisition médecin" value={medicalExamRequested} onChange={setMedicalExamRequested} icon="medkit-outline" />
            <SwitchRow label="Accès avocat" sub="Art. 73 — Autorisé après 24h de GAV" value={lawyerRequested} onChange={setLawyerRequested} icon="briefcase-outline" />
          </View>

          {/* REGISTRE REPAS/REPOS */}
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>REGISTRE REPAS & REPOS</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.addMealBtn, { borderColor: primaryColor }]} onPress={addMealLog}>
              <Ionicons name="restaurant-outline" size={18} color={primaryColor} />
              <Text style={{ color: primaryColor, fontWeight: '800', fontSize: 12 }}>ENREGISTRER REPAS / REPOS</Text>
            </TouchableOpacity>
            {mealsLog.map((entry, i) => (
              <Text key={i} style={[styles.mealEntry, { color: colors.textMain }]}>• {entry}</Text>
            ))}
            {mealsLog.length === 0 && <Text style={[styles.mealEntry, { color: colors.textSub }]}>Aucun enregistrement</Text>}
          </View>

          {/* OBSERVATIONS */}
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>OBSERVATIONS OPJ</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textMain }]}
            placeholder="Comportement du prévenu, incidents, remarques..."
            placeholderTextColor={colors.textSub}
            value={observations}
            onChangeText={setObservations}
            multiline numberOfLines={4} textAlignVertical="top"
          />

          {/* VALIDATION */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: startTime ? colors.success : colors.textSub, opacity: isSubmitting ? 0.6 : 1 }]}
            onPress={handleSaveAndExit}
            disabled={isSubmitting || !startTime}
          >
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="cloud-upload" size={20} color="#FFF" /><Text style={styles.btnText}>SCELLER ET SYNCHRONISER</Text></>
            )}
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  legalBox: { flexDirection: 'row', padding: 12, borderRadius: 12, borderLeftWidth: 4, marginBottom: 16, gap: 10, alignItems: 'center' },
  legalText: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  suspectName: { fontSize: 18, fontWeight: '900' },
  caseId: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  timerCard: { borderRadius: 20, padding: 24, borderWidth: 2, alignItems: 'center', marginBottom: 16 },
  timerStatus: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  timerValue: { fontSize: 42, fontWeight: '900', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  timerLimit: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  progressBg: { width: '100%', height: 6, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  startBtn: { marginTop: 16, height: 50, paddingHorizontal: 28, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  extendBtn: { marginTop: 16, height: 42, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: '#EAB308', flexDirection: 'row', alignItems: 'center', gap: 8 },
  extendText: { fontWeight: '800', fontSize: 10, color: '#EAB308' },
  alertBanner: { flexDirection: 'row', padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 10, gap: 8, alignItems: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  switchLabel: { fontSize: 14, fontWeight: '700' },
  switchSub: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  addMealBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, gap: 8, marginBottom: 8 },
  mealEntry: { fontSize: 12, fontWeight: '600', paddingVertical: 4 },
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, fontWeight: '600', marginBottom: 16 },
  saveBtn: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});
