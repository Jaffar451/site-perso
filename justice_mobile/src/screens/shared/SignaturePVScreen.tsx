// PATH: src/screens/shared/SignaturePVScreen.tsx
import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, StatusBar,
  Text, TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ CORRECTION : useAppTheme au lieu de getAppTheme
import { useAppTheme } from '../../theme/AppThemeProvider';
import { useAuthStore } from '../../stores/useAuthStore';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { SignaturePad } from '../../components/SignaturePad';
import { updateComplaint } from '../../services/complaint.service';

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function SignaturePVScreen({ route, navigation }: any) {
  // ✅ CORRECTION : hook et primaryColor corrects
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const { user } = useAuthStore();

  const params      = route.params || {};
  const complaintId = params.complaintId || 'REF-PENDING';

  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  // ✅ Palette sans theme.colors.danger / text / surface
  const colors = {
    bgMain:  isDark ? "#0F172A" : "#F8FAFC",
    bgCard:  isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    infoBg:   isDark ? "#172554" : "#EFF6FF",
    warnBg:   isDark ? "#450A0A" : "#FEF2F2",
  };

  const handleSaveSignature = (base64: string) => {
    setSignatureBase64(base64);
    alertMsg("Signature capturée ✅", "L'empreinte numérique a été générée.");
  };

  const handleFinalize = () => {
    if (!signatureBase64) {
      alertMsg("Action requise", "Veuillez apposer votre signature dans le cadre ci-dessous.");
      return;
    }

    const confirm = async () => {
      try {
        setIsSubmitting(true);
        const newStatus = ['officier_police', 'gendarme', 'commissaire'].includes(user?.role || '')
          ? 'transmise_parquet'
          : 'attente_validation';

        await updateComplaint(complaintId, {
          status:        newStatus,
          signatureData: signatureBase64,
          signedAt:      new Date().toISOString(),
        } as any);

        alertMsg("Dossier Scellé ⚖️", "Le PV a été versé au registre national.");
        navigation.navigate('Home');
      } catch {
        alertMsg("Erreur de liaison", "Impossible de sceller le document. Vérifiez votre connexion internet.");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Clôture du Procès-Verbal\n\nEn signant ce document, vous certifiez l'exactitude des faits. Le dossier sera immédiatement transmis au Parquet de la République.")) {
        confirm();
      }
    } else {
      Alert.alert(
        "Clôture du Procès-Verbal",
        "En signant ce document, vous certifiez l'exactitude des faits. Le dossier sera immédiatement transmis au Parquet de la République.",
        [
          { text: "Relire", style: "cancel" },
          { text: "Signer & Transmettre", onPress: confirm },
        ]
      );
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Certification de l'Acte" showBack={true} />

      <ScrollView
        style={{ backgroundColor: colors.bgMain }}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* EN-TÊTE */}
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: primaryColor }]}>Signature Électronique</Text>
          <Text style={[styles.subtitle, { color: colors.textSub }]}>Dossier Référence : {complaintId}</Text>
        </View>

        {/* CARTE ENGAGEMENT */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>

          <View style={[styles.noticeBox, { backgroundColor: colors.infoBg }]}>
            <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
            <Text style={[styles.infoTitle, { color: colors.textMain }]}>Engagement Juridique</Text>
          </View>

          <Text style={[styles.infoText, { color: colors.textSub, backgroundColor: colors.bgMain }]}>
            {"\"Je soussigné, certifie que les déclarations consignées dans ce procès-verbal sont l'expression exacte de la vérité.\""}
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.padWrapper}>
            <SignaturePad
              description="Signez à l'intérieur du cadre"
              onOK={handleSaveSignature}
              penColor={primaryColor}
            />
          </View>

          {signatureBase64 && (
            <View style={[styles.signedBadge, { backgroundColor: "#10B98115" }]}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={[styles.signedText, { color: "#10B981" }]}>Signature apposée</Text>
            </View>
          )}
        </View>

        {/* AVERTISSEMENT */}
        <View style={[styles.warningBox, { backgroundColor: colors.warnBg }]}>
          <Ionicons name="alert-circle-outline" size={16} color="#B91C1C" />
          <Text style={styles.warningText}>
            Toute fausse déclaration expose son auteur aux peines prévues par le Code Pénal du Niger.
          </Text>
        </View>

        {/* BOUTON */}
        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: primaryColor, opacity: (!signatureBase64 || isSubmitting) ? 0.5 : 1 }]}
          onPress={handleFinalize}
          disabled={!signatureBase64 || isSubmitting}
        >
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Ionicons name="shield-checkmark" size={22} color="#FFF" />
              <Text style={styles.btnLabel}>SCELLER ET TRANSMETTRE AU PARQUET</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { padding: 20 },
  headerInfo:    { marginBottom: 25 },
  title:         { fontSize: 24, fontWeight: '900', marginBottom: 5, letterSpacing: -0.5 },
  subtitle:      { fontSize: 14, fontWeight: '700' },
  card:          { borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 20, elevation: 2 },
  noticeBox:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, padding: 12, borderRadius: 12 },
  infoTitle:     { fontSize: 16, fontWeight: '800' },
  infoText:      { fontSize: 14, lineHeight: 22, fontStyle: 'italic', padding: 15, borderRadius: 12 },
  divider:       { height: 1, marginVertical: 20 },
  padWrapper:    { minHeight: 250 },
  signedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginTop: 10 },
  signedText:    { fontWeight: '700', fontSize: 13 },
  warningBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 20 },
  warningText:   { flex: 1, fontSize: 11, color: '#B91C1C', fontWeight: '700', lineHeight: 16 },
  mainBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 20, elevation: 4 },
  btnLabel:      { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});