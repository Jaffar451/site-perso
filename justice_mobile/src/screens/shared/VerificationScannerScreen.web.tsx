import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/AppThemeProvider';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';

export default function VerificationScannerScreen() {
  const { theme } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Scanner QR" showBack />
      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: primaryColor + '15' }]}>
          <Ionicons name="qr-code-outline" size={60} color={primaryColor} />
        </View>
        <Text style={styles.title}>Scanner non disponible sur Web</Text>
        <Text style={styles.subtitle}>
          La lecture de QR Code nécessite une caméra.{'\n'}
          Utilisez l'application mobile pour cette fonctionnalité.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: primaryColor }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>RETOUR</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircle:  { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  title:       { fontSize: 22, fontWeight: '900', color: '#1E293B', marginBottom: 12, textAlign: 'center' },
  subtitle:    { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 35 },
  btn:         { paddingHorizontal: 35, paddingVertical: 16, borderRadius: 16 },
  btnText:     { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});
