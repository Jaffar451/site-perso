import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import api from "../../services/api";

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === "web") window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function PrisonEntryScreen({ navigation }: any) {
  const { isDark } = useAppTheme();
  const primaryColor = "#7C3AED";
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstname: "", lastname: "", birthDate: "", gender: "M",
    nationality: "Nigérienne", cellNumber: "", observation: "",
    prisonId: 1,
  });

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  const handleSubmit = async () => {
    if (!form.firstname.trim() || !form.lastname.trim()) {
      return alertMsg("Champs requis", "Nom et prénom du détenu sont obligatoires.");
    }
    setLoading(true);
    try {
      await api.post("/incarcerations/entry", {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        birthDate: form.birthDate || null,
        gender: form.gender,
        nationality: form.nationality,
        cellNumber: form.cellNumber || null,
        observation: form.observation || null,
        prisonId: form.prisonId,
      });
      alertMsg("Écrou Enregistré ✅", `${form.lastname.toUpperCase()} ${form.firstname} a été mis(e) sous écrou.`);
      navigation.goBack();
    } catch (error: any) {
      alertMsg("Erreur", error.response?.data?.message || "Impossible d'enregistrer l'écrou.");
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, icon, ...props }: any) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name={icon || "text-outline"} size={18} color={colors.textSub} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.input, { color: colors.textMain }]}
          value={value} onChangeText={onChange}
          placeholder={placeholder} placeholderTextColor={colors.textSub}
          {...props}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Mise sous Écrou" showBack />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ backgroundColor: colors.bgMain }} contentContainerStyle={styles.scroll}>
          <View style={[styles.infoBox, { backgroundColor: isDark ? "#451a03" : "#FFFBEB", borderColor: "#F59E0B" }]}>
            <Ionicons name="warning-outline" size={20} color="#D97706" />
            <Text style={[styles.infoText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
              L'écrou est un acte juridique officiel. Toute inscription engage votre responsabilité.
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><InputField label="Prénom *" value={form.firstname} onChange={(t: string) => setForm(f => ({ ...f, firstname: t }))} placeholder="Prénom" icon="person-outline" /></View>
              <View style={{ flex: 1 }}><InputField label="Nom *" value={form.lastname} onChange={(t: string) => setForm(f => ({ ...f, lastname: t.toUpperCase() }))} placeholder="Nom" icon="person-outline" /></View>
            </View>

            {Platform.OS === "web" ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSub }]}>Date de Naissance</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.textSub} style={{ marginRight: 10 }} />
                  <input type="date" title="Date de naissance" value={form.birthDate} onChange={(e: any) => setForm(f => ({ ...f, birthDate: e.target.value }))}
                    style={{ flex: 1, fontSize: 15, border: "none", outline: "none", backgroundColor: "transparent", color: isDark ? "#FFF" : "#1E293B", fontFamily: "inherit", padding: "10px 0" } as any} />
                </View>
              </View>
            ) : (
              <InputField label="Date de Naissance" value={form.birthDate} onChange={(t: string) => setForm(f => ({ ...f, birthDate: t }))} placeholder="AAAA-MM-JJ" icon="calendar-outline" />
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textSub }]}>Genre</Text>
                <View style={styles.genderRow}>
                  {["M", "F"].map(g => (
                    <TouchableOpacity key={g} style={[styles.genderBtn, { backgroundColor: form.gender === g ? primaryColor : colors.inputBg, borderColor: form.gender === g ? primaryColor : colors.border }]} onPress={() => setForm(f => ({ ...f, gender: g }))}>
                      <Text style={{ color: form.gender === g ? "#FFF" : colors.textMain, fontWeight: "800" }}>{g === "M" ? "Homme" : "Femme"}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Nationalité" value={form.nationality} onChange={(t: string) => setForm(f => ({ ...f, nationality: t }))} placeholder="Nigérienne" icon="flag-outline" />
              </View>
            </View>

            <InputField label="N° Cellule" value={form.cellNumber} onChange={(t: string) => setForm(f => ({ ...f, cellNumber: t }))} placeholder="A-12" icon="grid-outline" />

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSub }]}>Observations</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
                value={form.observation} onChangeText={t => setForm(f => ({ ...f, observation: t }))}
                placeholder="Remarques, état de santé, signalements..." placeholderTextColor={colors.textSub}
                multiline numberOfLines={4} textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="lock-closed" size={20} color="#FFF" /><Text style={styles.submitText}>ENREGISTRER L'ÉCROU</Text></>
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
  infoBox: { flexDirection: "row", padding: 14, borderRadius: 14, borderLeftWidth: 4, marginBottom: 16, alignItems: "center", gap: 10 },
  infoText: { flex: 1, fontSize: 11, fontWeight: "600", lineHeight: 16 },
  formCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: "900", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontSize: 15, fontWeight: "600" },
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 100, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  genderRow: { flexDirection: "row", gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  submitBtn: { flexDirection: "row", height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", gap: 12 },
  submitText: { color: "#FFF", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
});
