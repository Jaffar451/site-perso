import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppTheme } from '../../theme/AppThemeProvider';
import { AuthScreenProps } from '../../types/navigation';

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { theme } = useAppTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focusId, setFocusId] = useState(false);
  const [focusPw, setFocusPw] = useState(false);
  
  const passwordRef = useRef<TextInput>(null);
  const { login, loading, error, setError } = useAuthStore();

  const PRIMARY = theme.colors.primary;
  const ACCENT = theme.colors.secondary;

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    
    try {
      await login({ 
        identifier: identifier.trim(), 
        password: password 
      });
    } catch (err) {
      console.error("[LoginScreen] Échec authentification:", err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { backgroundColor: PRIMARY }]}>
          <View style={[styles.emblemRing, { borderColor: ACCENT }]}>
            <View style={[styles.emblemInner, { backgroundColor: `${ACCENT}20` }]}>
              <Ionicons name="shield-checkmark" size={36} color={ACCENT} />
            </View>
          </View>
          <Text style={styles.appName}>e-Justice Niger</Text>
          <Text style={styles.appSub}>Système d'Information Judiciaire National</Text>
        </View>

        <View style={[styles.form, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>Connexion sécurisée</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Email ou Matricule</Text>
            <View style={[styles.inputWrap, focusId && { borderColor: PRIMARY }]}>
              <Ionicons name="person-outline" size={18} color={focusId ? PRIMARY : theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.text }]}
                placeholder="exemple@justice.ne"
                placeholderTextColor={theme.colors.textSecondary}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusId(true)}
                onBlur={() => setFocusId(false)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Mot de passe</Text>
            <View style={[styles.inputWrap, focusPw && { borderColor: PRIMARY }]}>
              <Ionicons name="lock-closed-outline" size={18} color={focusPw ? PRIMARY : theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { flex: 1, color: theme.colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                onFocus={() => setFocusPw(true)}
                onBlur={() => setFocusPw(false)}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
              <Text style={{ color: theme.colors.danger, flex: 1 }}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: PRIMARY }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : (
              <Text style={styles.loginBtnText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* AJOUT : Lien vers l'écran de création de compte */}
          <TouchableOpacity 
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[styles.registerText, { color: theme.colors.textSecondary }]}>
              Pas encore de compte ?{' '}
              <Text style={{ color: PRIMARY, fontWeight: '800' }}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emblemRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emblemInner: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  appName: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  appSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center' },
  form: { margin: 20, padding: 24, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  formTitle: { fontSize: 18, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, minHeight: 56, paddingVertical: Platform.OS === 'web' ? 8 : 0 },
  inputIcon: { paddingHorizontal: 14 },
  input: { flex: 1, fontSize: 16, height: Platform.OS === 'web' ? 40 : undefined, paddingVertical: 10, outlineStyle: 'none' as any },
  eyeBtn: { paddingHorizontal: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginBottom: 16, backgroundColor: '#FEF2F2' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, height: 54, marginTop: 8 },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  registerLink: { marginTop: 24, alignItems: 'center', paddingVertical: 8 },
  registerText: { fontSize: 14 }
});