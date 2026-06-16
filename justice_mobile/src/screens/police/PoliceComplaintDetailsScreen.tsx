// PATH: src/screens/police/PoliceComplaintDetailScreen.tsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StatusBar, Platform, Linking, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppTheme } from '../../theme/AppThemeProvider';
import { PoliceScreenProps } from '../../types/navigation';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import StatusBadge from '../../components/ui/StatusBadge';
import { ENV } from '../../config/env';

import { getComplaintById, submitToOPJ, Complaint } from '../../services/complaint.service';

// ── Ouvre un fichier sans quitter l'app ──────────────────────
const openFile = (url: string) => {
  if (Platform.OS === 'web') window.open(url, '_blank');
  else Linking.openURL(url);
};

export default function PoliceComplaintDetailScreen({ route, navigation }: PoliceScreenProps<'PoliceComplaintDetails'>) {
  const { theme, isDark } = useAppTheme();
  const queryClient = useQueryClient();
  const primaryColor = theme.colors.primary;

  const complaintId = (route.params as any)?.complaintId ?? (route.params as any)?.id;

  const colors = {
    bgMain:   isDark ? "#0F172A" : "#F8FAFC",
    bgCard:   isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    headerBg: isDark ? "#172554" : "#EFF6FF",
  };

  const { data: complaint, isLoading } = useQuery<Complaint>({
    queryKey: ['complaint', complaintId],
    queryFn: () => getComplaintById(Number(complaintId)),
    enabled: !!complaintId,
  });

  const mutation = useMutation<any, Error, number>({
    mutationFn: (id: number) => submitToOPJ(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', complaintId] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      const msg = "L'enquête préliminaire a été ouverte.";
      if (Platform.OS === 'web') window.alert(`Succès ✅\n\n${msg}`);
      else Alert.alert("Succès ✅", msg);
    },
    onError: () => {
      Alert.alert("Erreur ❌", "Impossible de modifier le statut du dossier.");
    },
  });

  const handleTakeCharge = () => {
    const title   = "Prise en charge du dossier";
    const message = "Confirmez-vous l'ouverture de l'enquête préliminaire ?";
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) mutation.mutate(Number(complaintId));
    } else {
      Alert.alert(title, message, [
        { text: "Annuler", style: "cancel" },
        { text: "Ouvrir l'enquête", onPress: () => mutation.mutate(Number(complaintId)) },
      ]);
    }
  };

  // ── Nom du plaignant — supporte complainant ET citizen ────────
  const getPlaignantName = () => {
    const c = complaint as any;
    if (c?.complainant) {
      return `${(c.complainant.lastname || '').toUpperCase()} ${c.complainant.firstname || ''}`.trim();
    }
    if (c?.citizen) {
      return `${(c.citizen.lastname || '').toUpperCase()} ${c.citizen.firstname || ''}`.trim();
    }
    return c?.citizenName || "Identité non spécifiée";
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

  if (isLoading || !complaint) {
    return (
      <ScreenContainer withPadding={false}>
        <AppHeader title="Chargement..." showBack />
        <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </ScreenContainer>
    );
  }

  const canTakeCharge = complaint.status === 'soumise';

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title={`DOSSIER #${complaint.trackingCode || complaint.id}`} showBack />

      <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: colors.bgMain }}>

        {/* EN-TÊTE */}
        <View style={[styles.headerCard, { backgroundColor: colors.headerBg, borderColor: primaryColor }]}>
          <View style={styles.rowBetween}>
            <StatusBadge status={complaint.status} />
            <Text style={[styles.date, { color: colors.textSub }]}>
              {new Date(complaint.createdAt ?? complaint.filedAt ?? Date.now()).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <Text style={[styles.title, { color: isDark ? "#FFF" : primaryColor }]}>
            {complaint.title || "Plainte sans titre"}
          </Text>
          <View style={styles.plaignantBox}>
            <Ionicons name="person" size={16} color={primaryColor} />
            <Text style={[styles.subtitle, { color: colors.textMain }]}>
              Plaignant : <Text style={styles.bold}>{getPlaignantName()}</Text>
            </Text>
          </View>
        </View>

        {/* RÉCIT DES FAITS */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Récit des faits</Text>
          <Text style={[styles.description, { color: colors.textMain }]}>{complaint.description}</Text>
        </View>

        {/* PIÈCES JOINTES */}
        {(complaint as any).attachments?.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSub }]}>
              Scellées & Preuves ({(complaint as any).attachments.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(complaint as any).attachments.map((file: any, index: number) => {
                const fileUrl = getFullFileUrl(file);
                const isImg   = isImageFile(file.filename, file.mimeType);
                return (
                  <TouchableOpacity
                    key={file.id || index}
                    activeOpacity={0.8}
                    style={[styles.attachThumb, { backgroundColor: isDark ? "#0F172A" : "#F1F5F9", borderColor: colors.border }]}
                    onPress={() => fileUrl && openFile(fileUrl)}
                  >
                    {isImg && fileUrl ? (
                      <Image source={{ uri: fileUrl }} style={styles.attachImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.attachDoc}>
                        <Ionicons name="document-text" size={24} color={primaryColor} />
                        <Text style={[styles.attachExt, { color: colors.textSub }]}>
                          {file.filename?.split('.').pop()?.toUpperCase() || 'DOC'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.attachName, { color: colors.textSub }]} numberOfLines={1}>
                      {file.filename || `#${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ACTIONS PROCÉDURALES */}
        <Text style={[styles.sectionHeader, { color: colors.textSub }]}>Gestion de la procédure</Text>

        <View style={styles.actionGrid}>
          {canTakeCharge ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: primaryColor }]}
              onPress={handleTakeCharge}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={22} color="#FFF" />
                  <Text style={styles.actionBtnText}>OUVRIR L'ENQUÊTE PRÉLIMINAIRE</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtn, { backgroundColor: '#10B981', opacity: 0.8 }]}>
              <Ionicons name="checkmark-done-circle" size={22} color="#FFF" />
              <Text style={styles.actionBtnText}>ENQUÊTE DÉJÀ OUVERTE</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: primaryColor, borderWidth: 1.5 }]}
            onPress={() => navigation.navigate('CreateSummon', { complaintId: Number(complaintId) })}
          >
            <Ionicons name="mail" size={22} color={primaryColor} />
            <Text style={[styles.actionBtnText, { color: primaryColor }]}>CONVOQUER UNE PARTIE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => navigation.navigate("PolicePVScreen", { complaintId: Number(complaintId) })}
          >
            <Ionicons name="document-attach" size={22} color={colors.textMain} />
            <Text style={[styles.actionBtnText, { color: colors.textMain }]}>AJOUTER UN PROCÈS-VERBAL</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container:     { padding: 20 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard:    { padding: 20, borderRadius: 20, borderWidth: 1, borderLeftWidth: 8, marginBottom: 20 },
  rowBetween:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  date:          { fontSize: 12, fontWeight: '700' },
  title:         { fontSize: 19, fontWeight: '900', marginBottom: 10 },
  plaignantBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subtitle:      { fontSize: 14, fontWeight: '500' },
  bold:          { fontWeight: '800' },
  card:          { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  sectionTitle:  { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  description:   { fontSize: 15, lineHeight: 24 },
  sectionHeader: { fontSize: 12, fontWeight: '900', marginBottom: 15, textTransform: 'uppercase', opacity: 0.6 },
  actionGrid:    { gap: 12 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, borderRadius: 16, gap: 12 },
  actionBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5, color: '#FFF' },
  attachThumb:   { marginRight: 12, width: 80, alignItems: 'center', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  attachImg:     { width: 80, height: 80 },
  attachDoc:     { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  attachExt:     { fontSize: 9, fontWeight: '800', marginTop: 2 },
  attachName:    { fontSize: 9, fontWeight: '600', textAlign: 'center', padding: 4 },
});