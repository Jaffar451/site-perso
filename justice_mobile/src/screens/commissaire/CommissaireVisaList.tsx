import StatusBadge from '../../components/ui/StatusBadge';
import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ✅ Architecture & Store
import { useAppTheme } from '../../theme/AppThemeProvider'; 
import { useComplaints } from '../../hooks/useComplaints';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';

export default function CommissaireVisaList() {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const navigation = useNavigation<any>();
  
  // ✅ Connexion API
  const { data, isLoading, refetch, isRefetching } = useComplaints();

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    bannerBg: isDark ? "#1E3A8A40" : "#F0F9FF",
  };

  // 🔍 Filtrage strict : Dossiers en attente de visa du Commissaire
  // ✅ SÉCURISATION DU FILTRE CONTRE LE CRASH
  const visaData = useMemo(() => {
    // Si pas de données, retourne liste vide
    if (!data) return [];
    
    // Normalisation : data peut être un tableau OU un objet { data: [...] }
    const list = Array.isArray(data) ? data : (data.data || []);

    // Vérifie que c'est bien un tableau avant de filtrer
    if (!Array.isArray(list)) {
        console.warn("⚠️ Format de données inattendu dans CommissaireVisaList:", data);
        return [];
    }

    // Filtre les statuts
    return list.filter((item: any) => item.status === 'attente_validation');
  }, [data]);

  const renderDossierItem = ({ item }: { item: any }) => {
    const isUrgent = item.priority === 'high' || item.priority === 'Urgent';
    
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        onPress={() => navigation.navigate('CommissaireActionDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        <View style={[styles.priorityBadge, { backgroundColor: isUrgent ? '#EF4444' : '#8B5CF6' }]}>
          <Ionicons name={isUrgent ? "alert-circle" : "shield-checkmark"} size={12} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.priorityText}>{isUrgent ? 'URGENT' : 'À VISER'}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={[styles.dossierId, { color: colors.textSub }]}>RG N° {item.trackingCode || item.id}</Text>
            <Text style={[styles.dateText, { color: colors.textSub }]}>{new Date(item.filedAt ?? item.createdAt ?? Date.now()).toLocaleDateString('fr-FR')}</Text>
          </View>
          
          <Text style={[styles.typeText, { color: colors.textMain }]} numberOfLines={1}>
            {item.title || 'Information Judiciaire'}
          </Text>
          <Text style={[styles.categoryText, { color: colors.textSub }]}>
            {item.category || 'Enquête Préliminaire'}
          </Text>
          
          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            <View style={styles.opjTag}>
              <View style={[styles.opjAvatar, { backgroundColor: primaryColor + '20' }]}>
                  <Ionicons name="person" size={12} color={primaryColor} />
              </View>
              <Text style={[styles.opjName, { color: colors.textSub }]}>Rapporteur: {item.opjName || 'OPJ en charge'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={primaryColor} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Visas en Attente" showBack />
      
      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <View style={[styles.infoBanner, { backgroundColor: colors.bannerBg, borderColor: primaryColor + '30' }]}>
          <Ionicons name="information-circle-outline" size={22} color={primaryColor} />
          <Text style={[styles.infoText, { color: isDark ? "#BAE6FD" : primaryColor }]}>
            Vérifiez la conformité des procès-verbaux avant signature et transmission au Parquet de Niamey.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loaderText, { color: colors.textSub }]}>Accès au registre sécurisé...</Text>
          </View>
        ) : (
          <FlatList
            data={visaData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDossierItem}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={primaryColor} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-done-circle-outline" size={80} color={isDark ? "#334155" : "#CBD5E1"} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>Aucun visa requis</Text>
                <Text style={[styles.emptySub, { color: colors.textSub }]}>Toutes les procédures ont été visées ou sont en cours d'enquête.</Text>
              </View>
            }
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listPadding: { padding: 16, paddingBottom: 140 },
  infoBanner: { 
    flexDirection: 'row', 
    padding: 16, 
    margin: 16, 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
  },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' } // ✅ Ajout Web
    }),
  },
  priorityBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    borderBottomRightRadius: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  priorityText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardContent: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dossierId: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  dateText: { fontSize: 12, fontWeight: '700' },
  typeText: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  categoryText: { fontSize: 14, fontWeight: '600', marginBottom: 20 },
  footerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 15, 
    borderTopWidth: 1, 
  },
  opjTag: { flexDirection: 'row', alignItems: 'center' },
  opjAvatar: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  opjName: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: 15, fontWeight: '800', letterSpacing: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginTop: 20 },
  emptySub: { fontSize: 15, marginTop: 10, textAlign: 'center', fontWeight: '500', lineHeight: 22 },
});