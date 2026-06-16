// PATH: src/screens/citizen/CitizenComplaintDetailsScreen.tsx
import StatusBadge from '../../components/ui/StatusBadge';
import React, { useState, useCallback } from "react";
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Platform, StatusBar, Linking, Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from "@react-navigation/native";

import { useAppTheme } from "../../theme/AppThemeProvider";
import { CitizenScreenProps } from "../../types/navigation";
import { getComplaintById, Complaint } from "../../services/complaint.service";
import { ENV } from "../../config/env";
import api from "../../services/api";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

const QUEUE_KEY = '@justice_offline_queue';

// ── Ouvre un fichier sans quitter l'app ──────────────────────
const openFile = (url: string) => {
  if (Platform.OS === 'web') window.open(url, '_blank');
  else Linking.openURL(url);
};

// ── Confirmation cross-platform ───────────────────────────────
const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ]);
  }
};

export default function CitizenComplaintDetailsScreen({ navigation, route }: CitizenScreenProps<'ComplaintDetail'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;

  const id = (route.params as any)?.id ?? (route.params as any)?.complaintId;

  const [complaint, setComplaint]       = useState<Complaint | null>(null);
  const [loading, setLoading]           = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  // ── Palette thème cohérente avec le reste de l'app ───────────
  const colors = {
    bgMain:   isDark ? "#0F172A" : "#F8FAFC",
    bgCard:   isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    icon:     isDark ? "#CBD5E1" : "#64748B",
  };

  // ── Chargement ────────────────────────────────────────────────
  const load = async () => {
    if (!id) return;
    try {
      if (!complaint) setLoading(true);

      if (String(id).startsWith("TEMP-")) {
        setIsOfflineMode(true);
        const realId = String(id).replace("TEMP-", "");
        const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
        const queue = queueJson ? JSON.parse(queueJson) : [];
        const action = queue.find((item: any) => item.id === realId);
        if (action) {
          setComplaint({
            ...action.payload,
            id: id as any,
            status: "soumise",
            filedAt: new Date(action.timestamp).toISOString(),
            isOfflinePending: true,
            attachments: action.payload.attachments || [],
          });
        }
      } else {
        setIsOfflineMode(false);
        const data = await getComplaintById(Number(id));
        setComplaint(data);
      }
    } catch (error) {
      console.error("Erreur chargement plainte:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [id]));

  // ── Nom du plaignant — supporte complainant ET citizen ────────
  const getPlaignantName = () => {
    const c = complaint as any;
    // Backend retourne "complainant" (alias Sequelize)
    if (c?.complainant) {
      const { lastname, firstname } = c.complainant;
      return `${(lastname || '').toUpperCase()} ${firstname || ''}`.trim();
    }
    // Fallback "citizen" (ancien alias)
    if (c?.citizen) {
      const { lastname, firstname } = c.citizen;
      return `${(lastname || '').toUpperCase()} ${firstname || ''}`.trim();
    }
    return c?.citizenName || null;
  };

  // ── URL fichier ───────────────────────────────────────────────
  const getFullFileUrl = (file: any): string | null => {
    if (!file) return null;
    const url = file.fileUrl || file.file_url || file.uri;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;
    const relative = url || file.filename;
    if (relative) {
      const base = ENV.API_URL.replace('/api', '');
      return `${base}/${relative.replace(/^\//, '')}`;
    }
    return null;
  };

  const isImageFile = (filename?: string, mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return true;
    if (!filename) return false;
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
  };

  // ── Suppression pièce jointe ──────────────────────────────────
  const handleDeleteAttachment = (attachmentId: number) => {
    confirmAction(
      "Supprimer la pièce jointe",
      "Cette action est irréversible. Confirmer ?",
      async () => {
        setDeletingId(attachmentId);
        try {
          await api.delete(`/attachments/${attachmentId}`);
          setComplaint(prev => prev ? {
            ...prev,
            attachments: prev.attachments?.filter((a: any) => a.id !== attachmentId),
          } : prev);
        } catch (err: any) {
          const msg = err?.response?.data?.message || "Impossible de supprimer le fichier.";
          if (Platform.OS === 'web') window.alert(msg);
          else Alert.alert("Erreur", msg);
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  // ── Timeline procédurale ──────────────────────────────────────
  const steps = [
    { key: "soumise",           label: "Dépôt",    icon: "send" },
    { key: "en_cours_OPJ",      label: "Enquête",  icon: "shield" },
    { key: "transmise_parquet", label: "Parquet",  icon: "briefcase" },
    { key: "saisi_juge",        label: "Siège",    icon: "scale" },
    { key: "figée",             label: "Décision", icon: "hammer" },
  ];

  const getActiveIndex = (status: string) => {
    if (isOfflineMode) return 0;
    const s = status?.toLowerCase() || "";
    if (["attente_validation", "en_cours_opj"].includes(s)) return 1;
    if (s === "transmise_parquet") return 2;
    if (s === "saisi_juge") return 3;
    if (["figée", "classée_sans_suite_par_ojp", "classée_sans_suite_par_procureur"].includes(s)) return 4;
    return 0;
  };

  const activeIndex = complaint ? getActiveIndex(complaint.status) : 0;
  const isEditable  = complaint?.status === 'soumise' && !isOfflineMode;
  const plaignantName = getPlaignantName();

  // ── États de chargement ───────────────────────────────────────
  if (loading && !complaint) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Détails" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    </ScreenContainer>
  );

  if (!complaint) return null;

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title={`Dossier #${complaint.trackingCode || (isOfflineMode ? "SYNC" : id)}`} showBack />

      <View style={[styles.mainWrapper, { backgroundColor: colors.bgMain }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ALERTE HORS LIGNE */}
          {isOfflineMode && (
            <View style={styles.offlineAlert}>
              <Ionicons name="cloud-offline" size={20} color="#EA580C" />
              <View style={{ flex: 1 }}>
                <Text style={styles.offlineTitle}>En attente de connexion</Text>
                <Text style={styles.offlineText}>Ce dossier sera transmis automatiquement.</Text>
              </View>
            </View>
          )}

          {/* PARCOURS PROCÉDURAL */}
          <View style={[styles.timelineCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Parcours de la procédure</Text>
            <View style={styles.timeline}>
              {steps.map((step, i) => {
                const isDone    = i <= activeIndex;
                const isCurrent = i === activeIndex;
                return (
                  <View key={step.key} style={styles.stepWrapper}>
                    <View style={[styles.stepCircle, { backgroundColor: isDone ? primaryColor : (isDark ? "#334155" : "#F1F5F9") }]}>
                      <Ionicons name={step.icon as any} size={14} color={isDone ? "#fff" : colors.icon} />
                    </View>
                    <Text style={[styles.stepLabel, { color: isCurrent ? primaryColor : colors.icon, fontWeight: isCurrent ? "900" : "600" }]}>
                      {step.label}
                    </Text>
                    {i < steps.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: i < activeIndex ? primaryColor : (isDark ? "#334155" : "#F1F5F9") }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* STATUT */}
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <StatusBadge status={complaint.status} />
              <Text style={[styles.date, { color: colors.textSub }]}>
                {new Date(complaint.filedAt ?? complaint.createdAt ?? Date.now()).toLocaleDateString("fr-FR")}
              </Text>
            </View>

            {/* IDENTITÉ DU PLAIGNANT */}
            {plaignantName && (
              <View style={[styles.authorBadge, { backgroundColor: isDark ? "#0F172A" : "#F1F5F9" }]}>
                <Ionicons name="person" size={12} color={primaryColor} />
                <Text style={[styles.authorText, { color: primaryColor }]}>
                  SOUMISSIONNAIRE : {plaignantName}
                </Text>
              </View>
            )}

            <Text style={[styles.title, { color: colors.textMain }]}>
              {complaint.title || (complaint as any).provisionalOffence || "Plainte sans titre"}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.description, { color: colors.textMain }]}>{complaint.description}</Text>
          </View>

          {/* PIÈCES JOINTES */}
          <View style={styles.attachmentsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>
              Documents & Preuves ({complaint.attachments?.length || 0})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsList}>
              {complaint.attachments && complaint.attachments.length > 0 ? (
                complaint.attachments.map((file: any, index: number) => {
                  const fileUrl   = getFullFileUrl(file);
                  const isImg     = isImageFile(file.filename, file.mimeType);
                  const isDeleting = deletingId === file.id;

                  return (
                    <View key={file.id || index} style={styles.attachmentWrapper}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.attachmentThumb, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC", borderColor: colors.border }]}
                        onPress={() => fileUrl && openFile(fileUrl)}
                      >
                        {isImg && fileUrl ? (
                          <Image source={{ uri: fileUrl }} style={styles.fullImg} resizeMode="cover" />
                        ) : (
                          <View style={styles.docIcon}>
                            <Ionicons name="document-text" size={28} color={primaryColor} />
                            <Text style={styles.extText}>
                              {file.filename?.split('.').pop()?.toUpperCase() || 'DOC'}
                            </Text>
                          </View>
                        )}
                        {isDeleting && (
                          <View style={styles.deletingOverlay}>
                            <ActivityIndicator color="#fff" size="small" />
                          </View>
                        )}
                      </TouchableOpacity>

                      <Text style={[styles.attachName, { color: colors.textSub }]} numberOfLines={1}>
                        {file.filename || `Preuve #${index + 1}`}
                      </Text>

                      {isEditable && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteAttachment(file.id)}
                          disabled={isDeleting}
                        >
                          <Ionicons name="trash-outline" size={13} color="#EF4444" />
                          <Text style={styles.deleteBtnText}>Supprimer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="images-outline" size={24} color={colors.textSub} />
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucune preuve jointe.</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* ACTIONS */}
          <View style={styles.footerSpacing}>
            {!isEditable ? (
              <View style={[styles.lockBox, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC" }]}>
                <Ionicons name="lock-closed" size={20} color={primaryColor} />
                <Text style={[styles.lockText, { color: colors.textSub }]}>
                  Ce dossier est en cours de traitement. Les modifications sont verrouillées.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: primaryColor }]}
                onPress={() => navigation.navigate('CitizenEditComplaint', { complaint })}
              >
                <Ionicons name="create" size={20} color="#fff" />
                <Text style={styles.editBtnText}>MODIFIER LA PLAINTE</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:             { flex: 1, justifyContent: "center", alignItems: "center" },
  mainWrapper:        { flex: 1 },
  scrollView:         { flex: 1 },
  scrollContent:      { padding: 16 },
  offlineAlert:       { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 20, alignItems: 'center', gap: 12, borderWidth: 1, backgroundColor: "#FFEDD5", borderColor: "#C2410C" },
  offlineTitle:       { fontWeight: '900', fontSize: 13, textTransform: 'uppercase', color: "#C2410C" },
  offlineText:        { fontSize: 12, marginTop: 2, fontWeight: '500', color: "#9A3412" },
  timelineCard:       { padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
  sectionTitle:       { fontSize: 11, fontWeight: "900", marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 },
  timeline:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 5 },
  stepWrapper:        { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle:         { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  stepLabel:          { fontSize: 9, marginTop: 8, textAlign: 'center' },
  stepLine:           { position: 'absolute', top: 17, left: '50%', width: '100%', height: 2, zIndex: 1 },
  card:               { padding: 22, borderRadius: 24, marginBottom: 20, borderWidth: 1 },
  statusRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  authorBadge:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignSelf: 'flex-start' },
  authorText:         { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  title:              { fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 },
  date:               { fontSize: 12, fontWeight: '600' },
  divider:            { height: 1, marginVertical: 18 },
  description:        { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  attachmentsSection: { marginBottom: 10 },
  attachmentsList:    { flexDirection: 'row', paddingVertical: 5 },
  attachmentWrapper:  { marginRight: 15, alignItems: 'center', width: 90 },
  attachmentThumb:    { width: 80, height: 80, borderRadius: 16, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  fullImg:            { width: '100%', height: '100%' },
  docIcon:            { alignItems: 'center', justifyContent: 'center' },
  extText:            { fontSize: 9, fontWeight: '800', color: "#64748B", marginTop: 2 },
  attachName:         { fontSize: 10, marginTop: 6, fontWeight: '600', textAlign: 'center' },
  deletingOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteBtn:          { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FEE2E2' },
  deleteBtnText:      { fontSize: 10, color: '#EF4444', fontWeight: '700' },
  emptyState:         { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  emptyText:          { fontStyle: 'italic', fontSize: 13 },
  footerSpacing:      { marginTop: 20, paddingBottom: 130 },
  lockBox:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 20 },
  lockText:           { fontSize: 12, flex: 1, fontWeight: '600', lineHeight: 18 },
  editBtn:            { flexDirection: 'row', height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 12 },
  editBtnText:        { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});