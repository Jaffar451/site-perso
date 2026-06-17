import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Linking,
  StatusBar,
  TextInput,
  Platform,
  ViewStyle
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

// ✅ Imports Architecture
import { useAppTheme } from "../../theme/AppThemeProvider";
import { BailiffScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Interface Métier
interface BailiffMission {
  id: number;
  rg_number: string;
  type_acte: string; // Ex: Assignation, Commandement, Signification
  document_url: string;
  status: 'pending' | 'completed';
  court_name: string;
  recipient_name: string; // Nom du destinataire
  address: string;        // Adresse de signification
  deadline?: string;      // Date limite
  geo_lat?: number;
  geo_lng?: number;
}

// Données de secours (Mock)
const MOCK_MISSIONS: BailiffMission[] = [
  {
    id: 101,
    rg_number: "RG-2024-884",
    type_acte: "Assignation en divorce",
    document_url: "https://example.com/doc1.pdf",
    status: "pending",
    court_name: "TGI Niamey",
    recipient_name: "M. Ibrahima Seydou",
    address: "Quartier Plateau, Rue des Ambassades",
    deadline: "2025-01-10",
    geo_lat: 13.5115,
    geo_lng: 2.1254
  },
  {
    id: 102,
    rg_number: "RG-2024-992",
    type_acte: "Commandement de payer",
    document_url: "https://example.com/doc2.pdf",
    status: "pending",
    court_name: "Tribunal de Commerce",
    recipient_name: "Société SOTRA-NIGER",
    address: "Zone Industrielle, Niamey",
    deadline: "2025-01-05"
  },
  {
    id: 103,
    rg_number: "RG-2023-104",
    type_acte: "Signification de Jugement",
    document_url: "https://example.com/doc3.pdf",
    status: "completed",
    court_name: "Cour d'Appel",
    recipient_name: "Mme. Fatouma Diallo",
    address: "Quartier Yantala",
    deadline: "2024-12-20"
  }
];

export default function BailiffMissionsScreen({ navigation }: BailiffScreenProps<'BailiffMissions'>) {
  // ✅ Thème via Hook
  const { theme } = useAppTheme();
  const primaryColor = "#EA580C"; // Orange brûlé pour les Huissiers (Distinctif)
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [validating, setValidating] = useState<number | null>(null);
  
  const [missions, setMissions] = useState<BailiffMission[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Récupération des missions
  const fetchMissions = async () => {
    try {
      // Simulation appel API
      await new Promise(r => setTimeout(r, 1000));
      setMissions(MOCK_MISSIONS);
    } catch (e) {
      console.error("Erreur missions huissier:", e);
      if (Platform.OS === 'web') window.alert("Mode Hors Ligne\n\nImpossible de contacter le serveur. Affichage des données locales.");
      else Alert.alert("Mode Hors Ligne", "Impossible de contacter le serveur. Affichage des données locales.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMissions();
  };

  // 2. Filtrage intelligent
  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      const matchesTab = m.status === activeTab;
      const matchesSearch = 
        m.rg_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [missions, activeTab, searchQuery]);

  // 3. Actions Utilitaires
  const openDocument = (url: string) => {
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') window.alert("Erreur\n\nLien document invalide.");
      else Alert.alert("Erreur", "Lien document invalide.");
    });
  };

  const openGPS = (address: string, lat?: number, lng?: number) => {
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      web: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
    if (url) Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') window.alert("Erreur\n\nImpossible d'ouvrir l'application de cartes.");
      else Alert.alert("Erreur", "Impossible d'ouvrir l'application de cartes.");
    });
  };

  // 4. Validation avec Géolocalisation
  const handleSignify = async (missionId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Confirmation\n\nConfirmez-vous avoir remis l'acte en main propre ou à domicile ? Votre position GPS sera enregistrée comme preuve.")) {
        await executeSignification(missionId);
      }
    } else {
      Alert.alert(
        "Confirmation",
        "Confirmez-vous avoir remis l'acte en main propre ou à domicile ? Votre position GPS sera enregistrée comme preuve.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Valider la signification",
            onPress: async () => {
              await executeSignification(missionId);
            }
          }
        ]
      );
    }
  };

  const executeSignification = async (missionId: number) => {
    setValidating(missionId);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') window.alert("Permission refusée\n\nLa géolocalisation est obligatoire pour certifier l'acte.");
        else Alert.alert("Permission refusée", "La géolocalisation est obligatoire pour certifier l'acte.");
        setValidating(null);
        return;
      }

      // Capture de la position
      await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      
      // Simulation délai réseau
      await new Promise(r => setTimeout(r, 1500));
      
      // Mise à jour locale optimiste
      setMissions(prev => prev.map(m => 
        m.id === missionId ? { ...m, status: 'completed' } : m
      ));

      if (Platform.OS === 'web') window.alert("Acte Signifié\n\nLa preuve de passage a été transmise au Greffe.");
      else Alert.alert("✅ Acte Signifié", "La preuve de passage a été transmise au Greffe.");
    } catch (e) {
      if (Platform.OS === 'web') window.alert("Erreur\n\nÉchec de la validation GPS.");
      else Alert.alert("Erreur", "Échec de la validation GPS.");
    } finally {
      setValidating(null);
    }
  };

  const renderItem = ({ item }: { item: BailiffMission }) => (
    <View style={styles.card}>
      {/* Header Carte */}
      <View style={styles.cardHeader}>
        <View style={{flex: 1}}>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <View style={[styles.badge, { backgroundColor: item.type_acte.includes("Assignation") ? "#DBEAFE" : "#FEF3C7" }]}>
                 <Text style={[styles.badgeText, { color: item.type_acte.includes("Assignation") ? "#1E40AF" : "#B45309" }]}>
                   {item.type_acte.toUpperCase()}
                 </Text>
              </View>
              {item.deadline && (
                <Text style={{ fontSize: 10, color: "#EF4444", fontWeight: '700' }}>
                  Échéance : {item.deadline}
                </Text>
              )}
           </View>
           <Text style={styles.rgNumber}>{item.rg_number}</Text>
        </View>
        <TouchableOpacity onPress={() => openDocument(item.document_url)} style={[styles.docBtn, { backgroundColor: primaryColor + "15" }]}>
           <Ionicons name="document-text-outline" size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Info Destinataire */}
      <View style={styles.recipientBox}>
        <View style={styles.row}>
           <Ionicons name="person" size={16} color="#64748B" />
           <Text style={styles.recipientName}>{item.recipient_name}</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => openGPS(item.address, item.geo_lat, item.geo_lng)}
          style={styles.row}
        >
           <Ionicons name="navigate-circle" size={18} color={primaryColor} />
           <Text style={[styles.address, { color: primaryColor }]}>{item.address}</Text>
        </TouchableOpacity>
      </View>

      {/* Actions (Uniquement si En attente) */}
      {item.status === 'pending' && (
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: "#10B981" }]} 
          onPress={() => handleSignify(item.id)}
          disabled={validating === item.id}
        >
          {validating === item.id ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>VALIDER LA REMISE (GPS)</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Marqueur si complété */}
      {item.status === 'completed' && (
        <View style={[styles.completedBar, { backgroundColor: "#DCFCE7" }]}>
           <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
           <Text style={{ fontSize: 12, fontWeight: '700', color: "#16A34A" }}>Signifié le 25/12/2025</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Mes Missions" showBack={true} />

      {/* Barre de Recherche */}
      <View style={[styles.searchContainer, { backgroundColor: primaryColor }]}>
        <View style={styles.searchInputBox}>
           <Ionicons name="search" size={20} color="#94A3B8" />
           <TextInput 
             placeholder="Rechercher RG, Nom, Adresse..."
             placeholderTextColor="#94A3B8"
             style={styles.input}
             value={searchQuery}
             onChangeText={setSearchQuery}
           />
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabContainer}>
         <TouchableOpacity 
           style={[styles.tab, activeTab === 'pending' && styles.activeTab, activeTab === 'pending' && { borderBottomColor: primaryColor }]}
           onPress={() => setActiveTab('pending')}
         >
           <Text style={[styles.tabText, activeTab === 'pending' && { color: primaryColor, fontWeight: '800' }]}>
             À SIGNIFIER ({missions.filter(m => m.status === 'pending').length})
           </Text>
         </TouchableOpacity>
         
         <TouchableOpacity 
           style={[styles.tab, activeTab === 'completed' && styles.activeTab, activeTab === 'completed' && { borderBottomColor: primaryColor }]}
           onPress={() => setActiveTab('completed')}
         >
           <Text style={[styles.tabText, activeTab === 'completed' && { color: primaryColor, fontWeight: '800' }]}>
             HISTORIQUE
           </Text>
         </TouchableOpacity>
      </View>

      {/* Liste */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={styles.loadingText}>Synchronisation des tournées...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMissions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name={activeTab === 'pending' ? "thumbs-up" : "time"} size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'pending' ? "Tout est en ordre !" : "Aucun historique"}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'pending' 
                   ? "Vous n'avez aucune mission de signification en attente." 
                   : "Vos actes signifiés apparaîtront ici."}
              </Text>
            </View>
          }
        />
      )}
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 20, 
    paddingTop: 10, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20 
  },
  searchInputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 45, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    gap: 10,
    backgroundColor: "#FFF"
  },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: "#1E293B" },
  
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3 },
  tabText: { fontSize: 12, fontWeight: '600', color: "#94A3B8", letterSpacing: 0.5 },

  card: { 
    padding: 16, 
    borderRadius: 18, 
    marginBottom: 16, 
    borderWidth: 1, 
    backgroundColor: "#FFF",
    borderColor: "#F1F5F9",
    // Ombres
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, elevation: 3
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  rgNumber: { fontSize: 18, fontWeight: '900', marginTop: 5, color: "#1E293B" },
  docBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  
  divider: { height: 1, marginVertical: 12, backgroundColor: "#F1F5F9" },
  
  recipientBox: { gap: 8, marginBottom: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recipientName: { fontSize: 14, fontWeight: '700', color: "#1E293B" },
  address: { fontSize: 13, textDecorationLine: 'underline', fontWeight: '500' },
  
  actionBtn: { 
    flexDirection: 'row', 
    height: 50, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    elevation: 2 
  },
  actionBtnText: { color: "#FFF", fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  
  completedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, gap: 6, marginTop: 5 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 15, color: "#94A3B8", fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 15, color: "#1E293B" },
  emptySub: { fontSize: 13, color: "#94A3B8", textAlign: "center", marginTop: 5 }
});