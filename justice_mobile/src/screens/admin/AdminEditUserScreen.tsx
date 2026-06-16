import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, ScrollView, Switch, Platform, Image,
  KeyboardAvoidingView, StatusBar, Modal, FlatList
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as ExpoClipboard from 'expo-clipboard';

import { getUserById, updateUser } from "../../services/user.service";
import { getAllCourts } from "../../services/court.service";
import { getAllStations } from "../../services/policeStation.service";
import { AdminScreenProps } from "../../types/navigation";
import { useAppTheme } from "../../theme/AppThemeProvider";
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

const NIGER_REGIONS = [
  "Agadez", "Diffa", "Dosso", "Maradi", "Tahoua", "Tillabéri", "Zinder", "Niamey"
];

const InputField = ({ label, value, onChange, placeholder, icon, keyboardType = "default", editable = true, colors, isDark, maxLength }: any) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>
    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      {icon && <Ionicons name={icon} size={20} color={colors.textSub} style={{ marginRight: 12 }} />}
      <TextInput
        style={[styles.input, { color: colors.textMain }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#475569" : "#94A3B8"}
        keyboardType={keyboardType}
        autoCapitalize="none"
        editable={editable}
        maxLength={maxLength}
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

export default function AdminEditUserScreen({ navigation, route }: AdminScreenProps<'AdminEditUser'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const queryClient = useQueryClient();

  const userId = useMemo(() => {
    const id = route.params?.userId;
    if (!id || isNaN(Number(id))) return null;
    return Number(id);
  }, [route.params?.userId]);

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1E293B" : "#FFFFFF",
    passBox: isDark ? "#064E3B" : "#F0FDF4",
    passText: isDark ? "#4ADE80" : "#15803D"
  };

  const ROLES = [
    { label: "Citoyen", value: "citizen", icon: "person-outline", color: "#64748B" },
    { label: "Police", value: "officier_police", icon: "shield-outline", color: "#2563EB" },
    { label: "Commissaire", value: "commissaire", icon: "ribbon-outline", color: "#1E40AF" },
    { label: "Procureur", value: "prosecutor", icon: "briefcase-outline", color: "#8B5CF6" },
    { label: "Juge", value: "judge", icon: "hammer-outline", color: "#7C3AED" },
    { label: "Greffier", value: "greffier", icon: "document-text-outline", color: "#0D9488" },
    { label: "Admin", value: "admin", icon: "key-outline", color: "#EF4444" },
  ];

  const [showRegionModal, setShowRegionModal] = useState(false);

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    personalEmail: "",
    telephone: "",
    alternativePhone: "",
    registrationNumber: "",
    role: "citizen",
    selectedStructureId: null as number | null,
    isActive: true,
    photo: null as string | null,
    address: "",
    city: "",
    dateDay: "",
    dateMonth: "",
    dateYear: "",
    placeOfBirth: "",
    region: "",
    nationality: "",
    cin: "",
  });

  const [newPassword, setNewPassword] = useState("");

  const { data: user, isLoading, error: loadError } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
    retry: 1,
  });

  const isJusticeRole = useMemo(() =>
    ['prosecutor', 'judge', 'greffier'].includes(form.role),
    [form.role]
  );

  const isSecurityRole = useMemo(() =>
    ['officier_police', 'commissaire'].includes(form.role),
    [form.role]
  );

  const { data: courtsRaw } = useQuery({
    queryKey: ['courts'],
    queryFn: getAllCourts,
    enabled: isJusticeRole,
  });

  const { data: stationsRaw } = useQuery({
    queryKey: ['stations'],
    queryFn: getAllStations,
    enabled: isSecurityRole,
  });

  const courts = useMemo(() => (courtsRaw as any)?.data || (Array.isArray(courtsRaw) ? courtsRaw : []), [courtsRaw]);
  const stations = useMemo(() => (stationsRaw as any)?.data || (Array.isArray(stationsRaw) ? stationsRaw : []), [stationsRaw]);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return { day: "", month: "", year: "" };
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return { day: parts[0], month: parts[1], year: parts[2] };
    }
    return { day: "", month: "", year: "" };
  };

  const formatDate = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return "";
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  useEffect(() => {
    if (!user) return;
    const u = (user as any).data || user;
    // ✅ Récupération des champs Person (sous-objet retourné par le backend)
    const person = u.person || {};
    const { day, month, year } = parseDate(
      person.dateOfBirth || u.dateOfBirth || ""
    );

    setForm({
      firstname: u.firstname || "",
      lastname: u.lastname || "",
      email: u.email || "",
      // Champs Person — fallback sur u.X si Person pas encore créé
      personalEmail:    person.email        || u.personalEmail    || "",
      telephone:        u.telephone         || "",
      alternativePhone: person.phone        || u.alternativePhone || "",
      registrationNumber: u.matricule       || u.registrationNumber || "",
      role: u.role || "citizen",
      selectedStructureId: u.courtId || u.policeStationId || u.Court?.id || u.PoliceStation?.id || null,
      isActive: u.status === 'active' || u.isActive === true,
      photo: u.photo || u.avatar || null,
      address:      person.address      || u.address      || "",
      city:         person.city         || u.city         || "",
      dateDay:   day,
      dateMonth: month,
      dateYear:  year,
      placeOfBirth: person.placeOfBirth || u.placeOfBirth || "",
      region:       u.region            || "",
      nationality:  person.nationality  || u.nationality  || "",
      cin:          person.nationalId   || u.cin          || "",
    });
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Erreur", "Permission refusée");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm(f => ({ ...f, photo: result.assets[0].uri }));
    }
  };

  const generatePassword = async () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewPassword(pass);
    try {
      await ExpoClipboard.setStringAsync(pass);
      Alert.alert("Sécurité", `Nouveau mot de passe : ${pass}\n\nCopié dans le presse-papier.`);
    } catch (e) {
      Alert.alert("Mot de passe", `Notez bien ce code : ${pass}`);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUser(userId!, data),
    onSuccess: (result: any) => {
      const updatedUser = result?.data || result;

      queryClient.setQueryData(["users"], (oldData: any) => {
        if (!oldData) return oldData;
        const users = Array.isArray(oldData) ? oldData : oldData.data;
        const updatedUsers = users.map((u: any) =>
          u.id === userId ? { ...u, ...updatedUser } : u
        );
        return Array.isArray(oldData) ? updatedUsers : { ...oldData, data: updatedUsers };
      });

      queryClient.setQueryData(["user", userId], (oldData: any) => {
        const existing = oldData?.data || oldData;
        return { ...oldData, data: { ...existing, ...updatedUser } };
      });

      const successMessage = "Modifications enregistrées avec succès.";
      if (Platform.OS === 'web') {
        window.alert(successMessage);
        navigation.replace('AdminUsers');
      } else {
        Alert.alert("Succès", successMessage, [
          { text: "Continuer", onPress: () => navigation.replace('AdminUsers') }
        ]);
      }
    },
    onError: (error: any) => {
      console.error('[UPDATE USER] Erreur:', error);
      const errorMessage = error?.message || "Erreur lors de la mise à jour.";
      if (Platform.OS === 'web') {
        window.alert(`Erreur : ${errorMessage}`);
      } else {
        Alert.alert("Erreur", errorMessage);
      }
    },
  });

  const handleSave = useCallback(() => {
    if (!form.firstname.trim() || !form.lastname.trim() || !form.email.trim()) {
      Alert.alert("Champs manquants", "Prénom, nom et email sont obligatoires.");
      return;
    }

    if (form.dateDay || form.dateMonth || form.dateYear) {
      if (!form.dateDay || !form.dateMonth || !form.dateYear) {
        return Alert.alert("Erreur", "Date de naissance incomplète.");
      }
      const day = parseInt(form.dateDay);
      const month = parseInt(form.dateMonth);
      const year = parseInt(form.dateYear);
      if (day > 31 || month > 12 || year < 1900) {
        return Alert.alert("Erreur", "Date de naissance invalide.");
      }
    }

    // ✅ CORRECTION : champs vides envoyés comme null pour éviter les conflits
    // de contraintes uniques sur des valeurs vides ("") en base de données
    const payload: any = {
      lastname: form.lastname.toUpperCase().trim(),
      firstname: form.firstname.trim(),
      email: form.email.trim().toLowerCase(),
      personalEmail: form.personalEmail?.trim().toLowerCase() || null,
      telephone: form.telephone?.trim() || null,
      alternativePhone: form.alternativePhone?.trim() || null,
      matricule: form.registrationNumber?.trim() || null,
      role: form.role,
      status: form.isActive ? 'active' : 'inactive',
      courtId: isJusticeRole && form.selectedStructureId ? Number(form.selectedStructureId) : null,
      policeStationId: isSecurityRole && form.selectedStructureId ? Number(form.selectedStructureId) : null,
      photo: form.photo || null,
      address: form.address?.trim() || null,
      city: form.city?.trim() || null,
      dateOfBirth: formatDate(form.dateDay, form.dateMonth, form.dateYear) || null,
      placeOfBirth: form.placeOfBirth?.trim() || null,
      nationality: form.nationality?.trim() || null,
      cin: form.cin?.trim() || null,
    };

    if (newPassword) payload.password = newPassword;
    updateMutation.mutate(payload);
  }, [form, newPassword, isJusticeRole, isSecurityRole]);

  if (!userId) {
    return (
      <ScreenContainer withPadding={false}>
        <AppHeader title="Erreur" showBack />
        <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.errorMsg, { color: "#EF4444" }]}>ID utilisateur invalide</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: primaryColor }]} onPress={() => navigation.goBack()}>
            <Text style={{ color: "#FFF", fontWeight: '700' }}>Retour</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  if (isLoading) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Chargement..." showBack={true} />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ color: colors.textSub, marginTop: 10 }}>Chargement des informations...</Text>
      </View>
    </ScreenContainer>
  );

  if (loadError || !user) return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Erreur" showBack />
      <View style={[styles.center, { backgroundColor: colors.bgMain }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={[styles.errorMsg, { color: "#EF4444" }]}>Impossible de charger l'utilisateur #{userId}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: primaryColor }]} onPress={() => queryClient.invalidateQueries({ queryKey: ["user", userId] })}>
          <Text style={{ color: "#FFF", fontWeight: '700' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Fiche Agent" showBack={true} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.bgMain }} keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.bgMain }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.photoSection}>
            <TouchableOpacity activeOpacity={0.8} style={[styles.photoFrame, { borderColor: primaryColor, backgroundColor: colors.bgCard }]} onPress={pickImage}>
              {form.photo ? <Image source={{ uri: form.photo }} style={styles.fullImage} /> : <Ionicons name="camera-outline" size={40} color={primaryColor} />}
            </TouchableOpacity>
            <Text style={[styles.photoLabel, { color: colors.textSub }]}>Photo d'identification</Text>
            <TouchableOpacity onPress={pickImage} style={{ marginTop: 8 }}>
              <Text style={{ color: primaryColor, fontWeight: '700', fontSize: 12 }}>📷 Changer la photo</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.statusCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={[styles.statusDot, { backgroundColor: form.isActive ? "#10B981" : "#EF4444" }]} />
              <Text style={[styles.statusTitle, { color: colors.textMain }]}>{form.isActive ? "COMPTE ACTIF" : "ACCÈS RÉVOQUÉ"}</Text>
            </View>
            <Switch value={form.isActive} onValueChange={(v) => setForm(f => ({ ...f, isActive: v }))} thumbColor="#FFF" trackColor={{ false: "#CBD5E1", true: "#10B981" }} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Identité</Text>
          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Prénom" value={form.firstname} onChange={(t: string) => setForm(f => ({ ...f, firstname: t }))} placeholder="Prénom" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Nom" value={form.lastname} onChange={(t: string) => setForm(f => ({ ...f, lastname: t.toUpperCase() }))} placeholder="Nom" colors={colors} isDark={isDark} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSub }]}>Date de Naissance</Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 0.3 }}>
                <InputField label="Jour" value={form.dateDay} onChange={(t: string) => setForm(f => ({ ...f, dateDay: t.replace(/\D/g, '') }))} placeholder="JJ" keyboardType="numeric" maxLength={2} colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 0.3 }}>
                <InputField label="Mois" value={form.dateMonth} onChange={(t: string) => setForm(f => ({ ...f, dateMonth: t.replace(/\D/g, '') }))} placeholder="MM" keyboardType="numeric" maxLength={2} colors={colors} isDark={isDark} />
              </View>
              <View style={{ flex: 0.4 }}>
                <InputField label="Année" value={form.dateYear} onChange={(t: string) => setForm(f => ({ ...f, dateYear: t.replace(/\D/g, '') }))} placeholder="AAAA" keyboardType="numeric" maxLength={4} colors={colors} isDark={isDark} />
              </View>
            </View>
          </View>

          <InputField label="Lieu de Naissance" value={form.placeOfBirth} onChange={(t: string) => setForm(f => ({ ...f, placeOfBirth: t }))} placeholder="Ville de naissance" colors={colors} isDark={isDark} />

          <SelectField label="Région" value={form.region} onSelect={() => setShowRegionModal(true)} placeholder="Sélectionner une région" icon="map-outline" options={NIGER_REGIONS} colors={colors} isDark={isDark} />

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Nationalité" value={form.nationality} onChange={(t: string) => setForm(f => ({ ...f, nationality: t }))} placeholder="Nigérienne" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="N° Pièce d'identité" value={form.cin} onChange={(t: string) => setForm(f => ({ ...f, cin: t.toUpperCase() }))} placeholder="CIN" colors={colors} isDark={isDark} />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Coordonnées</Text>

          <InputField label="Email Professionnel" value={form.email} onChange={(t: string) => setForm(f => ({ ...f, email: t }))} placeholder="email@justice.gov.ne" icon="mail-outline" keyboardType="email-address" colors={colors} isDark={isDark} />
          <InputField label="Email Personnel" value={form.personalEmail} onChange={(t: string) => setForm(f => ({ ...f, personalEmail: t }))} placeholder="email@example.com" icon="mail-outline" keyboardType="email-address" colors={colors} isDark={isDark} />

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Téléphone" value={form.telephone} onChange={(t: string) => setForm(f => ({ ...f, telephone: t }))} placeholder="+227 XXXXXXXX" icon="call-outline" keyboardType="phone-pad" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Téléphone Alt." value={form.alternativePhone} onChange={(t: string) => setForm(f => ({ ...f, alternativePhone: t }))} placeholder="+227 XXXXXXXX" icon="call-outline" keyboardType="phone-pad" colors={colors} isDark={isDark} />
            </View>
          </View>

          <InputField label="Adresse Complète" value={form.address} onChange={(t: string) => setForm(f => ({ ...f, address: t }))} placeholder="Rue, numéro" icon="home-outline" colors={colors} isDark={isDark} />

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField label="Ville" value={form.city} onChange={(t: string) => setForm(f => ({ ...f, city: t }))} placeholder="Niamey" icon="location-outline" colors={colors} isDark={isDark} />
            </View>
            <View style={{ flex: 1 }}>
              <InputField label="Matricule" value={form.registrationNumber} onChange={(t: string) => setForm(f => ({ ...f, registrationNumber: t }))} placeholder="MAT-XXX" icon="id-card-outline" colors={colors} isDark={isDark} />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Sécurité</Text>
          <View style={styles.passwordContainer}>
            <TouchableOpacity activeOpacity={0.7} style={[styles.generateBtn, { borderColor: primaryColor }]} onPress={generatePassword}>
              <Ionicons name="key-outline" size={20} color={primaryColor} />
              <Text style={[styles.generateText, { color: primaryColor }]}>Générer un nouveau mot de passe</Text>
            </TouchableOpacity>
            {newPassword !== "" && (
              <View style={[styles.generatedPasswordBox, { backgroundColor: colors.passBox, borderColor: colors.passText + "40" }]}>
                <Text style={[styles.generatedPasswordText, { color: colors.passText }]}>{newPassword}</Text>
                <Text style={[styles.passwordNote, { color: colors.passText }]}>Copié au presse-papier</Text>
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Affectation des Pouvoirs</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => (
              <TouchableOpacity key={r.value} activeOpacity={0.8} style={[styles.roleChip, { backgroundColor: form.role === r.value ? r.color : colors.bgCard, borderColor: form.role === r.value ? r.color : colors.border }]} onPress={() => setForm(f => ({ ...f, role: r.value, selectedStructureId: null }))}>
                <Ionicons name={r.icon as any} size={14} color={form.role === r.value ? "#FFF" : r.color} />
                <Text style={[styles.roleChipText, { color: form.role === r.value ? "#FFF" : colors.textMain }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(isJusticeRole || isSecurityRole) && (
            <View style={{ marginTop: 25 }}>
              <Text style={[styles.sectionTitle, { color: colors.textSub }]}>{isJusticeRole ? "Juridiction d'affectation" : "Unité de Police d'affectation"}</Text>
              {((isJusticeRole && !courts) || (isSecurityRole && !stations)) ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={primaryColor} />
                  <Text style={[styles.emptyText, { color: colors.textSub }]}>Chargement...</Text>
                </View>
              ) : (
                <View style={styles.structureList}>
                  {isJusticeRole && courts && courts.length > 0 && courts.map((item: any) => (
                    <TouchableOpacity key={item.id} style={[styles.structItem, { backgroundColor: colors.bgCard, borderColor: form.selectedStructureId === item.id ? primaryColor : colors.border }]} onPress={() => setForm(f => ({ ...f, selectedStructureId: item.id }))}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{item.name}</Text>
                        <Text style={{ color: colors.textSub, fontSize: 11, marginTop: 2 }}>{item.city || "Juridiction"}</Text>
                      </View>
                      {form.selectedStructureId === item.id && <Ionicons name="checkmark-circle" size={24} color={primaryColor} />}
                    </TouchableOpacity>
                  ))}
                  {isSecurityRole && stations && stations.length > 0 && stations.map((item: any) => (
                    <TouchableOpacity key={item.id} style={[styles.structItem, { backgroundColor: colors.bgCard, borderColor: form.selectedStructureId === item.id ? primaryColor : colors.border }]} onPress={() => setForm(f => ({ ...f, selectedStructureId: item.id }))}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textMain, fontWeight: '700', fontSize: 14 }}>{item.name}</Text>
                        <Text style={{ color: colors.textSub, fontSize: 11, marginTop: 2 }}>{item.city || "Commissariat"}</Text>
                      </View>
                      {form.selectedStructureId === item.id && <Ionicons name="checkmark-circle" size={24} color={primaryColor} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} style={[styles.saveBtn, { backgroundColor: primaryColor, opacity: updateMutation.isPending ? 0.7 : 1 }]} onPress={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <ActivityIndicator color="#FFF" /> : (
              <><Text style={styles.saveText}>METTRE À JOUR LA FICHE</Text><Ionicons name="cloud-upload-outline" size={20} color="#FFF" /></>
            )}
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>

        <SelectionModal
          visible={showRegionModal}
          onClose={() => setShowRegionModal(false)}
          title="Région"
          options={NIGER_REGIONS}
          onSelect={(value: string) => setForm(f => ({ ...f, region: value }))}
          selectedValue={form.region}
          colors={colors}
          primaryColor={primaryColor}
        />
      </KeyboardAvoidingView>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  errorMsg: { fontSize: 14, fontWeight: '700', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  scrollContent: { padding: 20, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  photoSection: { alignItems: 'center', marginBottom: 25 },
  photoFrame: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoLabel: { fontSize: 11, marginTop: 8, fontWeight: '700', color: '#94A3B8' },
  fullImage: { width: '100%', height: '100%' },
  statusCard: { padding: 18, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, marginBottom: 25 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  statusTitle: { fontWeight: "900", fontSize: 11, letterSpacing: 1 },
  sectionTitle: { fontSize: 11, fontWeight: "900", marginBottom: 15, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 10 },
  label: { fontSize: 10, fontWeight: "900", marginBottom: 8, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 15 },
  inputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 15, fontWeight: "700", height: '100%' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  roleChipText: { fontSize: 11, fontWeight: '800', marginLeft: 8 },
  structureList: { gap: 10 },
  emptyBox: { padding: 20, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 13, fontWeight: '600' },
  structItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderRadius: 18, borderWidth: 2, alignItems: 'center' },
  saveBtn: { height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 35, gap: 12, flexDirection: 'row' },
  saveText: { color: "#FFF", fontWeight: "900", fontSize: 15, letterSpacing: 1 },
  passwordContainer: { marginTop: 10, marginBottom: 15 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, gap: 10 },
  generateText: { fontWeight: '800', fontSize: 12 },
  generatedPasswordBox: { marginTop: 12, padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 4 },
  generatedPasswordText: { fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  passwordNote: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', borderRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  modalItemText: { fontSize: 14, fontWeight: '600' },
});