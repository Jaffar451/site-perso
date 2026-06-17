import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try { DateTimePicker = require("@react-native-community/datetimepicker").default; } catch {}
}

// ✅ Architecture
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { updateHearing } from "../../services/hearing.service";

export default function ClerkAdjournHearingScreen({ navigation, route }: ClerkScreenProps<'ClerkAdjournHearing'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary; 
  
  const params = route.params as any; 
  const hearingId = params?.hearingId;
  const caseNumber = params?.caseNumber;

  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [nextDate, setNextDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
    warningBg: isDark ? "#432706" : "#FFFBEB",
    warningText: isDark ? "#FBBF24" : "#92400E",
  };

  const motifsRapides = [
    "Absence des parties",
    "Demande de la défense",
    "Production de pièces",
    "Composition de la Cour",
    "Délibéré prorogé"
  ];

  const handleAdjourn = async () => {
    if (!reason.trim()) {
      const msg = "Veuillez indiquer ou sélectionner le motif du renvoi.";
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Champ requis", msg);
      return;
    }

    setLoading(true);
    try {
      await updateHearing(Number(hearingId), {
        status: "adjourned",
        date: nextDate.toISOString(),
        notes: `Motif officiel: ${reason}\n\nObservations additionnelles: ${notes}`
      });
      
      if (Platform.OS === 'web') {
        window.alert("✅ PV de renvoi enregistré au registre.");
        navigation.goBack();
      } else {
        Alert.alert("PV Enregistré", "Le renvoi a été acté dans le registre numérique.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert("Erreur\n\nÉchec de la synchronisation avec le serveur du Greffe.");
      else Alert.alert("Erreur", "Échec de la synchronisation avec le serveur du Greffe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Renvoi RG #${caseNumber || 'N/A'}`} showBack />

      <ScrollView 
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ℹ️ BANDEAU D'INFORMATION */}
        <View style={[styles.infoCard, { backgroundColor: colors.warningBg, borderColor: isDark ? "#92400E" : "#F59E0B" }]}>
          <Ionicons name="document-text-outline" size={24} color={colors.warningText} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.warningText }]}>Procès-Verbal de Renvoi</Text>
            <Text style={[styles.infoText, { color: colors.warningText }]}>
              L'enregistrement de cet acte mettra à jour le calendrier des parties et des avocats.
            </Text>
          </View>
        </View>

        {/* 🏷️ MOTIF DU RENVOI */}
        <Text style={[styles.label, { color: colors.textSub }]}>MOTIF DU RENVOI (SÉLECTION RAPIDE)</Text>
        <View style={styles.chipContainer}>
          {motifsRapides.map((m) => {
            const isActive = reason === m;
            return (
              <TouchableOpacity 
                key={m}
                activeOpacity={0.8}
                style={[
                  styles.chip, 
                  { 
                    borderColor: primaryColor, 
                    backgroundColor: isActive ? primaryColor : (isDark ? colors.bgCard : "transparent") 
                  }
                ]}
                onPress={() => setReason(m)}
              >
                <Text style={[styles.chipText, { color: isActive ? "#FFF" : primaryColor }]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
          placeholder="Ou précisez un autre motif ici..."
          placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
          value={reason}
          onChangeText={setReason}
        />

        {/* 📅 PROCHAINE DATE */}
        <Text style={[styles.label, { color: colors.textSub, marginTop: 25 }]}>DATE DE LA PROCHAINE AUDIENCE</Text>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.datePickerBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]} 
          onPress={() => setShowDatePicker(true)}
        >
          <View style={[styles.dateIconBox, { backgroundColor: primaryColor }]}>
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={[styles.dateLabel, { color: colors.textSub }]}>Fixée au :</Text>
            <Text style={[styles.dateValue, { color: colors.textMain }]}>
              {nextDate.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textSub} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
          <DateTimePicker
            value={nextDate}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_event: any, date: any) => {
              setShowDatePicker(false);
              if (date) setNextDate(date);
            }}
          />
        )}
        {Platform.OS === 'web' && showDatePicker && (
          <input
            type="date"
            title="Date de renvoi"
            value={nextDate.toISOString().split('T')[0]}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e: any) => { if (e.target.value) { setNextDate(new Date(e.target.value)); setShowDatePicker(false); } }}
            style={{ fontSize: 15, padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', width: '100%', marginBottom: 10, backgroundColor: 'transparent', color: isDark ? '#FFF' : '#1E293B' } as any}
          />
        )}

        {/* ✍️ OBSERVATIONS */}
        <Text style={[styles.label, { color: colors.textSub, marginTop: 25 }]}>NOTES DU GREFFIER (ACTE DE PROCÉDURE)</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
          placeholder="Détails sur la production de conclusions, pièces manquantes..."
          placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

        {/* 🚀 VALIDATION */}
        <TouchableOpacity 
          activeOpacity={0.85}
          style={[styles.submitBtn, { backgroundColor: primaryColor }]}
          onPress={handleAdjourn}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Text style={styles.submitBtnText}>VALIDER LE RENVOI</Text>
              <Ionicons name="send" size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  infoCard: { flexDirection: "row", gap: 12, padding: 18, borderRadius: 16, marginBottom: 25, borderLeftWidth: 5 },
  infoTitle: { fontWeight: "900", fontSize: 13, textTransform: 'uppercase', marginBottom: 2 },
  infoText: { fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 18 },
  
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 11, fontWeight: "800" },
  
  input: { borderWidth: 1.5, borderRadius: 14, padding: 16, fontSize: 15, fontWeight: '600' },
  
  datePickerBtn: { flexDirection: "row", alignItems: "center", gap: 15, padding: 16, borderWidth: 1.5, borderRadius: 14 },
  dateIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dateLabel: { fontSize: 9, fontWeight: "800", textTransform: 'uppercase' },
  dateValue: { fontSize: 14, fontWeight: "700" },
  
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 16, minHeight: 120, fontSize: 15, fontWeight: '600' },
  
  submitBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12, 
    padding: 20, 
    borderRadius: 20, 
    marginTop: 35,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  submitBtnText: { color: "#FFF", fontWeight: "900", fontSize: 14, letterSpacing: 1 }
});