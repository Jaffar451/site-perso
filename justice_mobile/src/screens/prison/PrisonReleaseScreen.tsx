import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import api from "../../services/api";

const alertMsg = (t: string, m: string) => { if (Platform.OS === "web") window.alert(`${t}\n\n${m}`); else Alert.alert(t, m); };

export default function PrisonReleaseScreen({ navigation }: any) {
  const { isDark } = useAppTheme();
  const primaryColor = "#F59E0B";
  const [incarcerationId, setIncarcerationId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC", bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B", textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0", inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  const handleRelease = async () => {
    if (!incarcerationId.trim()) return alertMsg("Champ requis", "Entrez le numéro d'écrou.");
    setLoading(true);
    try {
      await api.patch(`/incarcerations/${incarcerationId}/release`, { reason: reason.trim(), releaseDate: new Date().toISOString() });
      alertMsg("Levée d'Écrou ✅", "Le détenu a été libéré et le registre mis à jour.");
      navigation.goBack();
    } catch (error: any) {
      alertMsg("Erreur", error.response?.data?.message || "Impossible d'effectuer la levée d'écrou.");
    } finally { setLoading(false); }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Levée d'Écrou" showBack />
      <ScrollView style={{ backgroundColor: colors.bgMain }} contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>N° D'ÉCROU / ID INCARCÉRATION *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="key-outline" size={18} color={colors.textSub} />
              <TextInput style={[styles.input, { color: colors.textMain }]} value={incarcerationId} onChangeText={setIncarcerationId} placeholder="Ex: 42" placeholderTextColor={colors.textSub} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>MOTIF DE LIBÉRATION</Text>
            <TextInput style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
              value={reason} onChangeText={setReason} placeholder="Fin de peine, non-lieu, grâce présidentielle..." placeholderTextColor={colors.textSub} multiline numberOfLines={4} textAlignVertical="top" />
          </View>
        </View>
        <TouchableOpacity style={[styles.btn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]} onPress={handleRelease} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="exit-outline" size={20} color="#FFF" /><Text style={styles.btnText}>PROCÉDER À LA LEVÉE</Text></>}
        </TouchableOpacity>
        <View style={{ height: 120 }} />
      </ScrollView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: "900", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, height: 50, gap: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: "600" },
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 100, fontWeight: "600" },
  btn: { flexDirection: "row", height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", gap: 12 },
  btnText: { color: "#FFF", fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
});
