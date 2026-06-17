// PATH: src/screens/police/CreateSummonScreen.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, Platform,
  TouchableOpacity, KeyboardAvoidingView, ActivityIndicator,
  Text, TextInput
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { createSummon } from '../../services/summon.service';
import { getComplaintById } from '../../services/complaint.service';
import { useAppTheme } from "../../theme/AppThemeProvider";
import { PoliceScreenProps } from "../../types/navigation";

import { Modal } from 'react-native';

const alertMsg = (t: string, m: string) => {
  if (Platform.OS === 'web') window.alert(`${t}\n\n${m}`);
  else Alert.alert(t, m);
};

export default function CreateSummonScreen({ route, navigation }: PoliceScreenProps<'CreateSummon'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const complaintId  = route.params?.complaintId;

  const [loading,         setLoading]         = useState(false);
  const [fetching,        setFetching]        = useState(!!complaintId);
  const [complaint,       setComplaint]       = useState<any>(null);
  const [showDatePicker,  setShowDatePicker]  = useState(false);

  const [form, setForm] = useState({
    targetName:  '',
    targetPhone: '',
    location:    'Commissariat de Police',
    scheduledAt: new Date(),
    reason:      '',
  });

  const colors = useMemo(() => ({
    bgMain:   isDark ? "#0F172A" : "#F8FAFC",
    bgCard:   isDark ? "#1E293B" : "#FFFFFF",
    border:   isDark ? "#334155" : "#E2E8F0",
    inputBg:  isDark ? "#0F172A" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
  }), [isDark]);

  // ✅ Chargement plainte avec extraction wrapper
  useEffect(() => {
    if (!complaintId) { setFetching(false); return; }
    const load = async () => {
      try {
        const res  = await getComplaintById(Number(complaintId));
        const data = (res as any)?.data || res;
        setComplaint(data);

        // ✅ Supporte complainant ET citizen
        const plaignant = data.complainant
          ? `${(data.complainant.lastname || '').toUpperCase()} ${data.complainant.firstname || ''}`.trim()
          : data.citizen
          ? `${(data.citizen.lastname || '').toUpperCase()} ${data.citizen.firstname || ''}`.trim()
          : "IDENTITÉ INCONNUE";

        setForm(prev => ({
          ...prev,
          targetName: data.suspectName || '',
          reason:     `Suite à la plainte déposée par M./Mme ${plaignant} (Dossier #${data.trackingCode || data.id}). Objet : ${data.title || 'Non spécifié'}`,
        }));
      } catch (e) {
        console.error("Erreur récupération :", e);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [complaintId]);

  const handleSubmit = async () => {
    if (!form.targetName.trim()) {
      alertMsg("Erreur", "Le nom du convoqué est obligatoire.");
      return;
    }
    setLoading(true);
    try {
      await createSummon({
        complaintId:  Number(complaintId),
        targetName:   form.targetName.trim(),
        targetPhone:  form.targetPhone.trim(),
        location:     form.location.trim(),
        scheduledAt:  form.scheduledAt.toISOString(),
        reason:       form.reason.trim(),
      });
      alertMsg("Succès ✅", "Convocation enregistrée.");
      navigation.goBack();
    } catch {
      alertMsg("Erreur ❌", "Échec de la création.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Chargement..." showBack />
      <View style={styles.center}><ActivityIndicator size="large" color={primaryColor} /></View>
    </ScreenContainer>
  );

  const plaignantName = complaint?.complainant
    ? `${(complaint.complainant.lastname || '').toUpperCase()} ${complaint.complainant.firstname || ''}`.trim()
    : complaint?.citizen
    ? `${(complaint.citizen.lastname || '').toUpperCase()} ${complaint.citizen.firstname || ''}`.trim()
    : "Non renseigné";

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Émission de Convocation" showBack />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={{ backgroundColor: colors.bgMain }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* CARTE DOSSIER SOURCE */}
          {complaint && (
            <View style={[styles.infoCard, { backgroundColor: primaryColor + "15", borderLeftColor: primaryColor }]}>
              <View style={[styles.iconCircle, { backgroundColor: primaryColor }]}>
                <Ionicons name="document-text" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: primaryColor }]}>PLAIGNANT DÉTECTÉ</Text>
                <Text style={[styles.bold, { color: colors.textMain, fontSize: 16 }]}>{plaignantName}</Text>
                <Text style={[styles.metaText, { color: colors.textSub }]}>
                  Dossier : {complaint.trackingCode || complaint.id || '---'}
                </Text>
              </View>
            </View>
          )}

          {/* FORMULAIRE */}
          <View style={[styles.formCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>

            <Text style={[styles.label, { color: colors.textSub }]}>NOM DE LA PERSONNE À CONVOQUER *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
              value={form.targetName} onChangeText={t => setForm({ ...form, targetName: t })}
              placeholder="Nom complet..."
              placeholderTextColor={colors.textSub}
            />

            <Text style={[styles.label, { color: colors.textSub }]}>CONTACT TÉLÉPHONIQUE</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
              value={form.targetPhone} onChangeText={t => setForm({ ...form, targetPhone: t })}
              placeholder="+227 ..."
              placeholderTextColor={colors.textSub}
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, { color: colors.textSub }]}>LIEU DU RENDEZ-VOUS</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
              value={form.location} onChangeText={t => setForm({ ...form, location: t })}
              placeholderTextColor={colors.textSub}
            />

            <Text style={[styles.label, { color: colors.textSub }]}>DATE ET HEURE</Text>
            {Platform.OS === 'web' ? (
              <View style={[styles.datePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                <Ionicons name="calendar-outline" size={20} color={primaryColor} />
                <input
                  type="datetime-local"
                  title="Date et heure"
                  aria-label="Date et heure de la convocation"
                  value={form.scheduledAt.toISOString().slice(0, 16)}
                  onChange={(e: any) => {
                    if (e.target.value) setForm(f => ({ ...f, scheduledAt: new Date(e.target.value) }));
                  }}
                  style={{
                    flex: 1, fontSize: 15, fontWeight: '600', border: 'none', outline: 'none',
                    backgroundColor: 'transparent', color: isDark ? '#FFFFFF' : '#1E293B',
                    fontFamily: 'inherit', padding: '4px 0',
                  } as any}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.datePickerBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }]}
                >
                  <Ionicons name="calendar-outline" size={20} color={primaryColor} />
                  <Text style={[styles.datePickerText, { color: colors.textMain }]}>
                    {form.scheduledAt.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
                <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ backgroundColor: colors.bgCard, borderRadius: 20, padding: 24, width: '85%', maxWidth: 360 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 16, textAlign: 'center', color: colors.textMain }}>Date et heure</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg, textAlign: 'center' }]} value={String(form.scheduledAt.getDate()).padStart(2,'0')} placeholder="JJ" keyboardType="numeric" maxLength={2} onChangeText={t => { const d = new Date(form.scheduledAt); d.setDate(parseInt(t) || 1); setForm(f => ({...f, scheduledAt: d})); }} placeholderTextColor={colors.textSub} />
                        <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg, textAlign: 'center' }]} value={String(form.scheduledAt.getMonth() + 1).padStart(2,'0')} placeholder="MM" keyboardType="numeric" maxLength={2} onChangeText={t => { const d = new Date(form.scheduledAt); d.setMonth((parseInt(t) || 1) - 1); setForm(f => ({...f, scheduledAt: d})); }} placeholderTextColor={colors.textSub} />
                        <TextInput style={[styles.input, { flex: 1.3, borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg, textAlign: 'center' }]} value={String(form.scheduledAt.getFullYear())} placeholder="AAAA" keyboardType="numeric" maxLength={4} onChangeText={t => { const d = new Date(form.scheduledAt); d.setFullYear(parseInt(t) || 2026); setForm(f => ({...f, scheduledAt: d})); }} placeholderTextColor={colors.textSub} />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg, textAlign: 'center' }]} value={String(form.scheduledAt.getHours()).padStart(2,'0')} placeholder="HH" keyboardType="numeric" maxLength={2} onChangeText={t => { const d = new Date(form.scheduledAt); d.setHours(parseInt(t) || 0); setForm(f => ({...f, scheduledAt: d})); }} placeholderTextColor={colors.textSub} />
                        <Text style={{ color: colors.textMain, fontSize: 20, fontWeight: '800', alignSelf: 'center' }}>:</Text>
                        <TextInput style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg, textAlign: 'center' }]} value={String(form.scheduledAt.getMinutes()).padStart(2,'0')} placeholder="MM" keyboardType="numeric" maxLength={2} onChangeText={t => { const d = new Date(form.scheduledAt); d.setMinutes(parseInt(t) || 0); setForm(f => ({...f, scheduledAt: d})); }} placeholderTextColor={colors.textSub} />
                      </View>
                      <TouchableOpacity style={{ backgroundColor: primaryColor, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} onPress={() => setShowDatePicker(false)}>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>Confirmer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </>
            )}

            <Text style={[styles.label, { color: colors.textSub }]}>MOTIF OFFICIEL</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.textMain, backgroundColor: colors.inputBg }]}
              value={form.reason} onChangeText={t => setForm({ ...form, reason: t })}
              placeholder="Motif de la convocation..."
              placeholderTextColor={colors.textSub}
              multiline numberOfLines={4} textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit} disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.btnText}>VALIDER LA CONVOCATION</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll:         { padding: 16, paddingBottom: 120 },
  bold:           { fontWeight: '800' },
  metaText:       { fontSize: 12, marginTop: 2 },
  infoCard:       { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 20, gap: 12, alignItems: 'center', borderLeftWidth: 5, borderWidth: 1 },
  iconCircle:     { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  infoLabel:      { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  formCard:       { padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  label:          { fontSize: 10, fontWeight: '900', marginBottom: 8, marginTop: 10, letterSpacing: 0.5 },
  input:          { borderWidth: 1, borderRadius: 10, padding: 12, fontWeight: '600', marginBottom: 5 },
  textArea:       { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 100, marginBottom: 5 },
  datePickerBtn:  { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, gap: 12, marginBottom: 5 },
  datePickerText: { fontWeight: '600', fontSize: 14 },
  btn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 60, borderRadius: 16 },
  btnText:        { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});