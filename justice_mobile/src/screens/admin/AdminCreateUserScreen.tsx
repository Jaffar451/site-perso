import React, { useState, useMemo } from 'react';
import {
  View, TextInput, StyleSheet, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image, StatusBar,
  Modal, FlatList
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../types/navigation';

import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import { useAppTheme } from '../../theme/AppThemeProvider';
import { createUser } from '../../services/admin.service';
import { getAllCourts } from '../../services/court.service';
import { getAllStations } from '../../services/policeStation.service';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminCreateUser'>;
type UserRole = "admin" | "prosecutor" | "judge" | "greffier" | "commissaire" | "officier_police" | "inspecteur" | "citizen";
type OrganizationType = "POLICE" | "GENDARMERIE" | "JUSTICE" | "ADMIN" | "CITIZEN";

const ROLES_CONFIG = [
  { value: "officier_police", label: "Officier (OPJ)", icon: "shield-outline", color: "#2563EB" },
  { value: "commissaire", label: "Commissaire", icon: "ribbon-outline", color: "#1E40AF" },
  { value: "prosecutor", label: "Procureur", icon: "business-outline", color: "#8B5CF6" },
  { value: "judge", label: "Juge", icon: "hammer-outline", color: "#7C3AED" },
  { value: "greffier", label: "Greffier", icon: "book-outline", color: "#0D9488" },
  { value: "admin", label: "Admin Système", icon: "key-outline", color: "#EF4444" },
  { value: "citizen", label: "Citoyen", icon: "person-outline", color: "#64748B" },
] as const;

const NIGER_REGIONS = [
  "Agadez", "Diffa", "Dosso", "Maradi", "Tahoua", "Tillabéri", "Zinder", "Niamey"
];

// ✅ COMPOSANTS DÉPLACÉS À L'EXTÉRIEUR pour éviter la perte de focus
const InputField = ({ label, value, onChange, placeholder, icon, keyboardType = "default", editable = true, colors, isDark }: any) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.textSub} style={{ marginRight: 12 }} />
      <TextInput 
        style={[styles.input, { color: colors.textMain }]} 
        value={value} 
        onChangeText={onChange} 
        placeholder={placeholder} 
        placeholderTextColor={isDark ? "#475569" : "#94A3B8"} 
        keyboardType={keyboardType} 
        autoCapitalize="none"
        editable={editable}
      />
    </View>
  </View>
);

const SelectField = ({ label, value, onSelect, placeholder, icon, options, colors, isDark }: any) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
    <TouchableOpacity 
      style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
      onPress={() => onSelect(true)}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={colors.textSub} style={{ marginRight: 12 }} />
      <Text style={[styles.input, { color: value ? colors.textMain : (isDark ? "#475569" : "#94A3B8") }]}>
        {value || placeholder}
      </Text>
      <Ionicons name="chevron-down-outline" size={20} color={colors.textSub} />
    </TouchableOpacity>
  </View>
);

