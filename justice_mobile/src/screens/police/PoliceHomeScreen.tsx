import React, { useState, useMemo, useEffect } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  RefreshControl, StatusBar, ActivityIndicator, 
  TextInput, ScrollView, Platform 
} from "react-native";
import { useQuery } from "@tanstack/react-query";
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
import { getAllComplaints } from "../../services/complaint.service";
import { getPoliceStats } from "../../services/stats.service";

export default function PoliceHomeScreen({ navigation }: PoliceScreenProps<'PoliceHome'>) {
  const { theme, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date()); 
  const primaryColor = "#1E3A8A"; 

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#F1F5F9",
  };

  // ✅ Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  // 📡 Récupération des données (Optimisée avec TanStack Query)
  // On ajoute un staleTime de 10 secondes pour éviter les rafraîchissements inutiles au focus
  const { data: complaints, isLoading: loadingCases, refetch: refetchCases } = useQuery({
    queryKey: ["complaints"],
    queryFn: getAllComplaints,
    staleTime: 1000, 
  });

  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["police-global-stats"],
    queryFn: getPoliceStats,
    staleTime: 10000,
  });

  // 🔄 Fonction de rafraîchissement manuel (Pull-to-refresh)
  const handleRefresh = async () => {
    await Promise.all([refetchCases(), refetchStats()]);
  };

  // 🔍 Filtrage des dossiers récents
  const filteredComplaints = useMemo(() => {
    if (!complaints || !Array.isArray(complaints)) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return complaints.filter((c: any) => 
      (c.title?.toLowerCase() || "").includes(lowerQuery) || 
      (c.id?.toString() || "").includes(lowerQuery)
    );
  }, [complaints, searchQuery]);

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Poste de Police" showSos={true} showMenu={true} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.bgMain }}
        refreshControl={
          <RefreshControl 
            refreshing={loadingCases || loadingStats} 
            onRefresh={handleRefresh} 
            tintColor={primaryColor} 
          />
        }
      >
        {/* 🕒 HEADER STATS OPJ */}
        <View style={styles.headerStats}>
          <View style={[styles.clockBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.clockTime, { color: primaryColor }]}>{timeString}</Text>
            <Text style={[styles.clockDate, { color: colors.textSub }]}>{dateString.toUpperCase()}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: isDark ? "#1E293B" : "#DBEAFE" }]}>
            <Text style={[styles.statVal, { color: primaryColor }]}>{stats?.total || 0}</Text>
            <Text style={[styles.statLab, { color: primaryColor }]}>Dossiers</Text>
          </View>
        </View>

        {/* 🔍 BARRE DE RECHERCHE RAPIDE */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSub} />
            <TextInput 
              placeholder="Rechercher un PV, un nom, un RG..." 
              placeholderTextColor={colors.textSub}
              style={[styles.searchInput, { color: colors.textMain }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* 🛠️ GRILLE DES SERVICES OPJ */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Services de Police Judiciaire</Text>
        <View style={styles.quickActionsGrid}>
          
          <ActionBtn 
            label="Plaintes" icon="mail-unread" color="#2563EB" bg="#DBEAFE" 
            onPress={() => navigation.navigate("PoliceComplaints")}
            colors={colors} 
          />

          <ActionBtn 
            label="Mes Enquêtes" icon="folder-open" color="#7C3AED" bg="#F3E8FF" 
            onPress={() => navigation.navigate("PoliceCases")}
            colors={colors} 
          />

          <ActionBtn 
            label="Scanner" icon="qr-code-outline" color="#059669" bg="#D1FAE5" 
            onPress={() => navigation.navigate("VerificationScanner" as any)}
            colors={colors} 
          />

          <ActionBtn 
            label="Rapport Hebdo" icon="stats-chart" color="#DB2777" bg="#FCE7F3" 
            onPress={() => navigation.navigate("WeeklyReport" as any)}
            colors={colors} 
          />

          <ActionBtn 
            label="Mandats CID" icon="shield-half" color="#D97706" bg="#FEF3C7" 
            onPress={() => navigation.navigate("PoliceArrestWarrant")}
            colors={colors} 
          />

          <ActionBtn 
            label="Recherche" icon="search-circle" color="#4B5563" bg="#E5E7EB" 
            onPress={() => navigation.navigate("WarrantSearch")}
            colors={colors} 
          />

          <ActionBtn 
            label="Garde à vue" icon="lock-closed" color="#DC2626" bg="#FEE2E2" 
            onPress={() => navigation.navigate("PoliceCustody", { complaintId: 0, suspectName: "Nouveau" })}
            colors={colors} 
          />

          <ActionBtn 
            label="Nouveau PV" icon="document-text" color="#1E40AF" bg="#DBEAFE" 
            onPress={() => navigation.navigate("PolicePVScreen", {})}
            colors={colors} 
          />
        </View>

        {/* 📂 LISTE DES DOSSIERS RÉCENTS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Dernières Activités</Text>
          <TouchableOpacity onPress={() => navigation.navigate("PoliceCases")}>
              <Text style={{ color: primaryColor, fontWeight: '800', marginRight: 20, marginTop: 15, fontSize: 11 }}>MES ENQUÊTES</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {loadingCases ? (
            <ActivityIndicator color={primaryColor} size="small" style={{ marginTop: 20 }} />
          ) : (
            filteredComplaints.slice(0, 5).map((item: any) => (
              <TouchableOpacity 
                key={item.id.toString()}
                activeOpacity={0.7}
                style={[styles.complaintCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                onPress={() => navigation.navigate("PoliceComplaintDetails", { complaintId: item.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.rgNumber, { color: primaryColor }]}>DOSSIER RG-#{item.id}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textMain }]} numberOfLines={1}>
                  {item.title || "Objet non spécifié"}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
        
        <View style={{ height: 120 }} /> 
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

// ✅ Composant ActionBtn avec correction "Shadow" pour le Web
const ActionBtn = ({ label, icon, color, bg, onPress, colors }: any) => (
    <TouchableOpacity 
      activeOpacity={0.6}
      style={[
        styles.actionItem, 
        { backgroundColor: colors.bgCard, borderColor: colors.border }
      ]} 
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.textMain }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  headerStats: { flexDirection: 'row', padding: 16, gap: 10 },
  clockBox: { flex: 1.5, padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  clockTime: { fontSize: 22, fontWeight: '900' },
  clockDate: { fontSize: 10, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
  statBox: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLab: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 11, fontWeight: "900", marginHorizontal: 20, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  actionItem: { 
    width: '48.5%', 
    paddingVertical: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1,
    // ✅ Correction multi-plateforme pour les ombres
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' },
      default: { elevation: 3, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3 }
    })
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  listContainer: { paddingHorizontal: 16 },
  complaintCard: { 
    padding: 16, 
    borderRadius: 15, 
    marginBottom: 10, 
    borderWidth: 1,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.05)' },
      default: { elevation: 1 }
    })
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  rgNumber: { fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
  cardTitle: { fontSize: 14, fontWeight: '700' }
});