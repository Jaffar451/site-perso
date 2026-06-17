import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// ✅ Imports Architecture
import { getAppTheme } from "../../theme";
import { CitizenScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services & Types
import { getMyComplaints, Complaint } from "../../services/complaint.service";

// ✅ CORRECTION 1 : On retire 'filedAt' car il est déjà dans 'Complaint' (et obligatoire)
interface ExtendedJudicialCase extends Complaint {
  is_served?: boolean; 
  court_name?: string;
  trackingCode?: string;
  provisionalOffence?: string;
  // filedAt est hérité de Complaint
}

export default function CitizenCasesScreen({ navigation }: CitizenScreenProps<'CitizenMyComplaints'>) {
  const theme = getAppTheme();
  const primaryColor = theme.color;
  
  const [cases, setCases] = useState<ExtendedJudicialCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyCases = async () => {
    try {
      const data = await getMyComplaints();
      const enhancedData = (data as any[]).map(c => ({
        ...c,
        court_name: c.court_name || "Tribunal de Grande Instance",
        is_served: c.status === "jugée" || false
      }));
      setCases(enhancedData);
    } catch (e) {
      console.error("Erreur chargement dossiers citoyen:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyCases();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyCases();
  };

  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("jugée") || s.includes("decision")) 
      return { color: '#10B981', label: "DÉCISION RENDUE", icon: "hammer" };
    if (s.includes("parquet") || s.includes("transmise")) 
      return { color: '#F59E0B', label: "AU PARQUET", icon: "briefcase" };
    if (s.includes("opj") || s.includes("enquête")) 
      return { color: '#3B82F6', label: "ENQUÊTE OPJ", icon: "shield" };
    return { color: '#64748B', label: "EN ATTENTE", icon: "time" };
  };

  const renderItem = ({ item }: { item: ExtendedJudicialCase }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => navigation.navigate("ComplaintDetail", { id: item.id })}
        style={[
          styles.card, 
          { 
            backgroundColor: "#FFF", 
            borderColor: "#E2E8F0",
          }
        ]}
      >
        {/* En-tête : Référence et Statut */}
        <View style={styles.cardHeader}>
          <View style={styles.refGroup}>
            <Text style={styles.rgLabel}>RÉFÉRENCE</Text>
            <Text style={styles.rgNumber}>
              {item.trackingCode || `N° ${item.id.toString().padStart(5, '0')}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.color + '15' }]}>
            <Ionicons name={statusStyle.icon as any} size={10} color={statusStyle.color} style={{marginRight: 4}} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Corps : Titre et Juridiction */}
        <View style={styles.cardBody}>
            <Text style={styles.offenceText} numberOfLines={2}>
              {item.provisionalOffence || item.title || "Plainte déposée"}
            </Text>
            
            <View style={styles.courtRow}>
              <Ionicons name="location-sharp" size={14} color={primaryColor} />
              <Text style={styles.courtName}>
                {item.court_name} • {new Date(item.filedAt || Date.now()).toLocaleDateString('fr-FR')}
              </Text>
            </View>
        </View>

        <View style={styles.divider} />

        {/* Section Notification (Signification) */}
        <View style={[
          styles.servedBox, 
          { backgroundColor: item.is_served ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.06)' }
        ]}>
          <Ionicons 
            name={item.is_served ? "checkmark-circle" : "alert-circle"} 
            size={16} 
            color={item.is_served ? "#10B981" : "#F59E0B"} 
          />
          <Text style={[styles.servedText, { color: item.is_served ? "#059669" : "#D97706" }]}>
            {item.is_served 
              ? "Acte disponible au greffe / Signifié" 
              : "En attente de signification par huissier"}
          </Text>
        </View>

        <View style={styles.footerAction}>
            <Text style={{ color: primaryColor, fontWeight: '900', fontSize: 11 }}>VOIR LES DÉTAILS</Text>
            <Ionicons name="chevron-forward" size={16} color={primaryColor} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Suivi Judiciaire" showMenu={false} />
      
      <View style={styles.container}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.mainTitle}>Mes Affaires</Text>
          <Text style={styles.mainSub}>
            Historique et état d'avancement de vos dossiers auprès des juridictions nationales.
          </Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={{ marginTop: 12, color: "#64748B", fontWeight: '600' }}>Accès aux registres...</Text>
          </View>
        ) : (
          <FlatList
            data={cases}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                    <Ionicons name="folder-open-outline" size={60} color="#94A3B8" />
                </View>
                <Text style={styles.emptyText}>
                   Aucune procédure judiciaire enregistrée à votre nom.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ✅ CORRECTION 2 : SmartFooter autonome sans props */}
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerTitleBox: { paddingHorizontal: 20, marginTop: 20, marginBottom: 20 },
  mainTitle: { fontSize: 28, fontWeight: "900", letterSpacing: -0.8, color: "#1E293B" },
  mainSub: { fontSize: 13, marginTop: 4, lineHeight: 18, fontWeight: '500', color: "#64748B" },
  
  listPadding: { 
    paddingHorizontal: 16, 
    paddingBottom: 150 
  },
  
  card: { 
    borderRadius: 20, 
    marginBottom: 16, 
    borderWidth: 1, 
    overflow: 'hidden',
    backgroundColor: "#FFF",
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.04)' }
    })
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    paddingBottom: 10
  },
  refGroup: { flex: 1 },
  rgLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, color: "#64748B" },
  rgNumber: { fontSize: 16, fontWeight: "900", marginTop: 2, color: "#1E293B" },
  
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  statusText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.3 },
  
  cardBody: { paddingHorizontal: 16, paddingBottom: 16 },
  offenceText: { fontSize: 16, fontWeight: "800", lineHeight: 22, marginBottom: 8, color: "#1E293B" },
  courtRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  courtName: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  
  divider: { height: 1, marginHorizontal: 16, backgroundColor: "#F1F5F9" },
  
  servedBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    margin: 12, 
    padding: 10, 
    borderRadius: 12, 
    gap: 8 
  },
  servedText: { fontSize: 11, fontWeight: "700" },
  
  footerAction: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    padding: 12, 
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: "#F8FAFC" },
  emptyText: { textAlign: 'center', fontSize: 14, fontWeight: "600", lineHeight: 20, color: "#64748B" }
});