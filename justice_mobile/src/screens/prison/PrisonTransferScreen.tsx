import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import api from "../../services/api";

const alertMsg = (t: string, m: string) => { if (Platform.OS === "web") window.alert(`${t}\n\n${m}`); else Alert.alert(t, m); };

export default function PrisonTransferScreen({ navigation }: any) {
  const { isDark } = useAppTheme();
  const primaryColor = "#8B5CF6";
  const [incarcerationId, setIncarcerationId] = useState("");
  const [targetPrisonId, setTargetPrisonId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC", bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B", textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0", inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  const { data: prisons } = useQuery({
    queryKey: ["prisons-list"],
    queryFn: async () => { const res = await api.get("/prisons"); return res.data?.data || res.data || []; },
  });

  const handleTransfer = async () => {
    if (!incarcerationId.trim() || !targetPrisonId) return alertMsg("Champs requis", "ID d'écrou et établissement de destination requis.");
    setLoading(true);
    try {
      await api.post(`/incarcerations/${incarcerationId}/transfer`, { targetPrisonId, reason: reason.trim() });
      alertMsg("Transfert Enregistré ✅", "L'ordre de transfèrement a été émis.");
      navigation.goBack();
    } catch (error: any) {
      alertMsg("Erreur", error.response?.data?.message || "Impossible d'effectuer le transfert.");
    } finally { setLoading(false); }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Transfert de Détenu" showBack />
      <ScrollView style={{ backgroundColor: colors.bgMain }} contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>N° D'ÉCROU / ID INCARCÉRATION *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="key-outline" size={18} color={colors.textSub} />
              <TextInput style={[styles.input, { color: colors.textMain }]} value={incarcerationId} onChangeText={setIncarcerationId} placeholder="Ex: 42" placeholderTextColor={colors.textSub} keyboardType="numeric" />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSub }]}>ÉTABLISSEMENT DE DESTINATION *</Text>
          <View style={styles.prisonList}>
            {(Array.isArray(prisons) ? prisons : []).map((p: any) => (
              <TouchableOpacity key={p.id} style={[styles.prisonItem, { backgroundColor: targetPrisonId === p.id ? primaryColor : colors.inputBg, borderColor: targetPrisonId === p.id ? primaryColor : colors.border }]} onPress={() => setTargetPrisonId(p.id)}>
                <Ionicons name="business-outline" size={18} color={targetPrisonId === p.id ? "#FFF" : colors.textMain} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: targetPrisonId === p.id ? "#FFF" : colors.textMain, fontWeight: "700", fontSize: 14 }}>{p.name}</Text>
                  <Text style={{ color: targetPrisonId === p.id ? "rgba(255,255,255,0.7)" : colors.textSub, fontSize: 11 }}>{p.city}</Text>
                </View>
                {targetPrisonId === p.id && <Ionicons name="checkmark-circle" size={22} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>MOTIF DU TRANSFERT</Text>
            <TextInput style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textMain }]}
              value={reason} onChangeText={setReason} placeholder="Surpopulation, rapprochement familial, sécurité..." placeholderTextColor={colors.textSub} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]} onPress={handleTransfer} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="swap-horizontal" size={20} color="#FFF" /><Text style={styles.btnText}>ÉMETTRE L'ORDRE DE TRANSFÈREMENT</Text></>}
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
  textArea: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 14, minHeight: 80, fontWeight: "600" },
  prisonList: { gap: 8, marginBottom: 16 },
  prisonItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 12 },
  btn: { flexDirection: "row", height: 58, borderRadius: 18, justifyContent: "center", alignItems: "center", gap: 12 },
  btnText: { color: "#FFF", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
});
