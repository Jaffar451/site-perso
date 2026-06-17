import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet,
  ActivityIndicator, 
  RefreshControl,
  Platform,
  TouchableOpacity,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Architecture & Thème
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique
import { ClerkScreenProps } from "../../types/navigation";

// Services
import { getAllHearings, Hearing } from "../../services/hearing.service";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export default function ClerkCalendarScreen({ navigation }: ClerkScreenProps<'ClerkCalendar'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    dateCol: isDark ? "#0F172A" : "#F8FAFC",
    todayAccent: "#D84315",
  };

  const fetchHearings = async () => {
    try {
      const data = await getAllHearings();
      const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setHearings(sorted);
    } catch (error) {
      console.error("Erreur calendrier:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHearings(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHearings();
  }, []);

  const getStatusStyle = (status: Hearing['status']) => {
    switch (status) {
      case 'completed': return { color: '#10B981', label: 'TERMINÉE', bg: isDark ? '#064E3B' : '#DCFCE7' };
      case 'adjourned': return { color: '#F59E0B', label: 'RENVOYÉE', bg: isDark ? '#432706' : '#FEF3C7' };
      case 'cancelled': return { color: '#EF4444', label: 'ANNULÉE', bg: isDark ? '#450A0A' : '#FEE2E2' };
      default: return { color: primaryColor, label: 'PROGRAMMÉE', bg: isDark ? '#164E63' : '#CFFAFE' };
    }
  };

  const renderItem = ({ item }: { item: Hearing }) => {
    const dateObj = new Date(item.date);
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const status = getStatusStyle(item.status);
    const accentColor = isToday ? colors.todayAccent : status.color;

    return (
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ClerkAdjournHearing", { hearingId: item.id, caseNumber: item.caseId.toString() })}
        style={[
          styles.card, 
          { 
            backgroundColor: colors.bgCard,
            borderLeftColor: accentColor,
            borderColor: colors.border
          }
        ]}
      >
        {/* Colonne Date */}
        <View style={[styles.dateColumn, { backgroundColor: colors.dateCol, borderRightColor: colors.border }]}>
          <Text style={[styles.dateDay, { color: colors.textMain }]}>
            {dateObj.getDate().toString().padStart(2, '0')}
          </Text>
          <Text style={[styles.dateMonth, { color: colors.textSub }]}>
            {dateObj.toLocaleString('fr-FR', { month: 'short' }).toUpperCase()}
          </Text>
          {isToday && (
            <View style={[styles.todayBadge, { backgroundColor: colors.todayAccent }]}>
              <Text style={styles.todayText}>AUJOURD'HUI</Text>
            </View>
          )}
        </View>

        {/* Détails de l'audience */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.caseId, { color: colors.textMain }]}>RG #{item.caseId}</Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <Text style={[styles.typeText, { color: colors.textSub }]} numberOfLines={1}>
            {item.type.toUpperCase()}
          </Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={primaryColor} />
            <Text style={[styles.locationText, { color: colors.textSub }]}>Salle {item.room}</Text>
            <View style={[styles.dotSeparator, { backgroundColor: colors.border }]} />
            <Ionicons name="time-outline" size={14} color={colors.textSub} />
            <Text style={[styles.timeText, { color: colors.textSub }]}>
              {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.border} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Rôle des Audiences" showMenu />

      <View style={[styles.monthHeader, { backgroundColor: colors.bgMain }]}>
        <Ionicons name="calendar-clear-outline" size={20} color={primaryColor} />
        <Text style={[styles.monthTitle, { color: colors.textMain }]}>
          {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={primaryColor} /></View>
        ) : (
          <FlatList
            data={hearings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={60} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucune audience programmée.</Text>
              </View>
            }
          />
        )}
      </View>
      
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listPadding: { padding: 16, paddingBottom: 150 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 15 },
  monthTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
  
  card: { 
    flexDirection: 'row', 
    marginBottom: 12, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderLeftWidth: 6,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 3 },
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
      web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.08)' }
    })
  },
  dateColumn: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 80, 
    paddingVertical: 15,
    borderRightWidth: 1,
  },
  dateDay: { fontSize: 26, fontWeight: '900' },
  dateMonth: { fontSize: 10, fontWeight: '900', marginTop: -2 },
  todayBadge: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginTop: 5 },
  todayText: { color: '#FFF', fontSize: 7, fontWeight: '900' },

  content: { flex: 1, padding: 15, justifyContent: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  caseId: { fontSize: 16, fontWeight: '900' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: "900" },

  typeText: { fontSize: 11, fontWeight: "800", marginBottom: 8, letterSpacing: 0.5 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { fontSize: 12, fontWeight: "700" },
  dotSeparator: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 4 },
  timeText: { fontSize: 12, fontWeight: "800" },
  chevron: { alignSelf: 'center', marginRight: 10, opacity: 0.5 },

  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontWeight: '700' },
});