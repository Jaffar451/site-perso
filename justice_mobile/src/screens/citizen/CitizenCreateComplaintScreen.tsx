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
import { useQueryClient } from "@tanstack/react-query";
import { useOfflineMutation } from "../../hooks/useOfflineMutation";
import * as DocumentPicker from 'expo-document-picker';

import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider"; 
import { CitizenScreenProps } from "../../types/navigation";

import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { Toast } from "../../components/ui/ToastManager";

import { createComplaint, uploadAttachment } from "../../services/complaint.service";

const LEGAL_REFERENCES: Record<string, { article: string; peine: string; description: string }> = {
  "Vol": {
    article: "Art. 320-321 du Code Pénal du Niger",
    peine: "1 à 5 ans d'emprisonnement et amende",
    description: "Quiconque soustrait frauduleusement une chose appartenant à autrui est coupable de vol.",
  },
  "Cambriolage": {
    article: "Art. 322-324 du Code Pénal du Niger",
    peine: "5 à 10 ans d'emprisonnement",
    description: "Le vol commis avec effraction, escalade ou usage de fausses clés dans un lieu d'habitation constitue un cambriolage, circonstance aggravante du vol.",
  },
  "Agression": {
    article: "Art. 222-225 du Code Pénal du Niger",
    peine: "2 à 10 ans selon la gravité",
    description: "Les violences ayant entraîné une incapacité de travail ou des blessures. Peine aggravée si commises avec préméditation ou en réunion.",
  },
  "Coups et blessures": {
    article: "Art. 222-223 du Code Pénal du Niger",
    peine: "2 mois à 5 ans selon l'ITT",
    description: "Coups et blessures volontaires ayant entraîné une incapacité temporaire de travail. La peine varie selon la durée de l'ITT constatée.",
  },
  "Menaces": {
    article: "Art. 230-232 du Code Pénal du Niger",
    peine: "6 mois à 3 ans d'emprisonnement",
    description: "Toute menace de mort ou de violence faite par écrit, verbalement ou par geste, avec ou sans condition, est punie d'emprisonnement.",
  },
  "Harcèlement": {
    article: "Art. 281 du Code Pénal du Niger",
    peine: "1 à 3 ans d'emprisonnement et amende",
    description: "Le fait de harceler autrui par des propos ou comportements répétés ayant pour objet ou effet de porter atteinte à sa dignité ou de créer un environnement hostile.",
  },
  "Escroquerie": {
    article: "Art. 335-337 du Code Pénal du Niger",
    peine: "1 à 5 ans d'emprisonnement et amende",
    description: "Quiconque, en employant des manœuvres frauduleuses, se fait remettre des fonds, valeurs ou biens quelconques.",
  },
  "Abus de confiance": {
    article: "Art. 338-340 du Code Pénal du Niger",
    peine: "1 à 5 ans d'emprisonnement et amende",
    description: "Le détournement de fonds, effets ou marchandises remis à titre de mandat, dépôt, location ou prêt constitue un abus de confiance.",
  },
  "Faux et usage de faux": {
    article: "Art. 149-156 du Code Pénal du Niger",
    peine: "5 à 10 ans d'emprisonnement",
    description: "Toute altération frauduleuse de la vérité dans un écrit ou document pouvant causer un préjudice, et l'usage de ce document.",
  },
  "Corruption": {
    article: "Loi n°2003-025 et Art. 128-133 du Code Pénal",
    peine: "2 à 10 ans d'emprisonnement et amende",
    description: "Le fait de solliciter ou d'accepter des dons, promesses ou avantages pour accomplir ou s'abstenir d'un acte relevant de sa fonction.",
  },
  "Destruction de biens": {
    article: "Art. 345-348 du Code Pénal du Niger",
    peine: "2 à 5 ans d'emprisonnement et amende",
    description: "La destruction, dégradation ou détérioration volontaire d'un bien appartenant à autrui est punie d'emprisonnement.",
  },
  "Cybercriminalité": {
    article: "Loi n°2019-33 sur la Cybercriminalité au Niger",
    peine: "1 à 10 ans selon l'infraction",
    description: "Atteinte aux systèmes informatiques, fraude en ligne, usurpation d'identité numérique ou diffusion de contenus illicites.",
  },
  "Violences conjugales": {
    article: "Art. 222-228 et Loi n°2020-31 du Niger",
    peine: "1 à 20 ans selon la gravité",
    description: "Toute violence physique, psychologique ou économique exercée par un conjoint ou partenaire. Circonstance aggravante reconnue par la loi nigérienne.",
  },
  "Enlèvement": {
    article: "Art. 270-274 du Code Pénal du Niger",
    peine: "5 à 20 ans de réclusion criminelle",
    description: "Le fait d'enlever, détenir ou séquestrer une personne sans ordre légitime. La peine est aggravée si la victime est mineure.",
  },
  "Homicide": {
    article: "Art. 208-218 du Code Pénal du Niger",
    peine: "Réclusion criminelle à perpétuité",
    description: "Le fait de donner volontairement la mort à autrui constitue un meurtre. L'assassinat est un meurtre commis avec préméditation.",
  },
  "Trafic de stupéfiants": {
    article: "Loi n°2007-08 relative au trafic de drogues",
    peine: "5 à 20 ans d'emprisonnement et amende",
    description: "La production, fabrication, transport, importation, exportation, détention ou cession de substances stupéfiantes.",
  },
  "Abus de pouvoir": {
    article: "Art. 134-138 du Code Pénal du Niger",
    peine: "2 à 10 ans d'emprisonnement",
    description: "Tout acte arbitraire ou attentatoire aux libertés commis par un dépositaire de l'autorité publique dans l'exercice de ses fonctions.",
  },
  "Recel": {
    article: "Art. 341-343 du Code Pénal du Niger",
    peine: "1 à 5 ans d'emprisonnement",
    description: "Le fait de dissimuler, détenir ou transmettre une chose en sachant qu'elle provient d'un crime ou d'un délit.",
  },
  "Atteinte à l'ordre public": {
    article: "Art. 102-110 du Code Pénal du Niger",
    peine: "1 à 5 ans d'emprisonnement",
    description: "Tout acte de nature à troubler gravement la paix publique, incluant attroupements, manifestations illégales ou incitation à la révolte.",
  },
  "Autre": {
    article: "Code Pénal du Niger",
    peine: "Variable selon la qualification",
    description: "Toute infraction sera qualifiée par l'Officier de Police Judiciaire (OPJ) compétent après examen des faits déclarés.",
  },
};

