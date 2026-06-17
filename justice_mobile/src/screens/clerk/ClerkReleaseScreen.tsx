import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// ✅ 1. Imports Architecture
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { ClerkScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

interface Detainee {
  id: string;
  ecrouNumber: string; 
  name: string;
  entryDate: string;
  prison: string;
  status: "DETAINED" | "RELEASED";
  caseReference: string;
}

export default function ClerkReleaseScreen() {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const navigation = useNavigation();
  const { user } = useAuthStore();

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    activeBadgeBg: isDark ? "#450A0A" : "#FEE2E2",
    activeBadgeText: isDark ? "#F87171" : "#DC2626",
  };

  // États
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [detainee, setDetainee] = useState<Detainee | null>(null);
  const [releaseReason, setReleaseReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      if (Platform.OS === 'web') window.alert("Recherche\n\nVeuillez saisir un numéro d'écrou valide.");
      else Alert.alert("Recherche", "Veuillez saisir un numéro d'écrou valide.");
      return;
    }
    setIsSearching(true);
    setDetainee(null);

    // Simulation e-Justice
    setTimeout(() => {
      setDetainee({
        id: "101",
        ecrouNumber: searchQuery.toUpperCase(),
        name: "Ibrahim Sani MAHAMANE",
        entryDate: "12/12/2024",
        prison: "Maison d'Arrêt de Niamey",
        status: "DETAINED",
        caseReference: "RP-2024-0089"
      });
      setIsSearching(false);
    }, 1200);
  };

  const handleReleaseSubmit = () => {
    if (!releaseReason) {
      if (Platform.OS === 'web') window.alert("Motif manquant\n\nSélectionnez le fondement juridique de la libération.");
      else Alert.alert("Motif manquant", "Sélectionnez le fondement juridique de la libération.");
      return;
    }

    const title = "SIGNATURE ÉLECTRONIQUE";
    const msg = `Générer un ordre de mise en liberté pour ${detainee?.name} ? Cet acte sera notifié au Régisseur.`;

    if (Platform.OS === 'web') {
        if (window.confirm(`${title} : ${msg}`)) processRelease();
    } else {
        Alert.alert(title, msg, [
          { text: "Annuler", style: "cancel" },
          { text: "Signer l'acte", style: "destructive", onPress: processRelease }
        ]);
    }
  };

  const processRelease = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (Platform.OS === 'web') window.alert("✅ Levée d'écrou enregistrée.");
      navigation.goBack();
    }, 2000);
  };

  const reasons = [
    { id: "END_SENTENCE", label: "Fin de Peine", icon: "time-outline" },
    { id: "PROVISIONAL", label: "Liberté Provisoire", icon: "document-text-outline" },
    { id: "ACQUITTAL", label: "Relaxe / Acquittement", icon: "checkmark-circle-outline" },
    { id: "PARDON", label: "Grâce Présidentielle", icon: "star-outline" },
  ];

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Levée d'Écrou" showBack />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 🔍 RECHERCHE ÉCROU */}
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.labelHeader, { color: colors.textSub }]}>RECHERCHE AU REGISTRE PÉNITENTIAIRE</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                placeholder="N° d'écrou (ex: 4521/24)"
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.searchBtn, { backgroundColor: primaryColor }]}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? <ActivityIndicator color="#FFF" /> : <Ionicons name="search" size={24} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* 📄 FICHE DE DÉTENTION (Apparaît après recherche) */}
          {detainee && (
            <View style={[styles.detaineeCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <View style={[styles.statusStrip, { backgroundColor: "#DC2626" }]} />
              <View style={styles.detaineeBody}>
                <View style={styles.detaineeMain}>
                  <Text style={[styles.detaineeName, { color: colors.textMain }]}>{detainee.name}</Text>
                  <View style={styles.badgeRow}>
                      <View style={[styles.activeBadge, { backgroundColor: colors.activeBadgeBg }]}>
                        <Text style={[styles.activeBadgeText, { color: colors.activeBadgeText }]}>SOUS ÉCROU</Text>
                      </View>
                      <Text style={[styles.caseRef, { color: colors.textSub }]}>RG #{detainee.caseReference}</Text>
                  </View>
                </View>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="business-outline" size={16} color={primaryColor} />
                    <Text style={[styles.infoText, { color: colors.textSub }]}>{detainee.prison}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color={primaryColor} />
                    <Text style={[styles.infoText, { color: colors.textSub }]}>Incarcéré le {detainee.entryDate}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ⚖️ FORMULAIRE DE LIBÉRATION */}
          {detainee && (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, marginTop: 10 }]}>
              <Text style={[styles.labelHeader, { color: colors.textSub }]}>MOTIF JURIDIQUE DE LA MISE EN LIBERTÉ</Text>
              
              <View style={styles.reasonsGrid}>
                {reasons.map((r) => {
                  const isActive = releaseReason === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      activeOpacity={0.7}
                      onPress={() => setReleaseReason(r.id)}
                      style={[
                        styles.reasonBtn,
                        { 
                          backgroundColor: isActive ? primaryColor : colors.inputBg,
                          borderColor: isActive ? primaryColor : colors.border 
                        }
                      ]}
                    >
                      <Ionicons name={r.icon as any} size={20} color={isActive ? "#FFF" : colors.textSub} />
                      <Text style={[styles.reasonText, { color: isActive ? "#FFF" : colors.textSub }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.labelHeader, { color: colors.textSub, marginTop: 25 }]}>RÉFÉRENCES DE LA DÉCISION</Text>
              <TextInput
                style={[styles.textArea, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                placeholder="Ex: Ordonnance de liberté provisoire n°12..."
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />

              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.submitBtn, { backgroundColor: primaryColor }]}
                onPress={handleReleaseSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={22} color="#FFF" />
                    <Text style={styles.submitText}>SIGNER LA LEVÉE D'ÉCROU</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 140 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 22, borderRadius: 28, borderWidth: 1, ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  labelHeader: { fontSize: 10, fontWeight: "900", marginBottom: 15, letterSpacing: 1.5, textTransform: 'uppercase' },
  
  searchRow: { flexDirection: "row", gap: 12 },
  searchInput: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 18, height: 60, fontSize: 16, fontWeight: "700" },
  searchBtn: { width: 60, height: 60, borderRadius: 16, justifyContent: "center", alignItems: "center" },

  detaineeCard: { borderRadius: 28, overflow: 'hidden', flexDirection: 'row', marginBottom: 15, marginTop: 15, borderWidth: 1, ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 4 } }) },
  statusStrip: { width: 8 },
  detaineeBody: { flex: 1, padding: 22 },
  
  // ✅ Correction TS2339 : Ajout de detaineeMain
  detaineeMain: { 
    marginBottom: 12 
  },

  detaineeName: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  activeBadgeText: { fontSize: 9, fontWeight: '900' },
  caseRef: { fontSize: 12, fontWeight: '800' },
  
  infoGrid: { marginTop: 22, gap: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 13, fontWeight: '700' },

  reasonsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  reasonBtn: { width: "48.3%", padding: 18, borderRadius: 18, borderWidth: 1.5, alignItems: "center", justifyContent: "center", gap: 10 },
  reasonText: { fontSize: 11, fontWeight: "800", textTransform: 'uppercase', textAlign: 'center' },

  textArea: { borderWidth: 1.5, borderRadius: 18, padding: 18, fontSize: 15, minHeight: 110, marginTop: 10, fontWeight: '600', lineHeight: 22 },

  submitBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 22, 
    borderRadius: 22, 
    gap: 12, 
    marginTop: 35,
    ...Platform.select({
        ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
        android: { elevation: 6 },
        web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" }
    })
  },
  submitText: { color: "#FFF", fontWeight: "900", fontSize: 14, letterSpacing: 1.5 }
});