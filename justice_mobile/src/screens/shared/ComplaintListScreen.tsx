import React, { useState, useMemo } from "react";
import { 
  View, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  StatusBar,
} from "react-native";
import { Text, Card, Chip, Searchbar, Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

// ✅ Architecture & Thème
import { useAuthStore } from "../../stores/useAuthStore";
import { getAppTheme } from "../../theme";
import { CitizenScreenProps } from "../../types/navigation";

// Layout
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services & Hooks
import { generateComplaintPDF } from "../../services/pdf.service";
import { useComplaints } from "../../hooks/useComplaints";

export default function ComplaintListScreen({ navigation }: CitizenScreenProps<'ComplaintList'>) {
  const theme = getAppTheme();
  const primaryColor = theme.color;
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  
  console.log("DEBUG ROLE:", user?.role);
  // ✅ Détection du rôle pour ajuster l'interface et la requête
  const isOfficer = user?.role === "officier_police" || user?.role === "gendarme" || user?.role === "commissaire";
  console.log("IS OFFICER ?", isOfficer);
  
  // ✅ Utilisation du hook (on passe le rôle pour que le hook sache quelle route appeler)
  const { data, isLoading, refetch, isRefetching } = useComplaints(isOfficer ? 'all' : 'mine');

  // 🔍 Filtrage (ID, Code ou Titre)
  const filteredData = useMemo(() => {
    if (!data) return [];
    const term = searchQuery.toLowerCase().trim();
    return data.filter((item: any) =>
      (item.title || "").toLowerCase().includes(term) ||
      (item.id && item.id.toString().includes(term)) ||
      (item.trackingCode || "").toLowerCase().includes(term)
    );
  }, [data, searchQuery]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": 
      case "soumise": return { color: "#F59E0B", label: "À TRAITER", icon: "time-outline" };
      case "investigating": 
      case "en_cours_OPJ": return { color: "#3B82F6", label: "ENQUÊTE", icon: "search-outline" };
      case "transmitted": 
      case "transmise_parquet": return { color: "#10B981", label: "AU PARQUET", icon: "send-outline" };
      case "closed": return { color: "#EF4444", label: "CLASSÉ", icon: "archive-outline" };
      default: return { color: "#64748B", label: status?.replace(/_/g, ' ') || "INCONNU", icon: "file-tray-outline" };
    }
  };

  const handleAction = async (item: any) => {
    if (isOfficer) {
      try {
        Toast.show({ type: 'info', text1: 'Génération PDF', text2: 'Préparation du procès-verbal...' });
        await generateComplaintPDF(item);
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Échec de la génération.' });
      }
    } else {
      navigation.navigate("ComplaintDetail", { id: item.id });
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const config = getStatusConfig(item.status);
    
    return (
      <Card 
        style={[styles.card, { borderColor: "#F1F5F9" }]} 
        onPress={() => navigation.navigate("ComplaintDetail", { id: item.id })}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.idRow}>
                <Ionicons name="folder-open" size={14} color={primaryColor} />
                <Text style={[styles.caseId, { color: primaryColor }]}>
                  #{item.trackingCode || `RG-${item.id}`}
                </Text>
            </View>
            <Chip 
              textStyle={{ fontSize: 9, fontWeight: '900', color: config.color }} 
              style={{ backgroundColor: config.color + '15', height: 26, borderRadius: 8 }}
              icon={() => <Ionicons name={config.icon as any} size={12} color={config.color} />}
            >
              {config.label}
            </Chip>
          </View>

          <Text style={styles.caseTitle} numberOfLines={1}>{item.title || "Dossier Judiciaire"}</Text>
          <Text style={styles.caseDate}>
              Signalé le {new Date(item.filedAt ?? item.createdAt ?? Date.now()).toLocaleDateString('fr-FR')}
          </Text>
          
          <Divider style={styles.divider} />

          <View style={styles.actionRow}>
            <View style={styles.priorityBox}>
              <View style={[styles.priorityDot, { backgroundColor: item.priority === 'high' ? '#EF4444' : '#10B981' }]} />
              <Text style={styles.priorityText}>
                  Urgence {item.priority === 'high' ? 'Signalée' : 'Normale'}
              </Text>
            </View>
            
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.actionButton, { backgroundColor: primaryColor }]}
              onPress={() => handleAction(item)}
            >
              <Ionicons 
                name={isOfficer ? "cloud-download-outline" : "eye-outline"} 
                size={16} 
                color="#FFF" 
              />
              <Text style={styles.actionButtonText}>
                {isOfficer ? "ACTE PDF" : "OUVRIR"}
              </Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      {/* ✅ Titre dynamique selon le rôle */}
      <AppHeader title={isOfficer ? "Registre de Police" : "Mes Plaintes"} showMenu={true} />
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher par N°, titre..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={primaryColor}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {isLoading && !data ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loaderText}>Chargement du registre sécurisé...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={80} color="#E2E8F0" />
                <Text style={styles.emptyTitle}>Registre vide</Text>
                <Text style={styles.emptyText}>Aucun dossier ne correspond à vos critères.</Text>
            </View>
          }
        />
      )}

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: { padding: 15, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  searchBar: { borderRadius: 14, elevation: 0, height: 50, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  searchInput: { fontSize: 14, color: "#1E293B", fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 140 },
  card: { borderRadius: 24, marginBottom: 16, backgroundColor: "#FFF", elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caseId: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  caseTitle: { fontSize: 18, fontWeight: '900', color: "#1E293B", marginBottom: 4, letterSpacing: -0.5 },
  caseDate: { fontSize: 12, fontWeight: '600', color: "#64748B" },
  divider: { marginVertical: 15, height: 1, backgroundColor: "#F1F5F9" },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBox: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  priorityText: { fontSize: 12, fontWeight: '700', color: "#64748B" },
  actionButton: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 44, gap: 8, elevation: 2 },
  actionButtonText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, fontWeight: '700', color: "#64748B", fontSize: 13 },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 50 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: "#1E293B", marginTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 10, color: "#94A3B8", lineHeight: 22, fontWeight: '500' }
});