const LegalInfoBox = ({ type, colors, primaryColor, isDark }: any) => {
  const info = LEGAL_REFERENCES[type] || LEGAL_REFERENCES["Autre"];
  return (
    <View style={{
      backgroundColor: isDark ? "#1a1a2e" : "#EFF6FF",
      borderColor: isDark ? "#1E40AF" : "#BFDBFE",
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: primaryColor,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Ionicons name="book-outline" size={18} color={primaryColor} />
        <Text style={{ fontSize: 12, fontWeight: '900', color: primaryColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Référence juridique
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#93C5FD' : '#1E40AF', marginBottom: 4 }}>
        {info.article}
      </Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#CBD5E1' : '#475569', lineHeight: 18, marginBottom: 8 }}>
        {info.description}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: isDark ? '#172554' : '#DBEAFE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' }}>
        <Ionicons name="warning-outline" size={14} color={isDark ? '#FCD34D' : '#B45309'} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#FCD34D' : '#92400E' }}>
          Peine encourue : {info.peine}
        </Text>
      </View>
    </View>
  );
};

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

  const types = [
    "Vol", "Cambriolage", "Agression", "Coups et blessures", "Menaces", "Harcèlement",
    "Escroquerie", "Abus de confiance", "Faux et usage de faux", "Corruption",
    "Destruction de biens", "Cybercriminalité", "Violences conjugales",
    "Enlèvement", "Homicide", "Trafic de stupéfiants", "Abus de pouvoir",
    "Recel", "Atteinte à l'ordre public", "Autre",
  ];

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
      if (Platform.OS === 'web') window.alert("Erreur\n\nAccès aux fichiers impossible.");
      else Alert.alert("Erreur", "Accès aux fichiers impossible.");
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const mutation = useOfflineMutation({
    resource: 'complaints',
    action: 'create',
    mutationFn: createComplaint,
    invalidateKeys: [["my-complaints"]],
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
        if (Platform.OS === 'web') window.alert("Erreur\n\nImpossible de transmettre la plainte.");
        else Alert.alert("Erreur", "Impossible de transmettre la plainte.");
    }
  });

  const handleSubmit = () => {
    if (!description.trim() || !location.trim()) {
      if (Platform.OS === 'web') window.alert("Incomplet\n\nVeuillez préciser le lieu et la description.");
      else Alert.alert("Incomplet", "Veuillez préciser le lieu et la description.");
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

          {/* RÉFÉRENCE JURIDIQUE */}
          <LegalInfoBox type={provisionalOffence} colors={{ bgCard, textMain, textSub, borderCol }} primaryColor={primaryColor} isDark={isDark} />

          {/* LIEU */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: textMain }]}>Lieu des faits</Text>
            <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
              <Ionicons name="location-outline" size={20} color={textSub} style={{ marginRight: 4 }} />
              <TextInput
                style={[styles.textInput, { color: textMain, paddingVertical: Platform.OS === 'web' ? 14 : 0 }]}
                placeholder="Ville, quartier, rue..."
                placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
                value={location}
                onChangeText={setLocation}
                autoCapitalize="words"
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