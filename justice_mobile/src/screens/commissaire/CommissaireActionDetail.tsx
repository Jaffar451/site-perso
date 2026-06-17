// PATH: src/screens/commissaire/CommissaireActionDetail.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, StatusBar, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Print from 'expo-print';

// ✅ Services existants — alignés avec le reste du projet
import { useAppTheme } from '../../theme/AppThemeProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import { getComplaintById, transitionComplaint } from '../../services/complaint.service';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { ENV } from '../../config/env';

// ── Helpers cross-platform ────────────────────────────────────
const alertMsg = (title: string, msg: string) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
};

const confirmAction = (title: string, msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: 'Relire', style: 'cancel' },
      { text: 'Viser et Envoyer', onPress: onConfirm },
    ]);
  }
};

export default function CommissaireActionDetail() {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const queryClient = useQueryClient();
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const params = route.params as { id?: number; complaintId?: number };
  const dossierId = params?.id || params?.complaintId;

  // 🎨 Palette dynamique
  const colors = {
    bgMain:   isDark ? '#0F172A' : '#F8FAFC',
    bgCard:   isDark ? '#1E293B' : '#FFFFFF',
    textMain: isDark ? '#FFFFFF' : '#1E293B',
    textSub:  isDark ? '#94A3B8' : '#64748B',
    border:   isDark ? '#334155' : '#F1F5F9',
    pvBg:     isDark ? '#111827' : '#F0F7FF',
    opjBg:    isDark ? '#1E293B' : '#F8FAFC',
  };

  // ✅ Utilise le service existant
  const { data: complaint, isLoading, isError } = useQuery({
    queryKey: ['complaint', dossierId],
    queryFn: () => getComplaintById(dossierId!),
    enabled: !!dossierId,
    retry: 1,
  });

  // ── Helpers extraction ────────────────────────────────────────

  const getPlaignantName = () => {
    const c = complaint as any;
    if (c?.complainant) return `${(c.complainant.lastname || '').toUpperCase()} ${c.complainant.firstname || ''}`.trim();
    if (c?.citizen)     return `${(c.citizen.lastname || '').toUpperCase()} ${c.citizen.firstname || ''}`.trim();
    return 'Non renseigné';
  };

  // ✅ OPJ via relation assignedOPJ (incluse par le backend)
  const getOPJName = () => {
    const c = complaint as any;
    if (c?.assignedOPJ) {
      const grade = c.assignedOPJ.organization || c.assignedOPJ.rank || 'OPJ';
      return `${grade} ${(c.assignedOPJ.lastname || '').toUpperCase()} ${c.assignedOPJ.firstname || ''}`.trim();
    }
    return 'Non assigné';
  };

  const getOPJMatricule = () => {
    const c = complaint as any;
    return c?.assignedOPJ?.matricule || c?.assignedOPJ?.registrationNumber || null;
  };

  // ✅ Synthèse OPJ — plusieurs nommages possibles
  const getPvDetails = () => {
    const c = complaint as any;
    return c?.pvDetails || c?.pv_details || c?.syntheseOPJ || c?.synthesis || null;
  };

  const getStation = () => {
    const c = complaint as any;
    return c?.originStation?.name || c?.policeStation?.name || 'Commissariat Central';
  };

  // ── Génération PV ─────────────────────────────────────────────
  const generatePV = async () => {
    if (!complaint) return;
    setGeneratingPDF(true);

    const date = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const dateTime = new Date().toLocaleString('fr-FR');
    const commissaireName = user
      ? `${(user.lastname || '').toUpperCase()} ${user.firstname || ''}`
      : 'Le Commissaire';
    const opjName = getOPJName();
    const opjMatricule = getOPJMatricule();
    const plaignant = getPlaignantName();
    const pvDetails = getPvDetails();
    const ref = (complaint as any).trackingCode || `#${dossierId}`;
    const pvNumber = `A-${new Date().getFullYear()}-${String(dossierId).padStart(4, '0')}`;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: "Times New Roman", serif; margin: 40px 60px; font-size: 12pt; line-height: 1.9; }
    .header-grid { display: table; width: 100%; margin-bottom: 10px; }
    .header-left { display: table-cell; width: 45%; vertical-align: top; font-size: 11pt; }
    .header-right { display: table-cell; width: 55%; text-align: right; vertical-align: top; font-size: 11pt; }
    .pv-title { text-align: center; margin: 20px 0; }
    .pv-title h1 { font-size: 14pt; text-transform: uppercase; border-bottom: 3px double #000; display: inline-block; padding-bottom: 6px; }
    .analyse { border-left: 4px solid #000; padding-left: 12px; margin: 15px 0; font-size: 11pt; }
    .preambule { border: 1px solid #000; padding: 12px 16px; margin: 20px 0; font-size: 11pt; }
    h2 { font-size: 12pt; text-transform: uppercase; font-weight: bold; margin-top: 22px; border-bottom: 1px solid #000; padding-bottom: 3px; }
    .corps { text-align: justify; font-size: 12pt; }
    .corps p { margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11pt; }
    th { background: #000; color: #fff; padding: 6px 10px; text-align: left; }
    td { border: 1px solid #000; padding: 5px 10px; }
    .cloture { border: 2px solid #000; padding: 14px; margin-top: 20px; }
    .cloture-title { text-align: center; font-weight: bold; text-transform: uppercase; font-size: 12pt; margin-bottom: 10px; }
    .footer { margin-top: 40px; font-size: 9pt; color: #444; border-top: 1px solid #999; padding-top: 6px; text-align: center; }
  </style>
</head>
<body>
  <div class="header-grid">
    <div class="header-left">
      <strong>REPUBLIQUE DU NIGER</strong><br/>
      Fraternité — Travail — Progrès<br/>
      ──────────────────────<br/>
      Ministère de l'Intérieur<br/>
      Direction Générale de la Police Nationale<br/>
      <strong>${getStation()}</strong>
    </div>
    <div class="header-right">
      N° PV : <strong>${pvNumber}</strong><br/>
      Du : ${date}<br/><br/>
      Vu les articles 17 à 20 et 75<br/>
      du Code de Procédure Pénale du Niger
    </div>
  </div>

  <div class="pv-title">
    <h1>Procès-Verbal d'Enquête Préliminaire</h1>
    <p style="font-style:italic;font-size:10pt;">Transmission au Parquet — Art. 19 CPP Niger</p>
  </div>

  <div class="analyse">
    <strong>ANALYSE :</strong><br/>
    Dossier Réf. : <strong>${ref}</strong><br/>
    Objet : <strong>${(complaint as any).title || 'Infraction non qualifiée'}</strong><br/>
    Plaignant(e) : <strong>${plaignant}</strong><br/>
    OPJ enquêteur : <strong>${opjName}</strong>${opjMatricule ? ` — Matr. ${opjMatricule}` : ''}
  </div>

  <div class="preambule">
    Nous soussigné(e)s :<br/><br/>
    <strong>${opjName}</strong>, Officier de Police Judiciaire${opjMatricule ? `, Matricule ${opjMatricule}` : ''},<br/>
    en poste à ${getStation()} ;<br/><br/>
    Ce jour, <strong>${dateTime}</strong>, agissant conformément aux articles 17 à 20 du CPP Niger,
    rapportons les opérations suivantes :
  </div>

  <h2>I — Exposé des Faits</h2>
  <div class="corps">
    <p>${(complaint as any).description?.replace(/\n/g, '<br/>') || 'Aucune déclaration.'}</p>
  </div>

  <h2>II — Constatations de l'O.P.J.</h2>
  <div class="corps">
    <p>${pvDetails?.replace(/\n/g, '<br/>') ||
      `L'Officier de Police Judiciaire <strong>${opjName}</strong> a procédé à l'audition du(de la) plaignant(e)
      et des témoins. Les éléments recueillis ont été consignés et versés au dossier.`
    }</p>
    ${(complaint as any).location ? `<p><strong>Lieu des faits :</strong> ${(complaint as any).location}</p>` : ''}
  </div>

  <h2>III — Scellés et Pièces à Conviction</h2>
  <table>
    <thead>
      <tr><th>N°</th><th>Désignation</th><th>Date</th></tr>
    </thead>
    <tbody>
      ${(complaint as any).attachments?.length > 0
        ? (complaint as any).attachments.map((f: any, i: number) => `
          <tr>
            <td>${i + 1}</td>
            <td>${f.filename || 'Pièce jointe'}</td>
            <td>${f.createdAt ? new Date(f.createdAt).toLocaleDateString('fr-FR') : date}</td>
          </tr>`).join('')
        : `<tr><td colspan="3" style="text-align:center;font-style:italic;">Aucune pièce répertoriée</td></tr>`
      }
    </tbody>
  </table>

  <div class="cloture">
    <div class="cloture-title">IV — Clôture et Visa Hiérarchique</div>
    <p>
      Nous, <strong>${commissaireName}</strong>, Commissaire de Police, certifions que l'enquête
      préliminaire menée par l'OPJ <strong>${opjName}</strong> a été conduite conformément aux
      articles 17 à 20 et 69 à 75 du CPP Niger. Nous ordonnons la transmission au Procureur
      de la République (Art. 39 CPP).
    </p>
    <p style="text-align:center;font-weight:bold;font-size:13pt;margin-top:14px;">
      [ VISA HIÉRARCHIQUE APPOSÉ — DOSSIER CERTIFIÉ RÉGULIER ]
    </p>
  </div>

  <div style="margin-top:50px;display:flex;justify-content:space-between;text-align:center;font-size:11pt;">
    <div style="width:45%;">
      L'OPJ enquêteur<br/><strong>${opjName}</strong><br/><br/><br/>
      <div style="border-top:1px solid #000;padding-top:5px;">Signature et cachet</div>
    </div>
    <div style="width:45%;">
      Le Commissaire<br/><strong>${commissaireName}</strong><br/><br/><br/>
      <div style="border-top:1px solid #000;padding-top:5px;">Signature et cachet</div>
    </div>
  </div>

  <div style="margin-top:30px;text-align:center;">Fait et clos à Niamey, le ${date}</div>

  <div class="footer">
    PV N° ${pvNumber} — e-Justice Niger — Réf. ${ref} — Généré le ${dateTime}
  </div>
</body>
</html>`;

    try {
      if (Platform.OS === 'web') {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
          newWindow.focus();
          setTimeout(() => newWindow.print(), 500);
        } else {
          const blob = new Blob([html], { type: 'text/html' });
          window.open(URL.createObjectURL(blob), '_blank');
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch {
      alertMsg('Erreur PDF', 'Impossible de générer le procès-verbal.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // ── Mutation transmission ─────────────────────────────────────
  const mutation = useMutation({
    mutationFn: () => transitionComplaint(dossierId!, 'transmise_parquet'),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaint', dossierId] });
      await generatePV();
      alertMsg('✅ Visa Apposé', 'Dossier transmis au Procureur de la République (Art. 39 CPP).');
      navigation.popToTop();
    },
    onError: (error: any) => {
      alertMsg('Échec Transmission', error?.response?.data?.message || 'Erreur de connexion serveur.');
    },
  });

  const handleVisaAndTransmit = () => {
    if (!complaint) return;
    confirmAction(
      'Visa Institutionnel',
      `En validant, vous apposez votre signature numérique sur le dossier ${(complaint as any).trackingCode || dossierId} et ordonnez sa transmission au Procureur.`,
      () => mutation.mutate()
    );
  };

  const handleReject = () => {
    confirmAction(
      'Retour à l\'OPJ',
      'Retourner ce dossier à l\'OPJ pour complément d\'enquête ?',
      async () => {
        try {
          await transitionComplaint(dossierId!, 'en_cours_OPJ');
          queryClient.invalidateQueries({ queryKey: ['complaints'] });
          alertMsg('Renvoi effectué', 'Dossier retourné à l\'OPJ.');
          navigation.goBack();
        } catch (e: any) {
          alertMsg('Erreur', e?.response?.data?.message || 'Impossible de renvoyer le dossier.');
        }
      }
    );
  };

  // ── États chargement / erreur ─────────────────────────────────
  if (isLoading) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Chargement..." showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 10, color: colors.textSub }}>Récupération du dossier...</Text>
      </View>
      <SmartFooter />
    </ScreenContainer>
  );

  if (isError || !complaint) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Erreur" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#EF4444" />
        <Text style={{ marginTop: 10, color: colors.textMain, fontWeight: 'bold' }}>Dossier introuvable.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: primaryColor, fontWeight: 'bold' }}>Retour</Text>
        </TouchableOpacity>
      </View>
      <SmartFooter />
    </ScreenContainer>
  );

  const pvDetails = getPvDetails();
  const isPending = mutation.isPending || generatingPDF;

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <AppHeader title={`Révision #${(complaint as any).trackingCode || dossierId}`} showBack />

      <ScrollView
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── BANDEAU DOSSIER ── */}
        <View style={[styles.infoCard, { backgroundColor: primaryColor }]}>
          <View style={styles.headerIconRow}>
            <Ionicons name="shield-checkmark" size={22} color="#FFF" />
            <Text style={styles.whiteLabel}>VISA DU COMMISSAIRE — ART. 19 CPP NIGER</Text>
          </View>
          <Text style={styles.whiteTitle}>
            {(complaint as any).title || 'Information Judiciaire'}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 6 }}>
            Plaignant : {getPlaignantName()}
          </Text>
        </View>

        {/* ── CARTE OPJ ── */}
        <View style={[styles.opjCard, { backgroundColor: colors.opjBg, borderColor: colors.border }]}>
          <View style={[styles.opjIconBox, { backgroundColor: primaryColor + '20' }]}>
            <Ionicons name="shield-outline" size={22} color={primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.opjLabel, { color: colors.textSub }]}>OPJ ENQUÊTEUR</Text>
            <Text style={[styles.opjName, { color: colors.textMain }]}>{getOPJName()}</Text>
            {getOPJMatricule() && (
              <Text style={[styles.opjSub, { color: colors.textSub }]}>Matr. {getOPJMatricule()}</Text>
            )}
          </View>
          <View style={[styles.stationBox, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="business-outline" size={14} color={colors.textSub} />
            <Text style={[styles.stationText, { color: colors.textSub }]} numberOfLines={2}>
              {getStation()}
            </Text>
          </View>
        </View>

        {/* ── DÉCLARATION PLAIGNANT ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>DÉCLARATION DU PLAIGNANT</Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.bodyText, { color: colors.textMain }]}>
              {(complaint as any).description || 'Aucune déclaration enregistrée.'}
            </Text>
          </View>
        </View>

        {/* ── SYNTHÈSE OPJ ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>SYNTHÈSE DE L'ENQUÊTE (OPJ)</Text>
          {pvDetails ? (
            <View style={[styles.card, {
              backgroundColor: colors.pvBg,
              borderColor: colors.border,
              borderLeftColor: primaryColor,
              borderLeftWidth: 5,
            }]}>
              <Text style={[styles.bodyText, { color: colors.textMain, fontStyle: 'italic' }]}>
                {pvDetails}
              </Text>
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>
                Synthèse non encore rédigée par l'OPJ.{'\n'}Le dossier peut être renvoyé pour complément.
              </Text>
            </View>
          )}
        </View>

        {/* ── SCELLÉS ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>
            SCELLÉS ET PIÈCES ({(complaint as any).attachments?.length || 0})
          </Text>
          {(complaint as any).attachments?.length > 0 ? (
            (complaint as any).attachments.map((file: any) => (
              <View key={file.id} style={[styles.fileRow, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <View style={[styles.fileIcon, { backgroundColor: '#EF444415' }]}>
                  <Ionicons name="document-text" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: colors.textMain }]} numberOfLines={1}>
                    {file.filename || `Scellé #${file.id}`}
                  </Text>
                  {file.createdAt && (
                    <Text style={[styles.fileDate, { color: colors.textSub }]}>
                      {new Date(file.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucune pièce à conviction.</Text>
            </View>
          )}
        </View>

        {/* ── DESTINATION ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>DESTINATION DE L'ACTE</Text>
          <View style={[styles.destinationCard, { backgroundColor: colors.bgCard, borderColor: primaryColor + '40' }]}>
            <View style={[styles.destIcon, { backgroundColor: primaryColor + '15' }]}>
              <Ionicons name="business" size={22} color={primaryColor} />
            </View>
            <View>
              <Text style={[styles.destLabel, { color: colors.textSub }]}>Parquet de destination :</Text>
              <Text style={[styles.destValue, { color: colors.textMain }]}>
                Procureur de la République{'\n'}Tribunal de Grande Instance de Niamey
              </Text>
            </View>
          </View>
        </View>

        {/* ── ACTIONS ── */}
        <View style={styles.actions}>

          {/* Aperçu PV */}
          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: primaryColor }]}
            onPress={generatePV}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {generatingPDF ? <ActivityIndicator color={primaryColor} /> : (
              <>
                <Ionicons name="document-text-outline" size={20} color={primaryColor} />
                <Text style={[styles.btnOutlineText, { color: primaryColor }]}>APERÇU DU PV DE TRANSMISSION</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Viser et transmettre */}
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: primaryColor, opacity: isPending ? 0.7 : 1 }]}
            onPress={handleVisaAndTransmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {mutation.isPending || generatingPDF ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="ribbon-outline" size={24} color="#FFF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.btnText}>APPOSER LE VISA ET TRANSMETTRE</Text>
                  <Text style={styles.btnSubText}>Génère le PV + transmet au Procureur (Art. 19)</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Renvoyer à l'OPJ */}
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: '#EF4444' }]}
            onPress={handleReject}
            disabled={isPending}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-undo" size={20} color="#EF4444" />
            <Text style={styles.secondaryBtnText}>RETOUR À L'OPJ POUR COMPLÉMENT</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:         { padding: 20 },

  infoCard:        { padding: 24, borderRadius: 28, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 }, android: { elevation: 6 }, web: { boxShadow: '0px 4px 20px rgba(0,0,0,0.15)' } }) },
  headerIconRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  whiteLabel:      { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  whiteTitle:      { color: '#FFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },

  opjCard:         { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 25, gap: 12 },
  opjIconBox:      { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  opjLabel:        { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  opjName:         { fontSize: 16, fontWeight: '900' },
  opjSub:          { fontSize: 12, fontWeight: '700', marginTop: 2 },
  stationBox:      { padding: 8, borderRadius: 10, maxWidth: 110, gap: 4, alignItems: 'center' },
  stationText:     { fontSize: 10, fontWeight: '700', textAlign: 'center' },

  section:         { marginBottom: 25 },
  sectionTitle:    { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  card:            { padding: 20, borderRadius: 24, borderWidth: 1.5, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  bodyText:        { fontSize: 15, lineHeight: 24, fontWeight: '500' },

  emptyBox:        { padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', gap: 8 },
  emptyText:       { fontSize: 13, fontWeight: '600', textAlign: 'center', fontStyle: 'italic' },

  fileRow:         { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, gap: 12 },
  fileIcon:        { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  fileName:        { fontSize: 14, fontWeight: '800' },
  fileDate:        { fontSize: 11, marginTop: 2, fontWeight: '600' },

  destinationCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, borderWidth: 1.5, gap: 15 },
  destIcon:        { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  destLabel:       { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  destValue:       { fontSize: 14, fontWeight: '900', lineHeight: 22 },

  actions:         { gap: 14 },
  btnOutline:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20, borderWidth: 2 },
  btnOutlineText:  { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  mainBtn:         { flexDirection: 'row', alignItems: 'center', padding: 22, borderRadius: 24, gap: 15, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 4 }, web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.15)' } }) },
  btnText:         { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  btnSubText:      { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  secondaryBtn:    { flexDirection: 'row', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5 },
  secondaryBtnText:{ color: '#EF4444', fontWeight: '900', fontSize: 12 },
});