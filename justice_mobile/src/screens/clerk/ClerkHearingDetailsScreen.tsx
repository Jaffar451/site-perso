import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Architecture & Thème
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { getHearingsByCase, Hearing } from "../../services/hearing.service";

export default function ClerkHearingDetailsScreen({ navigation, route }: ClerkScreenProps<'ClerkAdjournHearing'>) { 
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const params = route.params as any;
  const caseId = params?.caseId;
  const caseNumber = params?.caseNumber;

  const [history, setHistory] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    line: isDark ? "#334155" : "#E2E8F0",
    noteBg: isDark ? "#0F172A" : "#F8FAFC",
  };

  useEffect(() => {
    if (caseId) loadHistory();
  }, [caseId]);

  const loadHistory = async () => {
    try {
      const data = await getHearingsByCase(Number(caseId));
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(sorted);
    } catch (error) {
      console.error("Erreur historique:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "adjourned": return { color: "#F59E0B", label: "RENVOYÉE", bg: isDark ? "#432706" : "#FEF3C7" };
      case "completed": return { color: "#10B981", label: "TERMINÉE", bg: isDark ? "#064E3B" : "#DCFCE7" };
      case "cancelled": return { color: "#EF4444", label: "ANNULÉE", bg: isDark ? "#450A0A" : "#FEE2E2" };
      default: return { color: primaryColor, label: "PROGRAMMÉE", bg: isDark ? "#164E63" : "#CFFAFE" };
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Historique RG #${caseNumber || 'N/A'}`} showBack />

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loadingText, { color: colors.textSub }]}>Récupération des actes...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Séquence de la Procédure</Text>
            
            {history.map((item, index) => {
              const statusStyle = getStatusStyle(item.status);
              const isLast = index === history.length - 1;

              return (
                <View key={item.id} style={styles.timelineItem}>
                  {/* Barre latérale Timeline */}
                  <View style={styles.timelineLeft}>
                    <View style={[styles.dot, { backgroundColor: statusStyle.color, borderColor: colors.bgMain }]} />
                    {!isLast && <View style={[styles.line, { backgroundColor: colors.line }]} />}
                  </View>

                  {/* Carte d'audience */}
                  <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.dateText, { color: colors.textMain }]}>
                        {new Date(item.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color={primaryColor} />
                      <Text style={[styles.detailText, { color: colors.textSub }]}>Salle {item.room}</Text>
                      <View style={[styles.dotSeparator, { backgroundColor: colors.border }]} />
                      <Ionicons name="time-outline" size={14} color={colors.textSub} />
                      <Text style={[styles.detailText, { color: colors.textSub }]}>
                          {new Date(item.date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    {item.notes && (
                      <View style={[styles.notesBox, { backgroundColor: colors.noteBg, borderLeftColor: colors.border }]}>
                        <Text style={[styles.notesText, { color: colors.textMain }]}>{item.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {history.length === 0 && (
              <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={60} color={colors.border} />
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucun acte d'audience enregistré pour ce dossier.</Text>
              </View>
            )}

            {/* BOUTON D'ACTION RAPIDE */}
            <TouchableOpacity 
              activeOpacity={0.85}
              style={[styles.actionBtn, { backgroundColor: primaryColor }]}
              onPress={() => {
                navigation.navigate("ClerkAdjournHearing", { 
                  hearingId: history[0]?.id.toString() || "0", 
                  caseNumber: caseNumber?.toString() || "Inconnu"
                });
              }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#FFF" />
              <Text style={styles.actionBtnText}>ENREGISTRER UN RENVOI</Text>
            </TouchableOpacity>

            <View style={{ height: 140 }} />
          </ScrollView>
        )}
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  scrollView: { flex: 1 },
  container: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 400 },
  loadingText: { marginTop: 12, fontWeight: "700", letterSpacing: 1 },
  
  sectionTitle: { fontSize: 10, fontWeight: "900", marginBottom: 25, letterSpacing: 1.5, textTransform: 'uppercase' },
  
  timelineItem: { flexDirection: "row", minHeight: 110 },
  timelineLeft: { alignItems: "center", marginRight: 15, width: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, zIndex: 2, borderWidth: 3 },
  line: { width: 2, flex: 1, marginTop: -5, zIndex: 1 },
  
  card: { 
    flex: 1, 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 20, 
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }
    })
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  dateText: { fontSize: 16, fontWeight: "800" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 15, gap: 6 },
  detailText: { fontSize: 12, fontWeight: "700" },
  dotSeparator: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  
  notesBox: { padding: 15, borderRadius: 16, borderLeftWidth: 4 },
  notesText: { fontSize: 13, lineHeight: 22, fontWeight: "500" },
  
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyText: { textAlign: "center", marginTop: 15, fontSize: 14, fontWeight: "700", lineHeight: 22 },
  
  actionBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 12, 
    padding: 20, 
    borderRadius: 22, 
    marginTop: 15,
    ...Platform.select({
        android: { elevation: 4 },
        ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
        web: { boxShadow: "0px 4px 15px rgba(0,0,0,0.1)" }
    })
  },
  actionBtnText: { color: "#FFF", fontWeight: "900", fontSize: 14, letterSpacing: 1 },
});