// PATH: src/screens/citizen/CitizenCreateComplaintScreen.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  TouchableOpacity,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from 'expo-document-picker';

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider"; 
import { CitizenScreenProps } from "../../types/navigation";

import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { Toast } from "../../components/ui/ToastManager";

import { createComplaint, uploadAttachment } from "../../services/complaint.service";

export default function CitizenCreateComplaintScreen({ navigation }: CitizenScreenProps<'CitizenCreateComplaint'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [provisionalOffence, setProvisionalOffence] = useState("Vol");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const types = ["Vol", "Agression", "Escroquerie", "Cybercriminalité", "Violences", "Autre"];

  const bgMain = isDark ? "#0F172A" : "#F8FAFC";
  const bgCard = isDark ? "#1E293B" : "#FFFFFF";
  const textMain = isDark ? "#FFFFFF" : "#1E293B";
  const textSub = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "#334155" : "#E2E8F0";
  const inputBg = isDark ? "#1E293B" : "#F8FAFC";

  // ✅ Identité récupérée automatiquement pour affichage
  const userFullName = user ? `${user.lastname?.toUpperCase()} ${user.firstname}` : "Utilisateur non identifié";

  const pickEvidence = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf', 'video/*', 'audio/*'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets) {
        const validFiles = result.assets.filter(f => f.size && f.size < 10 * 1024 * 1024);
        if (validFiles.length < result.assets.length) {
          Toast.show({ type: "warning", message: "Certains fichiers dépassent 10MB." });
        }
        setAttachments(prev => [...prev, ...validFiles]);
      }
    } catch (err) {
      Alert.alert("Erreur", "Accès aux fichiers impossible.");
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const mutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-complaints"] });

      if (attachments.length > 0 && data.id) {
        setIsUploadingFiles(true);
        try {
          for (const file of attachments) {
            await uploadAttachment(data.id, file);
          }
        } catch (error) {
          Toast.show({ type: "warning", message: "Dossier créé, mais échec de l'envoi des preuves." });
        } finally {
          setIsUploadingFiles(false);
        }
      }

      const trackingNumber = "#" + (data.trackingCode || data.id);
      const message = "Votre déclaration a été transmise.\n\nNuméro de suivi : " + trackingNumber;

      if (Platform.OS === 'web') {
        window.alert("✅ Succès\n\n" + message);
        navigation.navigate("CitizenMyComplaints"); 
      } else {
        Alert.alert("✅ Succès", message, [
          { text: "Voir mes dossiers", onPress: () => navigation.navigate("CitizenMyComplaints") }
        ]);
      }
    },
    onError: () => {
        Alert.alert("Erreur", "Impossible de transmettre la plainte.");
    }
  });

  const handleSubmit = () => {
    if (!description.trim() || !location.trim()) {
      Alert.alert("Incomplet", "Veuillez préciser le lieu et la description.");
      return;
    }
    const payload = { 
        title: `${provisionalOffence} - ${location}`, 
        description: description.trim(), 
        location: location.trim(), 
        provisionalOffence: provisionalOffence,
        category: provisionalOffence,
        filedAt: new Date().toISOString(),
        status: "soumise"
    };
    mutation.mutate(payload as any);
  };

  const isGlobalLoading = mutation.isPending || isUploadingFiles;

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Nouvelle Déclaration" showBack={true} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: bgMain }]}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* BANDEAU INFO */}
          <View style={[styles.infoBox, { backgroundColor: isDark ? "#451a03" : "#FFFBEB", borderColor: "#F59E0B" }]}>
            <Ionicons name="shield-checkmark" size={20} color="#D97706" />
            <Text style={[styles.infoText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
              Déclaration officielle transmise aux services de police.
            </Text>
          </View>

          {/* ✅ NOUVEAU : Affichage de l'identité du déclarant */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textMain }]}>Identité du déclarant</Text>
            <View style={[styles.identityCard, { backgroundColor: bgCard, borderColor: borderCol }]}>
              <Ionicons name="person-circle-outline" size={24} color={primaryColor} />
              <View>
                <Text style={[styles.userName, { color: textMain }]}>{userFullName}</Text>
                <Text style={styles.userSubtitle}>Votre identité est liée à ce dossier</Text>
              </View>
            </View>
          </View>

          {/* SÉLECTEUR DE TYPE */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textMain }]}>Nature de l'incident</Text>
            <View style={styles.typeGrid}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setProvisionalOffence(t)}
                  style={[
                    styles.typeChip,
                    provisionalOffence === t 
                      ? { backgroundColor: primaryColor, borderColor: primaryColor } 
                      : { backgroundColor: inputBg, borderColor: borderCol }
                  ]}
                >
                  <Text style={[styles.chipText, { color: provisionalOffence === t ? "#FFF" : textSub }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* LIEU */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textMain }]}>Lieu des faits</Text>
            <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <Ionicons name="location" size={18} color={primaryColor} />
              <TextInput
                style={[styles.textInput, { color: textMain }]}
                placeholder="Ex: Niamey, Quartier Poudrière"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* DESCRIPTION */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textMain }]}>Description détaillée</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: inputBg, borderColor: borderCol, color: textMain }]}
              placeholder="Décrivez précisément les faits..."
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* PIÈCES JOINTES */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textMain }]}>Preuves (Photos, PDF)</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              style={[styles.uploadArea, { borderColor: primaryColor, backgroundColor: primaryColor + (isDark ? "20" : "08") }]}
              onPress={pickEvidence}
            >
              <Ionicons name="cloud-upload" size={24} color={primaryColor} />
              <Text style={[styles.uploadText, { color: primaryColor }]}>Ajouter des preuves</Text>
            </TouchableOpacity>

            {attachments.map((file, index) => (
              <View key={index} style={[styles.fileRow, { backgroundColor: bgCard, borderColor: borderCol }]}>
                <Ionicons name="document-attach" size={18} color={primaryColor} />
                <Text style={[styles.fileName, { color: textMain }]} numberOfLines={1}>{file.name}</Text>
                <TouchableOpacity onPress={() => removeAttachment(index)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* BOUTON VALIDATION */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.submitBtn, { backgroundColor: primaryColor }, isGlobalLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isGlobalLoading}
          >
            {isGlobalLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitText}>TRANSMETTRE LA PLAINTE</Text>
                <Ionicons name="send" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerSpacing} />

        </ScrollView>
      </KeyboardAvoidingView>
      
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  infoBox: { flexDirection: "row", padding: 15, borderRadius: 16, borderLeftWidth: 4, marginBottom: 25, alignItems: "center", gap: 10 },
  infoText: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  identityCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  userName: { fontSize: 15, fontWeight: '900' },
  userSubtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: "900", marginBottom: 10, textTransform: 'uppercase', opacity: 0.7, letterSpacing: 0.5 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontWeight: "800", fontSize: 11 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1.5 },
  textInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600' },
  textArea: { borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1.5, minHeight: 120, fontWeight: '600' },
  uploadArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', gap: 10 },
  uploadText: { fontSize: 13, fontWeight: '800' },
  fileRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 8, gap: 10 },
  fileName: { flex: 1, fontSize: 12, fontWeight: '700' },
  submitBtn: { flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, gap: 12 },
  submitText: { color: "#FFF", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
  footerSpacing: { height: 120 }
});