import React, { useState, useMemo, useCallback } from "react";
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl, 
  TextInput,
  Platform,
  StatusBar,
  Image
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { AdminScreenProps } from "../../types/navigation";
import { getAllUsers } from "../../services/admin.service"; 
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export interface UserData {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  matricule?: string;
  registrationNumber?: string;
  organization?: string;
  telephone?: string;
  is_active?: boolean;
  isActive?: boolean;
  photo?: string | null;
}

export default function AdminUsersScreen({ navigation }: AdminScreenProps<'AdminUsers'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
    searchSection: isDark ? "#1E293B" : primaryColor,
  };

  const { data, isLoading, refetch, error } = useQuery({
  queryKey: ["users"],
  queryFn: getAllUsers,
  staleTime: 1000 * 60 * 5,
  refetchOnMount: false,
  refetchOnWindowFocus: false,  // ✅ Bloque le refetch au retour sur l'app
  refetchOnReconnect: false,    // ✅ Bloque aussi sur reconnexion
});
  // ✅ Vide — React Query gère la fraîcheur via invalidateQueries depuis AdminUserDetailsScreen
  useFocusEffect(
    useCallback(() => {}, [])
  );

  const users: UserData[] = useMemo(() => {
    if (!data) return [];
    if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray((data as any).data)) {
      return (data as any).data;
    }
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter(u => 
      (u.lastname?.toLowerCase() || "").includes(term) ||
      (u.firstname?.toLowerCase() || "").includes(term) ||
      (u.matricule?.toLowerCase() || "").includes(term) ||
      (u.role?.toLowerCase() || "").includes(term) ||
      (u.email?.toLowerCase() || "").includes(term)
    );
  }, [users, search]);

  const getRoleConfig = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'admin': return { color: "#EF4444", label: "ADMIN" };
      case 'officier_police': 
      case 'police': return { color: "#3B82F6", label: "POLICE" };
      case 'commissaire': return { color: "#1D4ED8", label: "COMMISSAIRE" };
      case 'magistrat':
      case 'judge': return { color: "#8B5CF6", label: "MAGISTRAT" };
      case 'prosecutor': return { color: "#10B981", label: "PROCUREUR" };
      case 'greffier':
      case 'clerk': return { color: "#F59E0B", label: "GREFFIER" };
      default: return { color: colors.textSub, label: role?.toUpperCase() || "AGENT" };
    }
  };

  const renderItem = ({ item }: { item: UserData }) => {
    const roleConfig = getRoleConfig(item.role);
    const isSuspended = item.is_active === false || item.isActive === false;

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        style={[
          styles.card, 
          { backgroundColor: colors.bgCard, borderColor: colors.border },
          isSuspended && { opacity: 0.6 }
        ]}
        onPress={() => navigation.navigate("AdminUserDetails", { userId: item.id })}
      >
        <View style={[styles.avatar, { backgroundColor: roleConfig.color + "15" }]}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.initials, { color: roleConfig.color }]}>
              {item.lastname?.[0]?.toUpperCase()}{item.firstname?.[0]?.toUpperCase()}
            </Text>
          )}
        </View>
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textMain }]} numberOfLines={1}>
            {item.lastname?.toUpperCase()} {item.firstname}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: roleConfig.color }]}>
              <Text style={styles.badgeText}>{roleConfig.label}</Text>
            </View>
            <Text style={[styles.matricule, { color: colors.textSub }]} numberOfLines={1}>
              {item.matricule || item.registrationNumber || "SANS MATRICULE"}
            </Text>
            {isSuspended && (
              <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.badgeText}>BLOQUÉ</Text>
              </View>
            )}
          </View>
          <Text style={[styles.email, { color: colors.textSub }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Répertoire Agents" showBack={true} />
      
      <View style={[styles.searchContainer, { backgroundColor: colors.searchSection }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.bgMain : "#FFFFFF" }]}>
          <Ionicons name="search-outline" size={20} color={colors.textSub} />
          <TextInput 
            style={[styles.searchInput, { color: isDark ? "#FFFFFF" : "#1E293B" }]}
            placeholder="Nom, matricule, fonction, email..."
            placeholderTextColor={colors.textSub}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search !== "" && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loaderText, { color: colors.textSub }]}>Accès à la base agents...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={60} color="#EF4444" />
            <Text style={{ color: "#EF4444", marginTop: 15, fontWeight: '800' }}>ÉCHEC DE SYNCHRONISATION</Text>
            <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: primaryColor }]}>
              <Text style={{ color: "#FFF", fontWeight: "900" }}>RÉESSAYER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={primaryColor} 
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="people-outline" size={80} color={colors.border} />
                <Text style={{ textAlign: 'center', marginTop: 15, color: colors.textSub, fontWeight: '700' }}>
                  {search ? "Aucun agent ne correspond à votre recherche" : "Aucun agent trouvé"}
                </Text>
              </View>
            }
          />
        )}
      </View>
      
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => navigation.navigate("AdminCreateUser")}
      >
        <Ionicons name="person-add-outline" size={26} color="#fff" />
      </TouchableOpacity>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: { paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, zIndex: 10 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 18, paddingHorizontal: 16, height: 54 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
  mainWrapper: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  loaderText: { marginTop: 15, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  listPadding: { padding: 16, paddingTop: 25, paddingBottom: 160 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 14, borderWidth: 1.5 },
  avatar: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 18 },
  initials: { fontSize: 18, fontWeight: "900" },
  info: { flex: 1 },
  name: { fontWeight: '900', fontSize: 16, marginBottom: 5, letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  matricule: { fontSize: 11, fontWeight: '700' },
  email: { fontSize: 12, fontWeight: '500' },
  retryBtn: { marginTop: 25, paddingHorizontal: 30, paddingVertical: 14, borderRadius: 16, elevation: 4 },
  fab: { position: 'absolute', bottom: 100, right: 25, width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', zIndex: 99 }
});