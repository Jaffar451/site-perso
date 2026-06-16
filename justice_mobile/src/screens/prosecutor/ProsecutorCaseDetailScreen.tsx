import StatusBadge from '../../components/ui/StatusBadge';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAppTheme } from '../../theme/AppThemeProvider';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import api from '../../services/api';
import { transitionComplaint } from '../../services/complaint.service';
import { ENV } from '../../config/env';

const confirm = (title: string, msg: string, onConfirm: () => void, destructive = false) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", onPress: onConfirm, style: destructive ? 'destructive' : 'default' },
    ]);
  }
};

const alertMsg = (title: string, msg: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

export default function ProsecutorCaseDetailScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();

  const params = route.params as { caseId: number };
  const id = params?.caseId;

  const [loading, setLoading]         = useState(true);
  const [acting, setActing]           = useState(false);
  const [caseData, setCaseData]       = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);

  const colors = {
    bgMain:         isDark ? "#0F172A" : "#F8FAFC",
    bgCard:         isDark ? "#1E293B" : "#FFFFFF",
    textMain:       isDark ? "#FFFFFF" : "#1E293B",
    textSub:        isDark ? "#94A3B8" : "#64748B",
    border:         isDark ? "#334155" : "#E2E8F0",
    justicePrimary: "#7C2D12",
    pdfBg:          isDark ? "#450A0A" : "#FEE2E2",
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!id) {
        alertMsg("Erreur", "Identifiant du dossier manquant.");
        navigation.goBack();
        return;
      }

      try {
        const res = await api.get(`/complaints/${id}`);
        if (!mounted) return;

        const d = res.data?.data || res.data;

        setCaseData({
          id:        d.id,
          rg:        d.trackingCode || `ND-${d.id}`,
          unite:     d.originStation?.name || "Unité inconnue",
          // ✅ Nom OPJ avec grade si disponible
          opj:       d.assignedOPJ
                       ? `${d.assignedOPJ.organization || ''} ${d.assignedOPJ.lastname || ''} ${d.assignedOPJ.firstname || ''}`.trim()
                       : "Non assigné",
          opjMatricule: d.assignedOPJ?.matricule || null,
          type:      d.title || "Qualification non définie",
          // ✅ Suspect = mis en cause (pas le plaignant)
          suspect:   d.defendantName || "Inconnu / X",
          plaignant: d.complainant
                       ? `${(d.complainant.lastname || '').toUpperCase()} ${d.complainant.firstname || ''}`.trim()
                       : "Ministère Public",
          statutGAV: d.custodyStatus || "Non spécifié",
          reçuLe:    d.createdAt
                       ? new Date(d.createdAt).toLocaleDateString("fr-FR") +
                         " à " +
                         new Date(d.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })
                       : "--/--",
          resume:    d.description || "Aucune description disponible.",
          // ✅ Synthèse OPJ
          pvDetails: d.pvDetails || d.pv_details || null,
          status:    d.status,
        });

        if (Array.isArray(d.attachments)) {
          setAttachments(d.attachments);
        }
      } catch (err: any) {
        if (!mounted) return;
        const status = err.response?.status;
        const msg = status === 404
          ? "Ce dossier est introuvable ou a été supprimé."
          : "Impossible de récupérer les données du serveur.";
        alertMsg("Erreur de chargement", msg);
        navigation.goBack();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  const handleDecision = (type: 'instruction' | 'complement' | 'classement') => {
    const titles = {
      instruction: "Ouverture d'Information Judiciaire",
      complement:  "Complément d'Enquête",
      classement:  "Classement sans suite",
    };
    const msgs = {
      // ✅ Message clair sur ce qui va se passer
      instruction: "Émettre le réquisitoire introductif et saisir un Juge d'Instruction (Art. 73 CPP) ?",
      complement:  "Retourner le dossier à l'OPJ pour actes supplémentaires ?",
      classement:  "Confirmer l'extinction de l'action publique pour ce dossier ?",
    };
    confirm(titles[type], msgs[type], () => executeDecision(type), type === 'classement');
  };

  const executeDecision = async (type: string) => {
    setActing(true);
    try {
      if (type === 'instruction') {
        // ✅ CORRECTION : transition vers "saisi_juge" (pas "figée")
        // "figée" = dossier archivé, "saisi_juge" = réquisitoire introductif émis (Art. 73 CPP)
        await transitionComplaint(Number(id), 'saisi_juge');
        alertMsg(
          "✅ Réquisitoire introductif émis",
          "Le dossier est transmis au Cabinet d'Instruction (Art. 73 CPP). Le Juge d'Instruction peut maintenant ouvrir l'information judiciaire."
        );
        navigation.goBack();

      } else if (type === 'complement') {
        // Renvoi à l'OPJ — PATCH direct car la machine d'état Procureur
        // ne gère pas ce renvoi (décision discrétionnaire du Parquet)
        await api.patch(`/complaints/${id}`, { status: 'en_cours_OPJ' });
        alertMsg("Renvoi enregistré", "Dossier retourné à l'OPJ pour complément d'enquête.");
        navigation.goBack();

      } else if (type === 'classement') {
        await transitionComplaint(Number(id), 'classée_sans_suite_par_procureur');
        alertMsg("Classement enregistré", "L'action publique est éteinte pour ce dossier.");
        navigation.goBack();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Échec de l'enregistrement de la décision.";
      alertMsg("Erreur", msg);
    } finally {
      setActing(false);
    }
  };

  const openAttachment = (file: any) => {
    const url = file.fileUrl || file.file_url;
    if (!url) { alertMsg("Erreur", "URL du fichier introuvable."); return; }

    const fullUrl = url.startsWith('http')
      ? url
      : `${ENV.API_URL.replace('/api', '')}/${url.replace(/\\/g, '/').replace(/^\//, '')}`;

    if (Platform.OS === 'web') {
      window.open(fullUrl, '_blank');
    } else {
      Linking.openURL(fullUrl).catch(() => alertMsg("Erreur", "Impossible d'ouvrir le fichier."));
    }
  };

  if (loading) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Chargement..." showBack />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.justicePrimary} />
        <Text style={{ marginTop: 10, color: colors.textSub }}>Synchronisation sécurisée...</Text>
      </View>
    </ScreenContainer>
  );

  if (!caseData) return null;

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Affaire RG #${caseData.rg}`} showBack />

      <ScrollView
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── TRANSMISSION PJ ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>TRANSMISSION PJ</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Ionicons name="shield-checkmark" size={20} color={colors.justicePrimary} />
              <Text style={[styles.cardText, { color: colors.textMain }]}>{caseData.unite}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Ionicons name="person-outline" size={20} color={colors.textSub} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardText, { color: colors.textMain }]}>OPJ : {caseData.opj}</Text>
                {caseData.opjMatricule && (
                  <Text style={[styles.dateMeta, { color: colors.textSub }]}>
                    Matr. {caseData.opjMatricule}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSub} />
              <Text style={[styles.dateMeta, { color: colors.textSub }]}>Transmis le {caseData.reçuLe}</Text>
            </View>
          </View>
        </View>

        {/* ── MIS EN CAUSE & INFRACTION ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>MIS EN CAUSE & INFRACTION</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.suspectName, { color: colors.textMain }]}>{caseData.suspect}</Text>
            <Text style={[styles.infractionText, { color: colors.justicePrimary }]}>
              {caseData.type?.toUpperCase()}
            </Text>
            <Text style={[styles.dateMeta, { color: colors.textSub, marginTop: 6 }]}>
              Plaignant : {caseData.plaignant}
            </Text>
            <View style={[styles.gavBadge, {
              backgroundColor: isDark ? "#422006" : "#FFFBEB",
              borderColor: isDark ? "#B4530950" : "#FBBF24"
            }]}>
              <Ionicons name="hourglass-outline" size={16} color="#F59E0B" />
              <Text style={[styles.gavText, { color: isDark ? "#FBBF24" : "#B45309" }]}>
                G.A.V : {caseData.statutGAV}
              </Text>
            </View>
          </View>
        </View>

        {/* ── SYNTHÈSE OPJ ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>SYNTHÈSE DE L'ENQUÊTE (OPJ)</Text>
          <View style={[styles.card, {
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            borderLeftColor: colors.justicePrimary,
            borderLeftWidth: 5,
          }]}>
            {caseData.pvDetails ? (
              <Text style={[styles.facts, { color: isDark ? "#CBD5E1" : "#475569" }]}>
                {caseData.pvDetails}
              </Text>
            ) : (
              <Text style={[styles.facts, { color: colors.textSub, fontStyle: 'italic' }]}>
                Aucune synthèse rédigée par l'OPJ.
              </Text>
            )}
          </View>
        </View>

        {/* ── DÉCLARATION PLAIGNANT ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>DÉCLARATION / PROCÈS-VERBAL</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.facts, { color: isDark ? "#CBD5E1" : "#475569" }]}>
              {caseData.resume}
            </Text>
          </View>
        </View>

        {/* ── SCELLÉES ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSub }]}>
            REGISTRE DES SCELLÉES ({attachments.length})
          </Text>
          {attachments.length === 0 ? (
            <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, alignItems: 'center' }]}>
              <Ionicons name="file-tray-outline" size={36} color={colors.textSub} />
              <Text style={[styles.dateMeta, { color: colors.textSub, marginTop: 8 }]}>
                Aucune pièce jointe répertoriée
              </Text>
            </View>
          ) : (
            attachments.map((file: any) => (
              <TouchableOpacity
                key={file.id}
                activeOpacity={0.8}
                style={[styles.attachmentRow, { backgroundColor: colors.pdfBg, borderColor: colors.border }]}
                onPress={() => openAttachment(file)}
              >
                <Ionicons name="document-attach-outline" size={22} color="#EF4444" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cardText, { color: colors.textMain }]} numberOfLines={1}>
                    {file.filename || `Scellé #${file.id}`}
                  </Text>
                  <Text style={[styles.dateMeta, { color: colors.textSub }]}>
                    Déposé le {new Date(file.createdAt ?? Date.now()).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ── ORIENTATION PROCÉDURE ── */}
        <Text style={[styles.sectionLabel, { color: colors.textSub, marginBottom: 15 }]}>
          ORIENTATION DE LA PROCÉDURE
        </Text>

        {acting ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color={colors.justicePrimary} />
            <Text style={{ marginTop: 10, color: colors.textSub }}>Enregistrement en cours...</Text>
          </View>
        ) : (
          <View style={styles.actionGrid}>
            <DecisionBtn
              label="Saisir l'Instruction"
              subLabel="Réquisitoire introductif — Art. 73 CPP"
              icon="hammer-outline"
              color={colors.justicePrimary}
              colors={colors}
              onPress={() => handleDecision('instruction')}
            />
            <DecisionBtn
              label="Complément d'enquête"
              subLabel="Renvoyer à l'OPJ"
              icon="arrow-undo-outline"
              color="#F59E0B"
              colors={colors}
              onPress={() => handleDecision('complement')}
            />
            <DecisionBtn
              label="Classement sans suite"
              subLabel="Clôturer le dossier"
              icon="archive-outline"
              color="#EF4444"
              colors={colors}
              onPress={() => handleDecision('classement')}
            />
          </View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const DecisionBtn = ({ label, subLabel, icon, color, onPress, colors }: any) => (
  <TouchableOpacity
    activeOpacity={0.8}
    style={[styles.decisionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
    onPress={onPress}
  >
    <View style={[styles.decisionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={26} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 15 }}>
      <Text style={[styles.decisionLabel, { color: colors.textMain }]}>{label}</Text>
      <Text style={[styles.decisionSub, { color: colors.textSub }]}>{subLabel}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSub} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  content:        { padding: 20, paddingBottom: 140 },
  section:        { marginBottom: 25 },
  sectionLabel:   { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginBottom: 12, textTransform: 'uppercase' },
  card:           { padding: 20, borderRadius: 24, borderWidth: 1.5, elevation: 2 },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText:       { fontSize: 14, fontWeight: '700' },
  dateMeta:       { fontSize: 12, fontWeight: '600' },
  suspectName:    { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  infractionText: { fontSize: 13, fontWeight: '800', marginTop: 5, letterSpacing: 0.5 },
  gavBadge:       { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginTop: 15, gap: 8, borderWidth: 1 },
  gavText:        { fontSize: 11, fontWeight: '900' },
  facts:          { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  attachmentRow:  { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  actionGrid:     { gap: 12 },
  decisionCard:   { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, borderWidth: 2 },
  decisionIcon:   { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  decisionLabel:  { fontSize: 15, fontWeight: '900' },
  decisionSub:    { fontSize: 11, fontWeight: '600', marginTop: 2 },
});