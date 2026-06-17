import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/AppThemeProvider';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { ENV } from '../../config/env';

export default function VerificationScannerScreen() {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const navigation = useNavigation<any>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { valid: boolean; data?: any }>(null);

  const bgCard = isDark ? '#1E293B' : '#FFFFFF';
  const textMain = isDark ? '#FFFFFF' : '#1E293B';
  const textSub = isDark ? '#94A3B8' : '#64748B';
  const border = isDark ? '#334155' : '#E2E8F0';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';

  const handleVerify = async () => {
    const token = code.trim();
    if (!token) { window.alert('Veuillez entrer un code de vérification.'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${ENV.API_URL}/public/verify/${encodeURIComponent(token)}`);
      if (res.ok) {
        const html = await res.text();
        const isValid = html.includes('Authentique') || html.includes('✅');
        setResult({ valid: isValid, data: { html } });
      } else {
        setResult({ valid: false });
      }
    } catch {
      setResult({ valid: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Vérification d'Acte" showBack />
      <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <View style={[styles.iconCircle, { backgroundColor: primaryColor + '15' }]}>
          <Ionicons name="shield-checkmark-outline" size={50} color={primaryColor} />
        </View>
        <Text style={[styles.title, { color: textMain }]}>Vérification d'Authenticité</Text>
        <Text style={[styles.subtitle, { color: textSub }]}>
          Entrez le code de vérification figurant sur l'acte judiciaire pour confirmer son authenticité.
        </Text>

        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="key-outline" size={20} color={textSub} />
          <TextInput
            style={[styles.input, { color: textMain }]}
            value={code}
            onChangeText={setCode}
            placeholder="Code ou token de vérification..."
            placeholderTextColor={textSub}
            autoCapitalize="none"
            onSubmitEditing={handleVerify}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: primaryColor, opacity: loading ? 0.7 : 1 }]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : (
            <>
              <Ionicons name="search-outline" size={20} color="#FFF" />
              <Text style={styles.btnText}>VÉRIFIER L'ACTE</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={[styles.resultCard, {
            backgroundColor: result.valid ? (isDark ? '#064E3B' : '#F0FDF4') : (isDark ? '#7F1D1D' : '#FEF2F2'),
            borderColor: result.valid ? '#10B981' : '#EF4444',
          }]}>
            <Ionicons
              name={result.valid ? 'checkmark-circle' : 'close-circle'}
              size={32}
              color={result.valid ? '#10B981' : '#EF4444'}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: result.valid ? '#10B981' : '#EF4444' }]}>
                {result.valid ? 'Document Authentique' : 'Document Non Reconnu'}
              </Text>
              <Text style={[styles.resultDesc, { color: result.valid ? (isDark ? '#A7F3D0' : '#065F46') : (isDark ? '#FCA5A5' : '#991B1B') }]}>
                {result.valid
                  ? 'Ce document a été émis par le système E-JUSTICE du Ministère de la Justice du Niger.'
                  : 'Ce code ne correspond à aucun acte enregistré. Le document pourrait être falsifié.'}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.infoBox, { backgroundColor: bgCard, borderColor: border }]}>
          <Ionicons name="information-circle-outline" size={20} color={primaryColor} />
          <Text style={[styles.infoText, { color: textSub }]}>
            Le code de vérification se trouve en bas de chaque document officiel, sous le QR Code.
            Sur mobile, vous pouvez scanner directement le QR Code avec la caméra.
          </Text>
        </View>
      </View>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 30, paddingTop: 40 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 30, maxWidth: 450 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 56, width: '100%', maxWidth: 500, gap: 12, marginBottom: 16 },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, width: '100%', maxWidth: 500, gap: 10 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
  resultCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 1.5, marginTop: 24, width: '100%', maxWidth: 500, gap: 16 },
  resultTitle: { fontSize: 16, fontWeight: '900', marginBottom: 4 },
  resultDesc: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 24, width: '100%', maxWidth: 500, gap: 12 },
  infoText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
});
