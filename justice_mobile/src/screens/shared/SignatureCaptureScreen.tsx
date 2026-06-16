// PATH: src/screens/shared/SignatureCaptureScreen.tsx
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/AppThemeProvider';

interface Props {
  navigation: any;
  route: {
    params: {
      onSave: (signatureBase64: string) => void;
      title?: string;
    };
  };
}

export default function SignatureCaptureScreen({ navigation, route }: Props) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const ref = useRef<SignatureViewRef>(null);
  const { onSave, title = "Signature du déclarant" } = route.params;

  // ✅ Couleurs sans theme.colors.background / theme.colors.text
  const colors = {
    bg:      isDark ? "#0F172A" : "#F8FAFC",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub:  isDark ? "#94A3B8" : "#64748B",
    border:   isDark ? "#334155" : "#E2E8F0",
  };

  const handleOK = (signature: string) => {
    onSave(signature);
    navigation.goBack();
  };

  const handleEmpty = () => {
    if (Platform.OS === 'web') window.alert("Signature manquante\n\nVeuillez apposer votre signature avant de valider.");
    else Alert.alert("Signature manquante", "Veuillez apposer votre signature avant de valider.");
  };

  const handleClear   = () => ref.current?.clearSignature();
  const handleConfirm = () => ref.current?.readSignature();

  const webStyle = `.m-signature-pad--footer { display: none; margin: 0px; }
                    body,html { height: 100%; background-color: ${isDark ? "#1E293B" : "#f8fafc"}; }`;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={[styles.instructions, { color: colors.textSub }]}>
        Utilisez votre doigt ou un stylet pour signer dans le cadre ci-dessous.
      </Text>

      {/* CANVAS */}
      <View style={[styles.signatureWrapper, { borderColor: colors.border }]}>
        <SignatureScreen
          ref={ref}
          onOK={handleOK}
          onEmpty={handleEmpty}
          descriptionText={title}
          clearText="Effacer"
          confirmText="Valider"
          webStyle={webStyle}
          autoClear={false}
          imageType="image/png"
        />
      </View>

      {/* ACTIONS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Ionicons name="refresh-outline" size={20} color={colors.textSub} />
          <Text style={[styles.clearBtnText, { color: colors.textSub }]}>Recommencer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: primaryColor }]} onPress={handleConfirm}>
          <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
          <Text style={styles.saveBtnText}>Confirmer la signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  closeBtn:           { width: 40, height: 40, justifyContent: 'center' },
  title:              { fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  instructions:       { textAlign: 'center', fontSize: 13, paddingHorizontal: 40, marginBottom: 20, lineHeight: 18 },
  signatureWrapper:   { flex: 1, marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 2, backgroundColor: '#fff' },
  footer:             { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  clearBtn:           { flex: 1, height: 55, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f1f5f9' },
  clearBtnText:       { fontWeight: '800', fontSize: 14 },
  saveBtn:            { flex: 1, height: 55, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 3 },
  saveBtnText:        { color: '#fff', fontWeight: '900', fontSize: 14 },
});