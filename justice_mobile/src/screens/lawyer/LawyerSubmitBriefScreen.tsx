import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';

// ✅ 1. Imports Architecture
import { useAppTheme } from "../../theme/AppThemeProvider";
import { LawyerScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

export default function LawyerSubmitBriefScreen({ route, navigation }: LawyerScreenProps<any>) {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  // Couleur Or pour l'avocat
  const primaryColor = isDark ? "#D4AF37" : theme.colors.primary; 

  const { caseId } = route.params || { caseId: "N/A" };

  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
    infoBg: isDark ? "#1E293B" : "#EFF6FF",
    uploadBg: isDark ? "#0F172A" : "#F8FAFC",
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      if (Platform.OS === 'web') window.alert("Erreur\n\nImpossible de sélectionner le fichier.");
      else Alert.alert("Erreur", "Impossible de sélectionner le fichier.");
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      if (Platform.OS === 'web') return window.alert("Information manquante\n\nVeuillez donner un titre à vos conclusions.");
      else return Alert.alert("Information manquante", "Veuillez donner un titre à vos conclusions.");
    }
    if (!selectedFile) {
      if (Platform.OS === 'web') return window.alert("Fichier manquant\n\nVeuillez joindre le fichier PDF de vos conclusions.");
      else return Alert.alert("Fichier manquant", "Veuillez joindre le fichier PDF de vos conclusions.");
    }

    setLoading(true);

    // Simulation d'envoi
    setTimeout(() => {
      setLoading(false);
      if (Platform.OS === 'web') {
        window.alert("Dépôt Effectué\n\nVos conclusions ont été horodatées et transmises au greffe ainsi qu'aux parties concernées.");
        navigation.goBack();
      } else {
        Alert.alert(
          "Dépôt Effectué",
          "Vos conclusions ont été horodatées et transmises au greffe ainsi qu'aux parties concernées.",
          [{ text: "Retour au dossier", onPress: () => navigation.goBack() }]
        );
      }
    }, 2000);
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Dépôt de Conclusions" showBack />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.bgMain }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 📂 INFO DOSSIER */}
          <View style={[styles.infoBox, { backgroundColor: colors.infoBg, borderColor: primaryColor }]}>
             <Ionicons name="folder-open" size={24} color={primaryColor} />
             <View style={{ marginLeft: 15 }}>
                <Text style={[styles.infoLabel, { color: primaryColor }]}>PROCÉDURE RG</Text>
                <Text style={[styles.infoValue, { color: colors.textMain }]}>#{caseId}</Text>
             </View>
          </View>

          {/* 📝 TITRE */}
          <Text style={[styles.label, { color: colors.textSub }]}>Intitulé des écritures *</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.textMain, borderColor: colors.border }]}
            placeholder="Ex: Conclusions en défense au fond..."
            placeholderTextColor={colors.textSub}
            value={title}
            onChangeText={setTitle}
          />

          {/* ☁️ ZONE D'UPLOAD */}
          <Text style={[styles.label, { color: colors.textSub }]}>Pièce jointe (PDF) *</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handlePickDocument}
            style={[
                styles.uploadZone, 
                { 
                    backgroundColor: colors.uploadBg, 
                    borderColor: selectedFile ? "#10B981" : colors.border,
                    borderStyle: selectedFile ? "solid" : "dashed"
                }
            ]}
          >
            {selectedFile ? (
                <>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark" size={30} color="#FFF" />
                    </View>
                    <Text style={[styles.fileName, { color: colors.textMain }]} numberOfLines={1}>
                        {selectedFile.name}
                    </Text>
                    <Text style={styles.fileSize}>
                        {(selectedFile.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB • Prêt à l'envoi
                    </Text>
                    <Text style={[styles.changeFileText, { color: primaryColor }]}>Changer de fichier</Text>
                </>
            ) : (
                <>
                    <View style={[styles.uploadIconCircle, { backgroundColor: primaryColor + "15" }]}>
                        <Ionicons name="cloud-upload-outline" size={32} color={primaryColor} />
                    </View>
                    <Text style={[styles.uploadText, { color: colors.textMain }]}>Sélectionner le fichier PDF</Text>
                    <Text style={styles.uploadSubText}>Taille max : 10MB • Signature PAdES recommandée</Text>
                </>
            )}
          </TouchableOpacity>

          {/* 🔒 DISCLAIMER */}
          <View style={[styles.disclaimerBox, { borderColor: colors.border }]}>
             <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSub} />
             <Text style={[styles.disclaimerText, { color: colors.textSub }]}>
                Ce dépôt vaut remise au greffe et notification aux avocats constitués via le RPVA (Réseau Privé Virtuel des Avocats).
             </Text>
          </View>

          {/* BOUTON D'ENVOI */}
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: primaryColor }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <>
                    <Ionicons name="send" size={20} color="#FFF" />
                    <Text style={styles.btnText}>TRANSMETTRE AU GREFFE</Text>
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
  container: { padding: 20 },
  
  infoBox: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 25, borderWidth: 1, borderLeftWidth: 6 },
  infoLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  infoValue: { fontSize: 18, fontWeight: "900" },

  label: { fontSize: 11, fontWeight: "900", marginBottom: 10, marginTop: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: { padding: 18, borderRadius: 16, borderWidth: 1, fontSize: 15, fontWeight: "600" },

  uploadZone: { height: 200, borderWidth: 2, borderRadius: 24, justifyContent: "center", alignItems: "center", gap: 8, marginTop: 5 },
  uploadIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 5 },
  uploadText: { fontWeight: "800", fontSize: 15 },
  uploadSubText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  
  successIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#10B981", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  fileName: { fontSize: 16, fontWeight: "800", paddingHorizontal: 20, textAlign: 'center' },
  fileSize: { fontSize: 12, color: "#10B981", fontWeight: "700", marginBottom: 10 },
  changeFileText: { fontSize: 12, fontWeight: "800", textDecorationLine: "underline" },

  disclaimerBox: { flexDirection: "row", marginTop: 25, padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', gap: 10, alignItems: 'center' },
  disclaimerText: { flex: 1, fontSize: 10, lineHeight: 16, fontStyle: 'italic' },

  submitBtn: { height: 60, borderRadius: 18, flexDirection: 'row', justifyContent: "center", alignItems: "center", gap: 10, marginTop: 30, elevation: 4 },
  btnText: { color: "#FFF", fontWeight: "900", fontSize: 14, letterSpacing: 1 }
});