import StatusBadge from '../../components/ui/StatusBadge';
// PATH: src/screens/judge/JudgeCaseList.tsx
import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  StatusBar, 
  Alert, 
  DimensionValue,
  Platform,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

// ✅ Architecture & Thème
import { useAppTheme } from '../../theme/AppThemeProvider'; 
import { JudgeScreenProps } from '../../types/navigation';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';

// ✅ Services
import api from '../../services/api';

// --- TYPES ---
interface ApiCase {
  id: number;
  trackingCode: string;
  title: string; 
  description: string;
  status: string; 
  suspectName?: string;
  createdAt: string;
  detentionStatus?: string; 
}

/**
 * 📡 RÉCUPÉRATION DES DOSSIERS DU CABINET
 */
const fetchJudgeCases = async () => {
  // Récupère les dossiers assignés ou en attente d'instruction
  const { data } = await api.get('/complaints'); 
  return data as ApiCase[];
};

export default function JudgeCaseList({ navigation }: JudgeScreenProps<'JudgeCaseList'>) {
  const { theme, isDark } = useAppTheme();
  
  // ✅ Identité : Violet Judiciaire
  const JUDGE_ACCENT = "#7C3AED"; 
  
  const [activeTab, setActiveTab] = useState<'new' | 'ongoing'>('new');
  const [searchQuery, setSearchQuery] = useState('');

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#F1F5F9",
    tabActive: JUDGE_ACCENT + (isDark ? "30" : "15"),
  };

  // Synchronisation des données réelles
  const { data: rawCases, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['judge-cases'],
    queryFn: fetchJudgeCases
  });

  // Filtrage et Transformation
  const filteredData = useMemo(() => {
    if (!rawCases) return [];

    return rawCases.filter(c => {
        // Nouveaux : dossiers transmis par le Procureur non encore enrôlés
        const isNew = c.status === 'transmise_parquet' || c.status === 'attente_validation';
        // En cours : dossiers déjà en phase d'instruction
        const isOngoing = c.status === 'instruction' || c.status === 'en_cours_OPJ';

        if (activeTab === 'new' && !isNew) return false;
        if (activeTab === 'ongoing' && !isOngoing) return false;

        const search = searchQuery.toLowerCase();
        return (
            (c.title?.toLowerCase() || "").includes(search) ||
            (c.trackingCode?.toLowerCase() || "").includes(search) ||
            (c.suspectName?.toLowerCase() || "").includes(search)
        );
    }).map(c => ({
        id: c.trackingCode || `RG-${c.id}/26`,
        dbId: c.id,
        type: (c.status === 'transmise_parquet' || c.status === 'attente_validation') ? 'new' : 'ongoing',
        offence: c.title || "Qualification en attente",
        suspect: c.suspectName || "X (Inconnu)",
        dateReceived: new Date(c.createdAt ?? Date.now()).toLocaleDateString('fr-FR'),
        detentionStatus: c.detentionStatus || "Libre",
        progress: c.status === 'cloture' ? 100 : (c.status === 'instruction' ? 60 : 20)
    }));
  }, [rawCases, activeTab, searchQuery]);

  /**
   * ⚖️ LOGIQUE D'ENRÔLEMENT (Saisine du Cabinet)
   */
  const handleEnrollment = (item: any) => {
    const title = "Enrôlement du Dossier ⚖️";
    const msg = `Voulez-vous accepter la saisine du Parquet pour le dossier ${item.id} et débuter l'instruction ?`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) navigation.navigate('CaseDetail', { caseId: item.dbId });
    } else {
        Alert.alert(title, msg, [
          { text: "Plus tard", style: "cancel" },
          { text: "Enrôler", onPress: () => navigation.navigate('CaseDetail', { caseId: item.dbId }) }
        ]);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isNew = activeTab === 'new';

    return (
      <TouchableOpacity 
        style={[
            styles.card, 
            { backgroundColor: colors.bgCard, borderColor: isNew ? JUDGE_ACCENT : colors.border },
            isNew && { borderLeftWidth: 8 }
        ]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CaseDetail', { caseId: item.dbId })}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.rgNumber, { color: isNew ? JUDGE_ACCENT : colors.textSub }]}>{item.id}</Text>
            {item.detentionStatus === 'Mandat de Dépôt' && (
              <View style={[styles.mdBadge, { backgroundColor: isDark ? "#450A0A" : "#FEE2E2" }]}>
                <Ionicons name="lock-closed" size={10} color="#EF4444" />
                <Text style={styles.mdText}>M.D.</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.offenceTitle, { color: colors.textMain }]} numberOfLines={2}>{item.offence}</Text>
          
          <View style={styles.row}>
            <Ionicons name="person-circle-outline" size={16} color={JUDGE_ACCENT} />
            <Text style={[styles.suspectText, { color: colors.textSub }]}>
                Inculpé : <Text style={[styles.bold, { color: colors.textMain }]}>{item.suspect}</Text>
            </Text>
          </View>

          {!isNew && (
            <View style={styles.progressBox}>
              <View style={[styles.progressContainer, { backgroundColor: isDark ? "#334155" : "#F1F5F9" }]}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${item.progress}%` as DimensionValue, 
                      backgroundColor: JUDGE_ACCENT 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSub }]}>Instruction : {item.progress}%</Text>
            </View>
          )}

          {isNew ? (
              <View style={[styles.newActionRow, { borderTopColor: colors.border }]}>
                <Text style={styles.receivedTime}>Reçu : {item.dateReceived}</Text>
                <TouchableOpacity 
                  style={[styles.enrollBtn, { backgroundColor: JUDGE_ACCENT }]}
                  onPress={() => handleEnrollment(item)}
                >
                  <Text style={styles.enrollText}>ENRÔLER</Text>
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
          ) : (
            <View style={styles.footerRow}>
               <Text style={[styles.statusText, { color: JUDGE_ACCENT }]}>{item.detentionStatus.replace(/_/g, ' ')}</Text>
               <Ionicons name="chevron-forward" size={18} color={JUDGE_ACCENT} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Rôle d'Instruction" showBack />

      {/* 🔍 FILTRES ET RECHERCHE */}
      <View style={[styles.filterSection, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSub} />
          <TextInput 
            placeholder="Nom, N° de dossier ou code..." 
            placeholderTextColor={colors.textSub}
            style={[styles.searchInput, { color: colors.textMain }]}
            onChangeText={setSearchQuery}
            value={searchQuery}
          />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[
                styles.tab, 
                { borderColor: colors.border },
                activeTab === 'new' && { backgroundColor: colors.tabActive, borderColor: JUDGE_ACCENT }
            ]}
            onPress={() => setActiveTab('new')}
          >
            <Text style={[styles.tabText, { color: colors.textSub }, activeTab === 'new' && { color: JUDGE_ACCENT, fontWeight: '900' }]}>
              Réquisitoires
            </Text>
            {activeTab === 'new' && filteredData.length > 0 && <View style={[styles.badgeDot, { backgroundColor: '#EF4444' }]} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
                styles.tab, 
                { borderColor: colors.border },
                activeTab === 'ongoing' && { backgroundColor: colors.tabActive, borderColor: JUDGE_ACCENT }
            ]}
            onPress={() => setActiveTab('ongoing')}
          >
            <Text style={[styles.tabText, { color: colors.textSub }, activeTab === 'ongoing' && { color: JUDGE_ACCENT, fontWeight: '900' }]}>
              En Instruction
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        {isLoading ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={JUDGE_ACCENT} />
                <Text style={{ marginTop: 15, color: colors.textSub, fontWeight: '700' }}>Liaison Greffe...</Text>
            </View>
        ) : (
            <FlatList 
                data={filteredData}
                keyExtractor={item => item.dbId.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={8}
              windowSize={5}
              initialNumToRender={10}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={JUDGE_ACCENT} />
                }
                ListEmptyComponent={
                <View style={styles.emptyView}>
                    <Ionicons name="folder-open-outline" size={80} color={colors.border} />
                    <Text style={[styles.emptyText, { color: colors.textSub }]}>
                      Aucun dossier {activeTab === 'new' ? 'à enrôler' : 'en cours'} pour le moment.
                    </Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterSection: { padding: 20, paddingBottom: 15, borderBottomWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 16, marginBottom: 15, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tabText: { fontSize: 12, fontWeight: '700' },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  listContent: { padding: 20, paddingBottom: 140 },
  card: { borderRadius: 24, marginBottom: 18, borderWidth: 1, elevation: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 },
  cardContent: { padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rgNumber: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  mdBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  mdText: { fontSize: 9, fontWeight: '900', color: '#EF4444' },
  offenceTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  suspectText: { fontSize: 14, fontWeight: '500' },
  bold: { fontWeight: '900' },
  progressBox: { marginBottom: 15 },
  progressContainer: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 10, fontWeight: '800', marginTop: 5, textAlign: 'right' },
  newActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 15, borderTopWidth: 1 },
  receivedTime: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', fontWeight: '700' },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8, elevation: 2 },
  enrollText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 15, marginTop: 5 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  emptyView: { alignItems: 'center', marginTop: 100, paddingHorizontal: 50 },
  emptyText: { marginTop: 20, fontWeight: '700', textAlign: 'center', lineHeight: 22 }
});