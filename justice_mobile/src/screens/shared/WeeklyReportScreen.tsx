// PATH: src/screens/shared/WeeklyReportScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView,
  Platform, ActivityIndicator, Text, TextInput, TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";

import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { useAuthStore } from '../../stores/useAuthStore';

const fetchUnitStats = async () => {
  return new Promise<{ processedCases: number; pendingCases: number; incidents: number }>((resolve) => {
    setTimeout(() => resolve({ processedCases: 14, pendingCases: 6, incidents: 2 }), 800);
  });
};

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function WeeklyReportScreen() {
  const { theme, isDark } = useAppTheme();
  const navigation = useNavigation();
  const { user }   = useAuthStore();

  const primaryColor = theme.colors.primary;
  const userUnit     = (user as any)?.district || "Unité Centrale";

  // ✅ Palette sans theme.colors.danger / text / surface
  const colors = {
    bgMain:   isDark ? "#0F172A" : "#F8FAFC",
    bgCard:   isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
    inputBg:  isDark ? "#0F172A" : "#F8FAFC",
    danger:   "#EF4444",
  };

  const { data: weekStats, isLoading } = useQuery({
    queryKey: ['weekly-unit-stats', user?.id],
    queryFn:  fetchUnitStats,
  });

  const [report, setReport]       = useState({ activities: '', incidents: '', needs: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (weekStats && !report.activities) {
      setReport(prev => ({
        ...prev,
        activities: `Opérations menées : ${weekStats.processedCases} dossiers clôturés. Vigilance maintenue sur ${weekStats.pendingCases} procédures.`,
      }));
    }
  }, [weekStats]);

  const handleSubmit = async () => {
    if (!report.activities.trim()) {
      alertMsg("Champ requis", "La synthèse des activités est obligatoire.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alertMsg("Rapport Transmis ✅", "Document signé numériquement et archivé.");
      navigation.goBack();
    }, 1500);
  };

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const weekNumber   = Math.ceil(new Date().getDate() / 7);

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Rapport Hebdomadaire" showBack />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          style={{ backgroundColor: colors.bgMain }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

          {/* HEADER */}
          <View style={styles.topInfo}>
            <View>
              <Text style={[styles.unitName, { color: colors.textMain }]}>{userUnit.toUpperCase()}</Text>
              <Text style={[styles.periodText, { color: primaryColor }]}>
                {currentMonth.toUpperCase()} • SEMAINE {weekNumber}
              </Text>
            </View>
            <Ionicons name="document-text" size={32} color={primaryColor} />
          </View>

          {/* STATS */}
          <View style={styles.statsGrid}>
            <StatBox label="Traités"  value={weekStats?.processedCases ?? 0} icon="checkmark-circle" color="#10B981"    loading={isLoading} colors={colors} />
            <StatBox label="En cours" value={weekStats?.pendingCases   ?? 0} icon="time"             color={primaryColor} loading={isLoading} colors={colors} />
            <StatBox label="Alertes"  value={weekStats?.incidents      ?? 0} icon="warning"           color={colors.danger} loading={isLoading} colors={colors} />
          </View>

          {/* FORMULAIRE */}
          <View style={[styles.formCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>

            <SectionRow icon="list"         title="Synthèse Opérationnelle"  color={primaryColor} colors={colors} />
            <TextInput
              placeholder="Décrivez les actions majeures de la semaine..."
              placeholderTextColor={colors.textSub}
              value={report.activities}
              onChangeText={t => setReport({ ...report, activities: t })}
              multiline numberOfLines={5} textAlignVertical="top"
              style={[styles.textArea, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SectionRow icon="alert-circle" title="Difficultés Rencontrées"   color={colors.danger}  colors={colors} />
            <TextInput
              placeholder="Incidents, pannes, manque d'effectifs..."
              placeholderTextColor={colors.textSub}
              value={report.incidents}
              onChangeText={t => setReport({ ...report, incidents: t })}
              multiline numberOfLines={3} textAlignVertical="top"
              style={[styles.textArea, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            />

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <SectionRow icon="construct"    title="Besoins Logistiques"       color={primaryColor} colors={colors} />
            <TextInput
              placeholder="Matériel, fournitures, support technique..."
              placeholderTextColor={colors.textSub}
              value={report.needs}
              onChangeText={t => setReport({ ...report, needs: t })}
              multiline numberOfLines={3} textAlignVertical="top"
              style={[styles.textArea, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: primaryColor, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSubmit} disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Ionicons name="shield-checkmark" size={22} color="#FFF" />
                  <Text style={styles.submitBtnText}>SIGNER ET TRANSMETTRE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.footerNote, { color: colors.textSub }]}>
            En transmettant ce rapport, vous certifiez l'exactitude des informations fournies à votre hiérarchie.
          </Text>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const StatBox = ({ label, value, icon, color, loading, colors }: any) => (
  <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <Ionicons name={icon} size={18} color={color} />
    {loading
      ? <ActivityIndicator size="small" color={color} style={{ marginVertical: 4 }} />
      : <Text style={[styles.statValue, { color: colors.textMain }]}>{value}</Text>
    }
    <Text style={[styles.statLabel, { color: colors.textSub }]}>{label}</Text>
  </View>
);

const SectionRow = ({ icon, title, color, colors }: any) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon as any} size={18} color={color} />
    <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  content:       { padding: 20 },
  topInfo:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingHorizontal: 4 },
  unitName:      { fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  periodText:    { fontSize: 13, fontWeight: '700', marginTop: 2 },
  statsGrid:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statBox:       { width: '31%', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  statValue:     { fontSize: 20, fontWeight: 'bold', marginVertical: 4 },
  statLabel:     { fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  formCard:      { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 5 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  textArea:      { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 14 },
  divider:       { height: 1, marginVertical: 15, opacity: 0.5 },
  submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20, height: 60, borderRadius: 16, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  footerNote:    { textAlign: 'center', fontSize: 11, marginTop: 10, paddingHorizontal: 20, lineHeight: 16 },
});