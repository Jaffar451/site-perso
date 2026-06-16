import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Linking
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';

import { getAppTheme } from "../../theme";
import { CitizenScreenProps } from "../../types/navigation";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { updateComplaint, uploadAttachment } from "../../services/complaint.service";
import { ENV } from "../../config/env"; // ← fix : API_URL n'est pas exporté depuis api.ts

export default function CitizenEditComplaintScreen({ navigation, route }: CitizenScreenProps<'CitizenEditComplaint'>) {
  const theme = getAppTheme();
  const primaryColor = theme.color;

  const complaintData = route.params.complaint;

  const [title, setTitle]             = useState(complaintData.title || "");
  const [description, setDescription] = useState(complaintData.description || "");
  const [attachments, setAttachments] = useState<any[]>(complaintData.attachments || []);
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);

  // ── Résolution d'URL de fichier ──────────────────────────────
  const getFullFileUrl = (file: any): string | null => {
    if (!file) return null;

    // URL complète déjà présente
    const url = file.fileUrl || file.file_url || file.uri;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) return url;

    // Chemin relatif → on préfixe avec le serveur
    const relative = url || file.filename;
    if (relative) {
      const base = ENV.API_URL.replace('/api', '');
      return `${base}/uploads/evidence/${relative.replace(/.*uploads\/evidence\//, '')}`;
    }

    return null;
  };

  // ── Enregistrement du texte ──────────────────────────────────
  const handleUpdate = async () => {
    if (!description.trim()) {
      Alert.alert("Champs requis", "Le récit des faits est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      await updateComplaint(complaintData.id, {
        title: title.trim(),
        description: description.trim(),
      });

      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.alert("Mise à jour réussie !");
          navigation.goBack();
        }, 100);
      } else {
        Alert.alert("Succès", "Votre dossier a été modifié.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ], { cancelable: false });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      Alert.alert("Erreur", "Échec de l'enregistrement : " + msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload de pièce jointe ────────────────────────────────────
  const handleAddAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];

        if (file.size && file.size > 50 * 1024 * 1024) {
          Alert.alert("Fichier trop lourd", "La taille limite est de 50 Mo.");
          return;
        }

        setUploading(true);
        try {
          const response = await uploadAttachment(complaintData.id, {
            uri:      file.uri,
            name:     file.name,
            mimeType: file.mimeType,
          });

          // Le service retourne déjà l'objet créé
          setAttachments(prev => [...prev, response]);

          if (Platform.OS === 'web') window.alert("Document ajouté avec succès !");
          else Alert.alert("Document ajouté", "Pièce jointe enregistrée.");
        } catch (err) {
          console.error("Upload error:", err);
          Alert.alert("Erreur Upload", "Impossible d'envoyer le fichier.");
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error("Picker error:", err);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title={`Éditer Dossier #${complaintData.trackingCode || complaintData.id}`} showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={24} color={primaryColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: primaryColor }]}>Mode Édition</Text>
              <Text style={[styles.warningText, { color: "#334155" }]}>
                Vous pouvez corriger votre récit et ajouter des preuves tant que l'enquête n'est pas clôturée.
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>TITRE / OBJET</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Vol de téléphone..."
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>RÉCIT DÉTAILLÉ DES FAITS</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholder="Décrivez ce qui s'est passé..."
              />
            </View>
          </View>

          <View style={styles.attachmentSection}>
            <Text style={styles.sectionTitle}>PIÈCES JOINTES & PREUVES ({attachments.length})</Text>

            {attachments.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fileList}>
                {attachments.map((file, index) => {
                  const url   = getFullFileUrl(file);
                  const name  = file.filename || file.name || `Fichier ${index + 1}`;
                  const isImg = (file.mimeType || file.type || "").startsWith('image/') ||
                                name.match(/\.(jpg|png|jpeg|webp)$/i);
                  return (
                    <TouchableOpacity
                      key={file.id || index}
                      style={styles.fileItem}
                      onPress={() => url && Linking.openURL(url)}
                    >
                      {isImg && url ? (
                        <Image source={{ uri: url }} style={styles.fileThumb} />
                      ) : (
                        <View style={[styles.fileThumb, { backgroundColor: "#E2E8F0" }]}>
                          <Ionicons name="document-text" size={24} color="#64748B" />
                        </View>
                      )}
                      <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.addFileBtn}
              onPress={handleAddAttachment}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={primaryColor} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={24} color={primaryColor} />
                  <Text style={[styles.addFileText, { color: primaryColor }]}>
                    Ajouter une preuve (Photo/PDF)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.saveBtn, { backgroundColor: primaryColor }, saving && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={saving || uploading}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.saveBtnText}>ENREGISTRER LES MODIFICATIONS</Text>
                <Ionicons name="save-outline" size={20} color="#fff" />
              </View>
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
  scrollView:        { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent:     { padding: 20 },
  warningBox:        { flexDirection: 'row', padding: 16, borderRadius: 16, marginBottom: 25, alignItems: 'center', gap: 12, backgroundColor: "#F0F9FF", borderWidth: 1, borderColor: "#BAE6FD" },
  warningTitle:      { fontWeight: '900', fontSize: 13, marginBottom: 2, textTransform: 'uppercase' },
  warningText:       { fontSize: 12, lineHeight: 18, fontWeight: '500' },
  formSection:       { marginBottom: 20 },
  formGroup:         { marginBottom: 20 },
  label:             { fontSize: 11, fontWeight: '900', marginBottom: 10, marginLeft: 4, letterSpacing: 1, color: "#64748B" },
  input:             { borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, fontWeight: '600', backgroundColor: "#FFF", color: "#1E293B", borderColor: "#E2E8F0" },
  textArea:          { borderRadius: 16, padding: 16, fontSize: 15, borderWidth: 1, minHeight: 150, lineHeight: 24, fontWeight: '600', backgroundColor: "#FFF", color: "#1E293B", borderColor: "#E2E8F0" },
  attachmentSection: { marginBottom: 30 },
  sectionTitle:      { fontSize: 11, fontWeight: '900', marginBottom: 15, marginLeft: 4, letterSpacing: 1, color: "#64748B" },
  fileList:          { flexDirection: 'row', marginBottom: 15 },
  fileItem:          { marginRight: 15, width: 80, alignItems: 'center' },
  fileThumb:         { width: 70, height: 70, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: "#E2E8F0", backgroundColor: "#FFF" },
  fileName:          { fontSize: 10, color: "#64748B", marginTop: 5, textAlign: 'center' },
  addFileBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: "#E2E8F0", borderStyle: 'dashed', backgroundColor: "#F8FAFC" },
  addFileText:       { fontWeight: '700', fontSize: 13 },
  saveBtn: {
    height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 10,
    ...Platform.select({
      android: { elevation: 4 },
      ios:     { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
      web:     { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  btnRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveBtnText:  { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  footerSpacing: { height: 120 },
});