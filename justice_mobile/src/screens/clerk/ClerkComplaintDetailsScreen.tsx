import StatusBadge from '../../components/ui/StatusBadge';
import React from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  StatusBar
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ✅ 1. Architecture & Store
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { getComplaintById } from "../../services/complaint.service";

export default function ClerkComplaintDetailsScreen({ navigation, route }: ClerkScreenProps<'ClerkComplaintDetails'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary; 
  
  const params = route.params as any;
  const id = params?.id;

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    statusBg: isDark ? "#164E63" : "#F0F9FF",
    warningBg: isDark ? "#432706" : "#FFFBEB",
    warningText: isDark ? "#FBBF24" : "#B45309",
  };

  const { data: complaint, isLoading } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => getComplaintById(id),
    enabled: !!id,
  });

  if (isLoading || !complaint) {
    return (
      <ScreenContainer withPadding={false}>
        <AppHeader title="Vérification du Registre" showBack={true} />
        <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: colors.textSub }]}>Accès sécurisé à la base e-Justice...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleGoToRegister = () => {
    // Navigation vers l'enrôlement officiel (Attribution RG)
    // navigation.navigate("ClerkRegisterCase", { complaintId: complaint.id });
    console.log("Naviguer vers l'enrôlement RG pour", complaint.id);
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Réquisitoire Parquet #${id}`} showBack={true} />

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        <ScrollView 
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false}
        >
          {/* 🏛️ BANDEAU D'INSTRUCTION */}
          <View style={[styles.statusCard, { backgroundColor: colors.statusBg, borderColor: primaryColor }]}>
            <View style={styles.statusHeader}>
              <View style={[styles.badge, { backgroundColor: primaryColor }]}>
                <StatusBadge status={complaint.status} />
              </View>
              <Text style={[styles.dateText, { color: colors.textSub }]}>
                Transmis le {complaint.filedAt ? format(new Date(complaint.filedAt ?? complaint.createdAt ?? Date.now()), "dd MMM yyyy", { locale: fr }) : "--/--/----"}
              </Text>
            </View>
            <View style={styles.instructionRow}>
                <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
                <Text style={[styles.infoInstruction, { color: isDark ? "#BAE6FD" : "#475569" }]}>
                  Dossier validé par le Procureur. Veuillez procéder à l'attribution du numéro de Répertoire Général.
                </Text>
            </View>
          </View>

          {/* 👤 IDENTITÉ DU PLAIGNANT */}
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>PARTIE PLAIGNANTE / DÉNONCIATEUR</Text>
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.identityRow}>
              <View style={[styles.iconCircle, { backgroundColor: primaryColor + '15' }]}>
                  <Ionicons name="person-outline" size={22} color={primaryColor} />
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={[styles.labelSmall, { color: colors.textSub }]}>NOM ET PRÉNOM(S)</Text>
                  <Text style={[styles.value, { color: colors.textMain }]}>
                    {complaint.citizen ? `${complaint.citizen.firstname} ${complaint.citizen.lastname?.toUpperCase()}` : "PLAINTRE ÉTATIQUE / X"}
                  </Text>
              </View>
            </View>
            
            <View style={[styles.identityRow, { marginTop: 20 }]}>
              <View style={[styles.iconCircle, { backgroundColor: "#10B98115" }]}>
                  <Ionicons name="call-outline" size={22} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={[styles.labelSmall, { color: colors.textSub }]}>CONTACT TÉLÉPHONIQUE</Text>
                  <Text style={[styles.value, { color: colors.textMain }]}>
                      {complaint.citizen?.telephone || "Non renseigné"}
                  </Text>
              </View>
            </View>
          </View>

          {/* ⚖️ DÉTAILS DE L'INFRACTION */}
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>QUALIFICATION DES FAITS</Text>
          <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.labelSmall, { color: colors.textSub }]}>VISA DU PROCUREUR / OPJ :</Text>
            <Text style={[styles.highlightValue, { color: primaryColor }]}>
              {complaint.provisionalOffence || "EN ATTENTE DE QUALIFICATION"}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.labelSmall, { color: colors.textSub }]}>RÉSUMÉ DU PV DE SYNTHÈSE :</Text>
            <Text style={[styles.descText, { color: colors.textMain }]}>
              {complaint.description || "Aucune description technique disponible."}
            </Text>
          </View>

          {/* 📝 ACTION D'ENRÔLEMENT */}
          <View style={styles.actionArea}>
              <View style={[styles.warningBox, { backgroundColor: colors.warningBg, borderColor: isDark ? "#92400E" : "#FDE68A" }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.warningText} />
                  <Text style={[styles.warningText, { color: colors.warningText }]}>
                      L'enrôlement au greffe est un acte authentique. Vérifiez la conformité des scellés physiques avant validation.
                  </Text>
              </View>
              
              <TouchableOpacity 
                activeOpacity={0.85}
                style={[styles.actionBtn, { backgroundColor: primaryColor }]}
                onPress={handleGoToRegister}
              >
                <View style={styles.btnContent}>
                  <Ionicons name="journal-outline" size={26} color="#FFF" />
                  <View style={styles.btnTexts}>
                      <Text style={styles.btnTitle}>ENRÔLER AU RÉPERTOIRE</Text>
                      <Text style={styles.btnSub}>Attribuer un numéro RG définitif</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFF" />
              </TouchableOpacity>
          </View>

          {/* ✅ ESPACEMENT SMARTFOOTER */}
          <View style={styles.footerSpacing} />
        </ScrollView>
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, fontWeight: "800", fontSize: 13, letterSpacing: 1 },

  statusCard: { padding: 20, borderRadius: 24, marginBottom: 20, borderLeftWidth: 8 },
  statusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  dateText: { fontSize: 11, fontWeight: "700" },
  instructionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoInstruction: { fontSize: 12, fontWeight: "600", flex: 1, lineHeight: 18 },

  sectionLabel: { fontSize: 10, fontWeight: "900", marginBottom: 10, marginLeft: 5, letterSpacing: 1.5, textTransform: 'uppercase' },
  section: { 
    padding: 22, 
    borderRadius: 28, 
    marginBottom: 25, 
    borderWidth: 1,
    ...Platform.select({ 
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 }, 
      android: { elevation: 2 },
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }
    }) 
  },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 18 },
  iconCircle: { width: 48, height: 48, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  value: { fontSize: 17, fontWeight: "900" },
  
  labelSmall: { fontSize: 9, fontWeight: "900", marginBottom: 8, letterSpacing: 0.8 },
  highlightValue: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  divider: { height: 1.5, marginVertical: 20 },
  descText: { fontSize: 15, lineHeight: 26, fontWeight: "500" },

  actionArea: { marginTop: 5 },
  warningBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderRadius: 20, marginBottom: 25, borderWidth: 1, borderStyle: 'dashed' },
  warningText: { fontSize: 12, fontWeight: "800", flex: 1, lineHeight: 18 },
  actionBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    padding: 22, 
    borderRadius: 24, 
    ...Platform.select({
      android: { elevation: 6 },
      ios: { shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
      web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }
    })
  },
  btnContent: { flexDirection: "row", alignItems: "center", gap: 20 },
  btnTexts: { flex: 1 },
  btnTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  btnSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", marginTop: 4 },
  
  footerSpacing: { height: 140 }
});