const SelectionModal = ({ visible, onClose, title, options, onSelect, selectedValue, colors, primaryColor }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.textMain }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.textSub} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={options}
          keyExtractor={(item: string) => item}
          renderItem={({ item }: { item: string }) => (
            <TouchableOpacity
              style={[styles.modalItem, { borderBottomColor: colors.border }]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={[styles.modalItemText, { color: colors.textMain }, selectedValue === item && { color: primaryColor, fontWeight: '700' }]}>
                {item}
              </Text>
              {selectedValue === item && <Ionicons name="checkmark-outline" size={20} color={primaryColor} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

export default function AdminCreateUserScreen({ navigation }: Props) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const queryClient = useQueryClient();

  const [image, setImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  
  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', personalEmail: '', telephone: '',
    alternativePhone: '', password: '', role: 'officier_police' as UserRole,
    selectedStructureId: null as number | null, matricule: '',
    address: '', city: '', 
    dateDay: '', dateMonth: '', dateYear: '',
    placeOfBirth: '', region: '', nationality: 'Nigérienne', cin: '',
  });

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#FFFFFF",
  };

  const { data: courtsRaw, isLoading: loadingCourts } = useQuery({
    queryKey: ['courts'], queryFn: getAllCourts,
    enabled: ['prosecutor', 'judge', 'greffier'].includes(form.role)
  });

  const { data: stationsRaw, isLoading: loadingStations } = useQuery({
    queryKey: ['stations'], queryFn: getAllStations,
    enabled: ['officier_police', 'commissaire'].includes(form.role)
  });

  const courts = useMemo(() => (courtsRaw as any)?.data || (Array.isArray(courtsRaw) ? courtsRaw : []), [courtsRaw]);
  const stations = useMemo(() => (stationsRaw as any)?.data || (Array.isArray(stationsRaw) ? stationsRaw : []), [stationsRaw]);

  const generateSecurePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(prev => ({ ...prev, password }));
    setShowPassword(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Permission", "Accès galerie requis.");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const mutation = useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: (newUser: any) => {
      console.log('[CREATE USER] Réponse API brute:', newUser);
      
      // ✅ Extraction robuste de l'ID (supporte différents formats de réponse)
      const userId = newUser?.id 
        || newUser?._id 
        || newUser?.data?.id 
        || newUser?.data?._id
        || newUser?.user?.id
        || newUser?.user?._id;

      // Invalider le cache des utilisateurs pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // ✅ Navigation sécurisée avec fallback
      if (userId) {
        navigation.replace("AdminUserDetails", { userId });
        Alert.alert("Succès", "L'agent a été correctement enrôlé !");
      } else {
        console.warn('[CREATE USER] ID non trouvé, retour à la liste');
        Alert.alert(
          "Succès", 
          "L'agent a été créé ! (Détails indisponibles)",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    },
    onError: (err: any) => {
      console.error('[CREATE USER] Erreur:', err);
      Alert.alert("Échec", err.response?.data?.message || "Erreur serveur.")
    }
  });

  const handleCreateUser = () => {
    if (!form.firstname.trim() || !form.email.trim() || !form.password.trim()) {
      return Alert.alert("Erreur", "Champs obligatoires manquants.");
    }

    if (!form.dateDay || !form.dateMonth || !form.dateYear) {
      return Alert.alert("Erreur", "Date de naissance incomplète.");
    }
    const day = form.dateDay.padStart(2, '0');
    const month = form.dateMonth.padStart(2, '0');
    const year = form.dateYear;
    if (parseInt(day) > 31 || parseInt(month) > 12 || parseInt(year) < 1900) {
      return Alert.alert("Erreur", "Date de naissance invalide.");
    }
    const formattedDate = `${day}/${month}/${year}`;

    let organization: OrganizationType = "CITIZEN";
    if (['officier_police', 'commissaire'].includes(form.role)) organization = "POLICE";
    else if (['prosecutor', 'judge', 'greffier'].includes(form.role)) organization = "JUSTICE";
    else if (form.role === 'admin') organization = "ADMIN";

    mutation.mutate({
      ...form,
      dateOfBirth: formattedDate,
      organization,
      courtId: organization === "JUSTICE" ? Number(form.selectedStructureId) : null,
      policeStationId: organization === "POLICE" ? Number(form.selectedStructureId) : null,
      photo: image,
    });
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Enrôlement Agent" showBack={true} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bgMain }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* PHOTO UPLOAD */}
          <View style={styles.photoUploadContainer}>
            <TouchableOpacity style={[styles.photoFrame, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={pickImage}>
              {image ? <Image source={{ uri: image }} style={styles.fullImage} /> : (
                <View style={styles.placeholderContainer}>
                  <Ionicons name="camera-outline" size={32} color={primaryColor} />
                  <Text style={[styles.placeholderText, { color: primaryColor }]}>Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* SECTION IDENTITÉ */}
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Identité</Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Prénom *" value={form.firstname} onChange={(text: string) => setForm(p => ({...p, firstname: text}))} placeholder="Prénom" icon="person-outline" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Nom *" value={form.lastname} onChange={(text: string) => setForm(p => ({...p, lastname: text}))} placeholder="Nom" icon="person-outline" colors={colors} isDark={isDark} />
            </View>
          </View>

          {/* DATE DE NAISSANCE SÉPARÉE */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Date de Naissance *</Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 0.3 }}>
                <InputField label="Jour" value={form.dateDay} onChange={(text: string) => setForm(p => ({...p, dateDay: text.replace(/\D/g, '')}))} placeholder="JJ" icon="calendar-outline" keyboardType="numeric" maxLength={2} colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 0.3 }}>
                <InputField label="Mois" value={form.dateMonth} onChange={(text: string) => setForm(p => ({...p, dateMonth: text.replace(/\D/g, '')}))} placeholder="MM" icon="calendar-outline" keyboardType="numeric" maxLength={2} colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 0.4 }}>
                <InputField label="Année" value={form.dateYear} onChange={(text: string) => setForm(p => ({...p, dateYear: text.replace(/\D/g, '')}))} placeholder="AAAA" icon="calendar-outline" keyboardType="numeric" maxLength={4} colors={colors} isDark={isDark} />
              </View>
            </View>
          </View>

          {/* Lieu de Naissance - Champ de saisie texte */}
          <InputField
            label="Lieu de Naissance"
            value={form.placeOfBirth}
            onChange={(text: string) => setForm(p => ({...p, placeOfBirth: text}))}
            placeholder="Ville de naissance"
            icon="location-outline"
            colors={colors}
            isDark={isDark}
          />

          {/* Région - Sélection avec modal */}
          <SelectField
            label="Région"
            value={form.region}
            onSelect={() => setShowRegionModal(true)}
            placeholder="Sélectionner une région"
            icon="map-outline"
            options={NIGER_REGIONS}
            colors={colors}
            isDark={isDark}
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Nationalité" value={form.nationality} onChange={(text: string) => setForm(p => ({...p, nationality: text}))} placeholder="Nigérienne" icon="flag-outline" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="CIN" value={form.cin} onChange={(text: string) => setForm(p => ({...p, cin: text}))} placeholder="N° CIN" icon="card-outline" colors={colors} isDark={isDark} />
            </View>
          </View>

          {/* SECTION CONTACT */}
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Contact</Text>
          <InputField label="Email Professionnel *" value={form.email} onChange={(text: string) => setForm(p => ({...p, email: text}))} placeholder="email@justice.gov.ne" icon="mail-outline" keyboardType="email-address" colors={colors} isDark={isDark} />
          <InputField label="Email Personnel" value={form.personalEmail} onChange={(text: string) => setForm(p => ({...p, personalEmail: text}))} placeholder="email@example.com" icon="mail-outline" keyboardType="email-address" colors={colors} isDark={isDark} />

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Téléphone *" value={form.telephone} onChange={(text: string) => setForm(p => ({...p, telephone: text}))} placeholder="+227 XXXXXXXX" icon="call-outline" keyboardType="phone-pad" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Téléphone Alt." value={form.alternativePhone} onChange={(text: string) => setForm(p => ({...p, alternativePhone: text}))} placeholder="+227 XXXXXXXX" icon="call-outline" keyboardType="phone-pad" colors={colors} isDark={isDark} />
            </View>
          </View>

          {/* SECTION ADRESSE */}
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Adresse</Text>
          <InputField label="Adresse" value={form.address} onChange={(text: string) => setForm(p => ({...p, address: text}))} placeholder="Rue, numéro" icon="home-outline" colors={colors} isDark={isDark} />
          <InputField label="Ville" value={form.city} onChange={(text: string) => setForm(p => ({...p, city: text}))} placeholder="Niamey" icon="location-outline" colors={colors} isDark={isDark} />

          {/* SECTION PROFESSIONNEL */}
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Professionnel</Text>
          <InputField label="Matricule" value={form.matricule} onChange={(text: string) => setForm(p => ({...p, matricule: text}))} placeholder="MAT-2026-001" icon="id-card-outline" colors={colors} isDark={isDark} />

          {/* SÉLECTION RÔLE */}
          <Text style={[styles.label, { color: colors.textSub, marginTop: 15 }]}>Rôle *</Text>
          <View style={styles.roleGrid}>
            {ROLES_CONFIG.map((roleOption) => (
              <TouchableOpacity
                key={roleOption.value}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: form.role === roleOption.value ? roleOption.color : colors.bgCard,
                    borderColor: form.role === roleOption.value ? roleOption.color : colors.border,
                  }
                ]}
                onPress={() => setForm(p => ({...p, role: roleOption.value as UserRole, selectedStructureId: null }))}
              >
                <Ionicons name={roleOption.icon} size={20} color={form.role === roleOption.value ? "#FFF" : roleOption.color} />
                <Text style={[styles.roleLabel, { color: form.role === roleOption.value ? "#FFF" : colors.textMain }]}>{roleOption.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SÉLECTION STRUCTURE (Dynamique) */}
          {['prosecutor', 'judge', 'greffier'].includes(form.role) && (
            <View>
              <Text style={[styles.label, { color: colors.textSub, marginTop: 20 }]}>Tribunal *</Text>
              {loadingCourts ? <ActivityIndicator color={primaryColor} style={{ marginVertical: 20 }} /> : (
                <View style={styles.structureList}>
                  {courts.map((court: any) => (
                    <TouchableOpacity key={court.id} style={[styles.structureItem, { backgroundColor: form.selectedStructureId === court.id ? primaryColor : colors.bgCard, borderWidth: 1, borderColor: form.selectedStructureId === court.id ? primaryColor : colors.border }]} onPress={() => setForm(p => ({...p, selectedStructureId: court.id }))}>
                      <Ionicons name="business-outline" size={20} color={form.selectedStructureId === court.id ? "#FFF" : colors.textMain} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[{ fontWeight: '700', fontSize: 14 }, { color: form.selectedStructureId === court.id ? "#FFF" : colors.textMain }]}>{court.name}</Text>
                        <Text style={[{ fontWeight: '500', fontSize: 12, marginTop: 2 }, { color: form.selectedStructureId === court.id ? "rgba(255,255,255,0.8)" : colors.textSub }]}>{court.region}</Text>
                      </View>
                      {form.selectedStructureId === court.id && <Ionicons name="checkmark-circle" size={24} color="#FFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {['officier_police', 'commissaire'].includes(form.role) && (
            <View>
              <Text style={[styles.label, { color: colors.textSub, marginTop: 20 }]}>Poste de Police *</Text>
              {loadingStations ? <ActivityIndicator color={primaryColor} style={{ marginVertical: 20 }} /> : (
                <View style={styles.structureList}>
                  {stations.map((station: any) => (
                    <TouchableOpacity key={station.id} style={[styles.structureItem, { backgroundColor: form.selectedStructureId === station.id ? primaryColor : colors.bgCard, borderWidth: 1, borderColor: form.selectedStructureId === station.id ? primaryColor : colors.border }]} onPress={() => setForm(p => ({...p, selectedStructureId: station.id }))}>
                      <Ionicons name="shield-outline" size={20} color={form.selectedStructureId === station.id ? "#FFF" : colors.textMain} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[{ fontWeight: '700', fontSize: 14 }, { color: form.selectedStructureId === station.id ? "#FFF" : colors.textMain }]}>{station.name}</Text>
                        <Text style={[{ fontWeight: '500', fontSize: 12, marginTop: 2 }, { color: form.selectedStructureId === station.id ? "rgba(255,255,255,0.8)" : colors.textSub }]}>{station.region}</Text>
                      </View>
                      {form.selectedStructureId === station.id && <Ionicons name="checkmark-circle" size={24} color="#FFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* SECTION SÉCURITÉ */}
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Sécurité</Text>
          <View style={[styles.inputGroup]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={[styles.label, { color: colors.textSub }]}>Mot de passe *</Text>
              <TouchableOpacity onPress={generateSecurePassword}><Text style={[styles.label, { color: primaryColor, fontSize: 10 }]}>GÉNÉRER</Text></TouchableOpacity>
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSub} style={{ marginRight: 12 }} />
              <TextInput style={[styles.input, { color: colors.textMain }]} value={form.password} onChangeText={(text: string) => setForm(p => ({...p, password: text}))} placeholder="••••••••" placeholderTextColor={isDark ? "#475569" : "#94A3B8"} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSub} /></TouchableOpacity>
            </View>
          </View>

          {/* BOUTON SOUMETTRE */}
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: primaryColor }, mutation.isPending && { opacity: 0.6 }]} onPress={handleCreateUser} disabled={mutation.isPending}>
            {mutation.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>VALIDER L'ENRÔLEMENT</Text>}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de sélection pour la région */}
        <SelectionModal visible={showRegionModal} onClose={() => setShowRegionModal(false)} title="Région" options={NIGER_REGIONS} onSelect={(value: string) => setForm(p => ({...p, region: value}))} selectedValue={form.region} colors={colors} primaryColor={primaryColor} />
      </KeyboardAvoidingView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20 },
  photoUploadContainer: { alignItems: 'center', marginBottom: 25 },
  photoFrame: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { fontSize: 10, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  photoHint: { fontSize: 11, marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: "900", marginBottom: 12, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 10 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 10, fontWeight: "900", marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 15, fontWeight: "700", height: '100%' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, width: '48.5%', gap: 10, borderWidth: 1.5 },
  roleLabel: { fontSize: 11, fontWeight: '800', flex: 1 },
  structureList: { gap: 10 },
  structureItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 18 },
  submitBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 35, elevation: 4, ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' } : {}) },
  submitText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  modalItemText: { fontSize: 14, fontWeight: '600' },
});