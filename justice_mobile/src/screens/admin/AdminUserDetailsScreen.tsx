import React, { useMemo, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  Switch, 
  StatusBar, 
  Platform
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ✅ Architecture & Thème
import { useAppTheme } from "../../theme/AppThemeProvider";
import { getUserById, deleteUser, updateUser, UserData } from "../../services/user.service";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// ─── Sous-composant InfoRow ───────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, primaryColor, isLast, colors }: any) => (
  <View style={[
    styles.infoRowInternal,
    { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: colors.border }
  ]}>
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={primaryColor} />
      <Text style={[styles.infoLabel, { color: colors.textSub }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { color: colors.textMain }]}>{value || "—"}</Text>
  </View>
);

// ─── Sous-composant SectionHeader ────────────────────────────────────────────
const SectionHeader = ({ title, colors }: any) => (
  <Text style={[styles.sectionTitle, { color: colors.textSub }]}>{title}</Text>
);

export default function AdminUserDetailsScreen() {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();

  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ Validation userId
  const userId = useMemo(() => {
    const id = route.params?.userId || route.params?.id;
    return (id && !isNaN(Number(id))) ? Number(id) : null;
  }, [route.params]);

  // 🎨 Palette dynamique
  const colors = {
    bgMain:       isDark ? "#0F172A" : "#F8FAFC",
    bgCard:       isDark ? "#1E293B" : "#FFFFFF",
    textMain:     isDark ? "#FFFFFF" : "#1E293B",
    textSub:      isDark ? "#94A3B8" : "#64748B",
    border:       isDark ? "#334155" : "#E2E8F0",
    dangerBg:     isDark ? "#450A0A" : "#FEF2F2",
    dangerBorder: isDark ? "#7F1D1D" : "#EF444450",
  };

  // ✅ Requête user
  const { data: rawResponse, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
    retry: 1,
  });

  // Extraction des données + sous-objet Person
  const user = useMemo(() => {
    if (!rawResponse) return null;
    return (rawResponse as any).data || (rawResponse as any).user || rawResponse;
  }, [rawResponse]);

  const person = useMemo(() => {
    if (!user) return {};
    return user.personProfile || user.person || {};
  }, [user]);

  // ✅ Mutation suppression
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(userId!),
    onSuccess: () => {
      queryClient.setQueryData(["users"], (oldData: any) => {
        if (!oldData) return oldData;
        const list = Array.isArray(oldData) ? oldData : (oldData.data || []);
        const filtered = list.filter((u: any) => u.id !== userId);
        return Array.isArray(oldData) ? filtered : { ...oldData, data: filtered };
      });
      if (Platform.OS === 'web') window.alert("Compte révoqué.");
      navigation.goBack();
    },
    onError: () => Alert.alert("Erreur", "Échec de suppression."),
  });

  // ✅ Mutation statut
  const statusMutation = useMutation({
    mutationFn: (newStatus: boolean) => updateUser(userId!, { status: (newStatus ? 'active' : 'inactive') as any }),
    onSuccess: (updatedResponse: any) => {
      const updatedUser = updatedResponse?.data || updatedResponse;
      queryClient.setQueryData(["user", userId], (old: any) => {
        if (!old) return old;
        return old.data ? { ...old, data: updatedUser } : updatedUser;
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => Alert.alert("Erreur", "Le changement de statut a échoué."),
  });

  const handleStatusChange = useCallback((val: boolean) => {
    if (isUpdating || statusMutation.isPending) return;
    setIsUpdating(true);
    statusMutation.mutate(val, { onSettled: () => setIsUpdating(false) });
  }, [isUpdating, statusMutation]);

  const generatePDF = async () => {
    if (!user) return;
    const html = `
      <html><body style="font-family: sans-serif; padding: 40px;">
        <h1 style="color: #1e3a8a; text-align: center;">RÉPUBLIQUE DU NIGER</h1>
        <h2 style="text-align: center;">FICHE D'HABILITATION JUSTICE</h2>
        <p><strong>Agent :</strong> ${user.firstname} ${user.lastname?.toUpperCase()}</p>
        <p><strong>Rôle :</strong> ${user.role?.toUpperCase()}</p>
        <p><strong>Matricule :</strong> ${user.matricule || "—"}</p>
        <p><strong>Email :</strong> ${user.email || "—"}</p>
        <p><strong>Téléphone :</strong> ${user.telephone || "—"}</p>
        <p><strong>Statut :</strong> ${user.is_active || user.isActive ? 'ACTIF' : 'SUSPENDU'}</p>
      </body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch { Alert.alert("Erreur PDF"); }
  };

  const handleDelete = () => {
    const action = () => deleteMutation.mutate();
    if (Platform.OS === 'web') {
      if (window.confirm("Révoquer définitivement cet accès ?")) action();
    } else {
      Alert.alert("⚠️ RÉVOCATION", "Supprimer définitivement cet agent ?", [
        { text: "Annuler", style: "cancel" },
        { text: "RÉVOQUER", style: "destructive", onPress: action },
      ]);
    }
  };

  // ─── États de chargement / erreur ────────────────────────────────────────

  if (!userId || error || (!isLoading && !user)) {
    return (
      <ScreenContainer withPadding={false}>
        <AppHeader title="Erreur" showBack />
        <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
          <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
          <Text style={{ color: colors.textMain, fontWeight: '700', marginTop: 10 }}>Agent introuvable</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: primaryColor }]} onPress={() => navigation.goBack()}>
            <Text style={{ color: "#FFF" }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer withPadding={false}>
        <AppHeader title="Chargement..." showBack />
        <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </ScreenContainer>
    );
  }

  const isActive = !!(user.is_active || user.isActive || user.status === 'active');

  // Formatage date de naissance depuis Person (YYYY-MM-DD → DD/MM/YYYY)
  const formatDateOfBirth = (raw: string) => {
    if (!raw) return null;
    const parts = raw.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return raw;
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Fiche d'Agent" showBack={true} />

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── EN-TÊTE ── */}
          <View style={styles.headerSection}>
            <View style={[styles.avatarBox, { backgroundColor: primaryColor + "15" }]}>
              <Ionicons name="person-circle-outline" size={100} color={primaryColor} />
            </View>
            <Text style={[styles.nameText, { color: colors.textMain }]}>
              {user.firstname} {user.lastname?.toUpperCase()}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: primaryColor + "15" }]}>
              <Text style={[styles.roleText, { color: primaryColor }]}>{user.role?.toUpperCase()}</Text>
            </View>

            {/* Switch statut */}
            <View style={[styles.statusBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.statusLabelGroup}>
                <View style={[styles.dot, { backgroundColor: isActive ? "#10B981" : "#EF4444" }]} />
                <Text style={[styles.statusTitle, { color: colors.textMain }]}>
                  {isActive ? "OPÉRATIONNEL" : "RÉVOQUÉ"}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={handleStatusChange}
                disabled={isUpdating}
                trackColor={{ false: "#CBD5E1", true: "#10B981" }}
              />
            </View>
          </View>

          {/* ── ACTIONS ── */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: primaryColor }]}
              onPress={() => navigation.navigate("AdminEditUser", { userId: user.id })}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Éditer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.textSub }]}
              onPress={generatePDF}
            >
              <Ionicons name="print-outline" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>

          {/* ── IDENTITÉ CIVILE ── */}
          <SectionHeader title="Identité Civile" colors={colors} />
          <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <InfoRow icon="person-outline"     label="Prénom"           value={user.firstname}                              primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="person-outline"     label="Nom"              value={user.lastname?.toUpperCase()}                primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="calendar-outline"   label="Date de naissance" value={formatDateOfBirth(person.dateOfBirth)}      primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="location-outline"   label="Lieu de naissance" value={person.placeOfBirth}                       primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="flag-outline"       label="Nationalité"      value={person.nationality}                          primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="card-outline"       label="N° Pièce identité" value={person.nationalId}                         primaryColor={primaryColor} colors={colors} isLast />
          </View>

          {/* ── SERVICE & CONTACT ── */}
          <SectionHeader title="Service & Contact" colors={colors} />
          <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <InfoRow icon="barcode-outline"    label="Matricule"        value={user.matricule || user.registrationNumber}   primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="business-outline"   label="Organisation"     value={user.organization}                           primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="mail-outline"       label="Email pro."       value={user.email}                                  primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="mail-outline"       label="Email perso."     value={person.email}                                primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="call-outline"       label="Téléphone"        value={user.telephone}                              primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="call-outline"       label="Tél. alternatif"  value={person.phone}                                primaryColor={primaryColor} colors={colors} isLast />
          </View>

          {/* ── ADRESSE ── */}
          <SectionHeader title="Adresse" colors={colors} />
          <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <InfoRow icon="home-outline"       label="Adresse"          value={person.address}                              primaryColor={primaryColor} colors={colors} />
            <InfoRow icon="location-outline"   label="Ville"            value={person.city}                                 primaryColor={primaryColor} colors={colors} isLast />
          </View>

          {/* ── RÉVOCATION ── */}
          <TouchableOpacity
            style={[styles.dangerCard, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
            onPress={handleDelete}
          >
            <View style={[styles.dangerIconBox, { backgroundColor: isDark ? "#7F1D1D" : "#EF444415" }]}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>Révocation Définitive</Text>
              <Text style={[styles.dangerSub, { color: colors.textSub }]}>Action irréversible</Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:           { flex: 1, justifyContent: "center", alignItems: "center" },
  retryBtn:         { padding: 12, borderRadius: 8, marginTop: 10 },
  mainWrapper:      { flex: 1 },
  scrollContent:    { padding: 20 },
  row:              { flexDirection: 'row', alignItems: 'center' },

  headerSection:    { alignItems: "center", marginBottom: 25 },
  avatarBox:        { marginBottom: 15, borderRadius: 50 },
  nameText:         { fontSize: 22, fontWeight: "800" },
  roleBadge:        { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  roleText:         { fontSize: 10, fontWeight: "900" },
  statusBox:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 20, padding: 15, borderRadius: 20, borderWidth: 1 },
  statusLabelGroup: { flexDirection: 'row', alignItems: 'center' },
  dot:              { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusTitle:      { fontSize: 12, fontWeight: "800" },

  actionGrid:       { flexDirection: 'row', gap: 10, marginBottom: 25 },
  actionBtn:        { flex: 1, flexDirection: 'row', height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionBtnText:    { color: '#fff', fontWeight: '800' },

  sectionTitle:     { fontSize: 10, fontWeight: "900", marginBottom: 10, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1.5 },
  infoCard:         { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 10 },
  infoRowInternal:  { flexDirection: "row", justifyContent: "space-between", padding: 15, alignItems: 'center' },
  infoLabel:        { marginLeft: 10, fontSize: 13, fontWeight: '600' },
  infoValue:        { fontWeight: "700", fontSize: 14, maxWidth: '55%', textAlign: 'right' },

  dangerCard:       { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', gap: 15, marginTop: 20 },
  dangerIconBox:    { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dangerTitle:      { color: "#EF4444", fontWeight: "800" },
  dangerSub:        { fontSize: 11 },
});