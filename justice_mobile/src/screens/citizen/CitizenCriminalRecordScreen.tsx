import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from 'expo-document-picker';

// ✅ 1. Imports Architecture
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Changé pour le hook dynamique

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export default function CitizenCriminalRecordScreen() {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    birthPlace: "",
    fatherName: "",
    motherName: "",
    idCardNumber: "",
  });

  const [docs, setDocs] = useState<{
    birthCert: DocumentPicker.DocumentPickerAsset | null;
    nationalityCert: DocumentPicker.DocumentPickerAsset | null;
  }>({
    birthCert: null,
    nationalityCert: null
  });
  
  const [loading, setLoading] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const bgMain = isDark ? "#0F172A" : "#F8FAFC";
  const bgCard = isDark ? "#1E293B" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#1E293B";
  const textSub = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "#334155" : "#E2E8F0";
  const inputBg = isDark ? "#1E293B" : "#FFFFFF";

  const pickDocument = async (type: 'birthCert' | 'nationalityCert') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        setDocs(prev => ({ ...prev, [type]: result.assets[0] }));
      }
    } catch (err) {
      if (Platform.OS === 'web') window.alert("Erreur\n\nAccès aux fichiers refusé.");
      else Alert.alert("Erreur", "Accès aux fichiers refusé.");
    }
  };

  const handleSubmit = async () => {
    if (!formData.birthPlace || !formData.fatherName || !formData.motherName || !formData.idCardNumber) {
      if (Platform.OS === 'web') window.alert("Formulaire incomplet\n\nVeuillez remplir toutes les informations d'identification.");
      else Alert.alert("Formulaire incomplet", "Veuillez remplir toutes les informations d'identification.");
      return;
    }
    if (!docs.birthCert || !docs.nationalityCert) {
      if (Platform.OS === 'web') window.alert("Documents requis\n\nVeuillez joindre les scans de votre acte de naissance et certificat de nationalité.");
      else Alert.alert("Documents requis", "Veuillez joindre les scans de votre acte de naissance et certificat de nationalité.");
      return;
    }

    setLoading(true);
    // Simulation d'envoi vers le Greffe
    setTimeout(() => {
      setLoading(false);
      if (Platform.OS === 'web') {
        window.alert("Demande Transmise\n\nVotre dossier a été envoyé au service du Casier Judiciaire. Un SMS de confirmation vous sera envoyé dès traitement.");
        navigation.goBack();
      } else {
        Alert.alert(
          "Demande Transmise",
          "Votre dossier a été envoyé au service du Casier Judiciaire. Un SMS de confirmation vous sera envoyé dès traitement.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    }, 2000);
  };

  const RenderUploadField = ({ label, file, onPick, onRemove }: any) => (
    <View style={styles.uploadGroup}>
      <Text style={[styles.labelInput, { color: textMain }]}>{label}</Text>
      {!file ? (
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.uploadArea, { borderColor: borderCol, backgroundColor: bgCard }]}
          onPress={onPick}
        >
          <Ionicons name="document-attach-outline" size={24} color={primaryColor} />
          <Text style={[styles.uploadText, { color: textSub }]}>Sélectionner un scan (PDF/Image)</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.fileCard, { backgroundColor: isDark ? "#064e3b" : "#F0FDF4", borderColor: "#10B981" }]}>
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={[styles.fileName, { color: isDark ? "#fff" : "#1E293B" }]} numberOfLines={1}>{file.name}</Text>
          </View>
          <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Bulletin N°3" showBack />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: bgMain }]}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BANDEAU INFORMATION */}
          <View style={[styles.infoBar, { backgroundColor: primaryColor + "15", borderColor: primaryColor + "30" }]}>
            <Ionicons name="time" size={18} color={primaryColor} />
            <Text style={[styles.infoText, { color: textSub }]}>
              Délai moyen de délivrance : <Text style={{ fontWeight: '900', color: textMain }}>48h ouvrables</Text>.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: textMain }]}>ÉTAT CIVIL</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.labelInput, { color: textMain }]}>Lieu de Naissance</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textMain }]}
              placeholder="Commune, Ville"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={formData.birthPlace}
              onChangeText={(t) => setFormData({...formData, birthPlace: t})}
            />
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.labelInput, { color: textMain }]}>Filiation Père</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textMain }]}
                placeholder="Prénom & Nom"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={formData.fatherName}
                onChangeText={(t) => setFormData({...formData, fatherName: t})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.labelInput, { color: textMain }]}>Filiation Mère</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textMain }]}
                placeholder="Prénom & Nom"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={formData.motherName}
                onChangeText={(t) => setFormData({...formData, motherName: t})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.labelInput, { color: textMain }]}>N° Pièce d'Identité (CNI / NINA)</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: inputBg, borderColor: borderCol, color: textMain }]}
              placeholder="Numéro officiel"
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={formData.idCardNumber}
              onChangeText={(t) => setFormData({...formData, idCardNumber: t.toUpperCase()})}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 15, color: textMain }]}>DOCUMENTS REQUIS</Text>
          
          <RenderUploadField 
            label="Acte de Naissance" 
            file={docs.birthCert} 
            onPick={() => pickDocument('birthCert')}
            onRemove={() => setDocs({...docs, birthCert: null})}
          />

          <RenderUploadField 
            label="Certificat de Nationalité" 
            file={docs.nationalityCert} 
            onPick={() => pickDocument('nationalityCert')}
            onRemove={() => setDocs({...docs, nationalityCert: null})}
          />

          <TouchableOpacity 
            activeOpacity={0.85}
            style={[styles.submitBtn, { backgroundColor: primaryColor }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="file-tray-full" size={20} color="#fff" />
                <Text style={styles.submitText}>SOUMETTRE MON DOSSIER</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerSpacing} />

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ SmartFooter autonome */}
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  
  infoBar: { flexDirection: "row", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 25, alignItems: "center", gap: 10 },
  infoText: { fontSize: 12, fontWeight: '500' },
  
  sectionTitle: { fontSize: 12, fontWeight: "900", marginBottom: 15, letterSpacing: 1, opacity: 0.6, textTransform: 'uppercase' },
  
  inputGroup: { marginBottom: 15 },
  labelInput: { fontSize: 11, fontWeight: "800", marginBottom: 8, textTransform: 'uppercase', opacity: 0.8 },
  input: { borderRadius: 14, padding: 15, borderWidth: 1.5, fontSize: 15, fontWeight: "600" },
  
  row: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  
  uploadGroup: { marginBottom: 15 },
  uploadArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', gap: 10 },
  uploadText: { fontSize: 12, fontWeight: '700' },
  
  fileCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 14, borderWidth: 1.5 },
  fileName: { fontSize: 13, fontWeight: '800' },
  removeBtn: { padding: 5 },
  
  submitBtn: { 
    flexDirection: "row", 
    height: 62, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 20, 
    gap: 12,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 }
    })
  },
  submitText: { color: "#FFF", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
  
  footerSpacing: { height: 130 }
});