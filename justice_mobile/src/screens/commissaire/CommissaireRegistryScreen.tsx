import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAppTheme } from '../../theme/AppThemeProvider';
import { useComplaints } from '../../hooks/useComplaints';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';

export default function CommissaireRegistryScreen() {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const navigation = useNavigation<any>();
  
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch, isRefetching } = useComplaints('all');

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
  };

  const registryData = useMemo(() => {
    if (!data) return [];
    const list = Array.isArray(data) ? data : (data.data || []);
    if (!Array.isArray(list)) return [];

    if (searchQuery.trim() === "") return list;

    const query = searchQuery.toLowerCase();
    return list.filter((item: any) => 
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.trackingCode && item.trackingCode.toLowerCase().includes(query)) ||
      (item.complainant?.lastname && item.complainant.lastname.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'cloture': return '#10B981';
      case 'transmise_parquet': return '#8B5CF6';
      case 'attente_validation': return '#F59E0B';
      default: return primaryColor;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.rowCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => navigation.navigate('CommissaireActionDetail', { id: item.id })}
    >
      <View style={styles.colId}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.idText, { color: colors.textMain }]}>#{item.trackingCode?.slice(-6) || item.id}</Text>
        <Text style={[styles.dateText, { color: colors.textSub }]}>
          {new Date(item.createdAt ?? Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
        </Text>
      </View>

      <View style={styles.colInfo}>
        <Text style={[styles.titleText, { color: colors.textMain }]} numberOfLines={1}>
          {item.title || "Procédure sans titre"}
        </Text>
        <Text style={[styles.complainantText, { color: colors.textSub }]} numberOfLines={1}>
          Plaignant: {item.complainant?.lastname || "Anonyme"} {item.complainant?.firstname}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Registre Central" showBack />

      <View style={{ flex: 1, backgroundColor: colors.bgMain }}>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.bgMain, borderBottomColor: colors.border }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSub} />
            <TextInput 
              placeholder="Rechercher (Nom, N° PV...)"
              placeholderTextColor={colors.textSub}
              style={[styles.input, { color: colors.textMain }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textSub} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <FlatList 
            data={registryData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.countText, { color: colors.textSub }]}>
                  {registryData.length} procédure(s) enregistrée(s)
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.centerEmpty}>
                <Ionicons name="folder-open-outline" size={60} color={colors.textSub} style={{ opacity: 0.5 }} />
                <Text style={{ color: colors.textSub, marginTop: 10 }}>Aucun dossier trouvé.</Text>
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
  centerEmpty: { alignItems: "center", marginTop: 100 },
  
  searchContainer: { padding: 16, borderBottomWidth: 1 },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', height: 50, 
    borderRadius: 12, paddingHorizontal: 12, borderWidth: 1 
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, height: '100%' },

  listContent: { paddingBottom: 100 },
  listHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  countText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  rowCard: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 14, paddingHorizontal: 20, 
    borderBottomWidth: 1,
  },
  colId: { width: 80 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  idText: { fontSize: 13, fontWeight: '900' },
  dateText: { fontSize: 11 },

  colInfo: { flex: 1, paddingHorizontal: 10 },
  titleText: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  complainantText: { fontSize: 13 },
});