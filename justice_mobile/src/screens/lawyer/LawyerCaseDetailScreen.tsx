import StatusBadge from '../../components/ui/StatusBadge';
import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  ActivityIndicator, 
  Alert,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import { useQuery } from "@tanstack/react-query";

// ✅ 1. Imports Architecture
import { useAppTheme } from "../../theme/AppThemeProvider";
import { LawyerScreenProps } from "../../types/navigation";
import { useAuthStore } from "../../stores/useAuthStore";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Services
import { getComplaintById } from "../../services/complaint.service";

// Interface étendue pour inclure les pièces jointes
interface CaseDetail {
  id: number;
  trackingCode?: string;
  status: string;
  station?: { name: string };
  attachments?: { id: number; filename: string; file_url: string; createdAt?: string }[];
}

export default function LawyerCaseDetailScreen({ route, navigation }: LawyerScreenProps<'LawyerCaseDetail'>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  // Couleur Or pour les avocats (ou primaire du thème)
  const primaryColor = isDark ? "#D4AF37" : theme.colors.primary; 
  const { user } = useAuthStore();
  
  const { caseId } = route.params; 
  const [uploading, setUploading] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    successBg: isDark ? "#064E3B" : "#DCFCE7",
    dangerBg: isDark ? "#450A0A" : "#FEF2F2",
    dangerIcon: isDark ? "#F87171" : "#DC2626",
  };

  /**
   * 📥 RÉCUPÉRATION DES DONNÉES DU DOSSIER (React Query)
   */
  const { data: caseData, isLoading, refetch } = useQuery({
    queryKey: ['lawyer-case-detail', caseId],
    queryFn: async () => {
        const data = await getComplaintById(caseId);
        return data as CaseDetail;
    }
  });

  /**
   * ⚖️ DÉPÔT NUMÉRIQUE DE CONCLUSIONS (E-Barreau)
   */
  const handleUploadConclusions = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploading(true);
      
      // TODO: Remplacer par l'appel API réel d'upload
      // await uploadDocument(caseId, result.assets[0]);
      
      // Simulation
      setTimeout(() => {
        setUploading(false);
        if (Platform.OS === 'web') window.alert("Succès\n\nVos conclusions ont été transmises au greffe et versées au dossier numérique.");
        else Alert.alert("Succès", "Vos conclusions ont été transmises au greffe et versées au dossier numérique.");
        refetch(); // Rafraîchir la liste des pièces
      }, 1500);

    } catch (error) {
      setUploading(false);
      if (Platform.OS === 'web') window.alert("Échec\n\nErreur lors de l'envoi du document PDF.");
      else Alert.alert("Échec", "Erreur lors de l'envoi du document PDF.");
    }
  };

  if (isLoading) return (
    <ScreenContainer withPadding={false}>
       <AppHeader title="Chargement..." showBack />
       <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
           <ActivityIndicator size="large" color={primaryColor} />
           <Text style={[styles.loadingText, { color: colors.textSub }]}>Accès au dossier numérique...</Text>
       </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      
      <AppHeader 
        title={`RG #${caseData?.trackingCode || caseId}`} 
        showBack={true} 
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.bgMain }]}
      >
        
        {/* 🏛️ BANDEAU D'ÉTAT */}
        <View style={[styles.statusCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, { backgroundColor: primaryColor + '15' }]}>
                <StatusBadge status={caseData?.status ?? ''} />
            </View>
            <Text style={[styles.caseType, { color: colors.textSub }]}>CABINET D'INSTRUCTION</Text>
          </View>
          
          <View style={[styles.locationBox, { backgroundColor: colors.dangerBg }]}>
            <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color={colors.dangerIcon} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={[styles.locationLabel, { color: colors.dangerIcon }]}>LOCALISATION AU TRIBUNAL</Text>
              <Text style={[styles.locationValue, { color: colors.textMain }]}>
                {caseData?.station?.name || "Palais de Justice"}
              </Text>
            </View>
          </View>
        </View>

        {/* ⚡ ACTION DE LA DÉFENSE */}
        <View style={styles.actionSection}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Actions de la Défense</Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.uploadBtn, { backgroundColor: primaryColor }]}
              onPress={handleUploadConclusions}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="document-attach-outline" size={22} color="white" />
                  <Text style={styles.uploadBtnText}>DÉPOSER DES CONCLUSIONS PDF</Text>
                </>
              )}
            </TouchableOpacity>
        </View>

        {/* 📂 PIÈCES DE LA PROCÉDURE */}
        <View style={styles.headerPieces}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Pièces au Dossier</Text>
            <View style={[styles.countBadge, { backgroundColor: isDark ? "#334155" : "#F1F5F9" }]}>
                <Text style={styles.countText}>{caseData?.attachments?.length || 0}</Text>
            </View>
        </View>
        
        {caseData?.attachments && caseData.attachments.length > 0 ? (
          caseData.attachments.map((doc: any, index: number) => (
            <TouchableOpacity 
              key={index} 
              activeOpacity={0.7}
              style={[styles.docItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => Linking.openURL(doc.file_url)}
            >
              <View style={[styles.iconBox, { backgroundColor: primaryColor + "10" }]}>
                <Ionicons name="document-text" size={22} color={primaryColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.docName, { color: colors.textMain }]} numberOfLines={1}>
                    {doc.filename || "Pièce jointe"}
                </Text>
                <Text style={[styles.docDate, { color: colors.textSub }]}>
                    Versé le : {doc.createdAt ? new Date(doc.createdAt ?? Date.now()).toLocaleDateString("fr-FR") : "Date inconnue"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Ionicons name="file-tray-outline" size={48} color={colors.textSub} />
            <Text style={[styles.emptyText, { color: colors.textSub }]}>
                Aucune pièce n'a encore été versée au dossier numérique.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ✅ SmartFooter autonome */}
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontWeight: "600", fontSize: 13 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  statusCard: { 
    padding: 20, borderRadius: 24, marginBottom: 25, borderWidth: 1, elevation: 4, 
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  caseType: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  
  locationBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF", justifyContent: 'center', alignItems: 'center', elevation: 2 },
  locationLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 2 },
  locationValue: { fontSize: 15, fontWeight: "800" },

  actionSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 15 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    paddingVertical: 18, borderRadius: 20, gap: 12, elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 5 }
  },
  uploadBtnText: { color: 'white', fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },

  headerPieces: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  countText: { fontSize: 12, fontWeight: "800", color: "#64748B" },
  
  docItem: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, 
    marginBottom: 12, borderWidth: 1,
  },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  docName: { fontWeight: "800", fontSize: 15 },
  docDate: { fontSize: 12, marginTop: 4, fontWeight: "500" },

  emptyBox: { 
    padding: 40, alignItems: 'center', borderRadius: 24,
    borderWidth: 2, borderStyle: 'dashed' 
  },
  emptyText: { textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: "500", lineHeight: 20 }
});