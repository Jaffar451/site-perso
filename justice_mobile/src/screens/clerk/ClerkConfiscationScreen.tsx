import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Architecture & Store
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider"; // ✅ Hook dynamique

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";

// Types
type ItemType = "MONEY" | "VEHICLE" | "ELECTRONIC" | "OTHER";
type ItemStatus = "STORED" | "RETURNED" | "DESTROYED" | "AUCTIONED";

interface ConfiscatedItem {
  id: string;
  reference: string; 
  description: string;
  type: ItemType;
  value?: string;
  status: ItemStatus;
  date: string;
}

export default function ClerkConfiscationScreen() {
  // ✅ 2. Thème Dynamique
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { caseId } = route.params || { caseId: "N/A" };

  // 🎨 PALETTE DYNAMIQUE
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#F1F5F9",
    inputBg: isDark ? "#0F172A" : "#F8FAFC",
    modalOverlay: "rgba(0,0,0,0.7)",
  };

  const [items, setItems] = useState<ConfiscatedItem[]>([
    { 
      id: "1", reference: "PV-2025-001", description: "Somme de 500.000 FCFA sous enveloppe scellée", 
      type: "MONEY", value: "500000", status: "STORED", date: "10/12/2025" 
    },
    { 
      id: "2", reference: "PV-2025-002", description: "iPhone 13 Pro Noir (Objet saisi en perquisition)", 
      type: "ELECTRONIC", status: "STORED", date: "12/12/2025" 
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<ItemType>("OTHER");

  const handleAddItem = () => {
    if (!newRef.trim() || !newDesc.trim()) {
      if (Platform.OS === 'web') window.alert("Champs requis\n\nLa référence du PV et la désignation sont obligatoires.");
      else Alert.alert("Champs requis", "La référence du PV et la désignation sont obligatoires.");
      return;
    }

    const newItem: ConfiscatedItem = {
      id: Date.now().toString(),
      reference: newRef.toUpperCase(),
      description: newDesc,
      value: newValue,
      type: newType,
      status: "STORED",
      date: new Date().toLocaleDateString("fr-FR")
    };

    setItems([newItem, ...items]);
    setModalVisible(false);
    resetForm();
    if (Platform.OS === 'web') window.alert("✅ Bien inscrit au registre des scellés.");
  };

  const resetForm = () => {
    setNewRef("");
    setNewDesc("");
    setNewValue("");
    setNewType("OTHER");
  };

  const getTypeInfo = (type: ItemType) => {
    switch (type) {
      case "MONEY": return { icon: "cash-outline", label: "Numéraire", color: "#10B981" };
      case "VEHICLE": return { icon: "car-outline", label: "Véhicule", color: "#F59E0B" };
      case "ELECTRONIC": return { icon: "phone-portrait-outline", label: "Matériel", color: "#3B82F6" };
      default: return { icon: "cube-outline", label: "Autre bien", color: "#64748B" };
    }
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case "STORED": return { label: "AU GREFFE", color: "#3B82F6", bg: isDark ? "#1E3A8A" : "#EFF6FF" };
      case "RETURNED": return { label: "RESTITUÉ", color: "#10B981", bg: isDark ? "#064E3B" : "#F0FDF4" };
      case "DESTROYED": return { label: "DÉTRUIT", color: "#EF4444", bg: isDark ? "#450A0A" : "#FEF2F2" };
      case "AUCTIONED": return { label: "VENDU", color: "#8B5CF6", bg: isDark ? "#2E1065" : "#F5F3FF" };
    }
  };

  const renderItem = ({ item }: { item: ConfiscatedItem }) => {
    const typeInfo = getTypeInfo(item.type);
    const statusInfo = getStatusBadge(item.status);

    return (
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[styles.cardAccent, { backgroundColor: typeInfo.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + "20" }]}>
              <Ionicons name={typeInfo.icon as any} size={14} color={typeInfo.color} />
              <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          
          <Text style={[styles.refText, { color: colors.textMain }]}>RÉF: {item.reference}</Text>
          <Text style={[styles.descText, { color: colors.textSub }]}>{item.description}</Text>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.footerRow}>
            <Text style={[styles.dateText, { color: colors.textSub }]}>Saisi le {item.date}</Text>
            {item.value ? (
              <Text style={[styles.valueText, { color: primaryColor }]}>{Number(item.value).toLocaleString()} FCFA</Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title={`Registre des Scellés RG #${caseId}`} showBack={true} />
      
      <View style={[styles.main, { backgroundColor: colors.bgMain }]}>
        <View style={[styles.summaryBar, { backgroundColor: primaryColor + "15" }]}>
           <Text style={[styles.summaryText, { color: primaryColor }]}>
             {items.length} OBJET(S) SOUS MAIN DE JUSTICE
           </Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="archive-outline" size={60} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSub }]}>Aucun bien inscrit pour ce dossier.</Text>
            </View>
          }
        />

        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.fab, { backgroundColor: primaryColor }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* --- MODAL D'ENREGISTREMENT --- */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textMain }]}>Nouvel Inventaire</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color={colors.textSub} />
                </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.label, { color: colors.textSub }]}>RÉFÉRENCE DU PV DE SAISIE *</Text>
              <TextInput 
                style={[styles.input, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                placeholder="Ex: PV-2025-..."
                placeholderTextColor={colors.textSub}
                value={newRef}
                onChangeText={setNewRef}
                autoCapitalize="characters"
              />

              <Text style={[styles.label, { color: colors.textSub }]}>DÉSIGNATION DE L'OBJET *</Text>
              <TextInput 
                style={[styles.input, styles.textArea, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                placeholder="Détails (N° série, couleur, état, marques...)"
                placeholderTextColor={colors.textSub}
                multiline
                numberOfLines={3}
                value={newDesc}
                onChangeText={setNewDesc}
              />

              <Text style={[styles.label, { color: colors.textSub }]}>NATURE DU BIEN SCELLÉ</Text>
              <View style={styles.typeGrid}>
                {(["MONEY", "VEHICLE", "ELECTRONIC", "OTHER"] as ItemType[]).map((t) => {
                  const isSelected = newType === t;
                  const info = getTypeInfo(t);
                  return (
                    <TouchableOpacity 
                      key={t}
                      onPress={() => setNewType(t)}
                      style={[
                        styles.typeBtn, 
                        { 
                          backgroundColor: isSelected ? info.color : colors.inputBg, 
                          borderColor: isSelected ? info.color : colors.border 
                        }
                      ]}
                    >
                      <Ionicons name={info.icon as any} size={18} color={isSelected ? "#FFF" : info.color} />
                      <Text style={[styles.typeBtnText, { color: isSelected ? "#FFF" : colors.textSub }]}>{info.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.label, { color: colors.textSub }]}>VALEUR ESTIMÉE (FCFA)</Text>
              <TextInput 
                style={[styles.input, { color: colors.textMain, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                placeholder="Optionnel (ex: 50000)"
                placeholderTextColor={colors.textSub}
                keyboardType="numeric"
                value={newValue}
                onChangeText={setNewValue}
              />

              <TouchableOpacity onPress={handleAddItem} style={[styles.confirmBtn, { backgroundColor: primaryColor }]}>
                <Text style={styles.confirmBtnText}>INSCRIRE AU REGISTRE</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1 },
  summaryBar: { padding: 12, alignItems: 'center' },
  summaryText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  listContent: { padding: 16, paddingBottom: 150 },
  
  card: { borderRadius: 24, marginBottom: 12, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }) },
  cardAccent: { width: 6 },
  cardContent: { flex: 1, padding: 18 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typeText: { fontSize: 9, fontWeight: "900", textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 9, fontWeight: "900" },
  
  refText: { fontSize: 16, fontWeight: "900", marginBottom: 6 },
  descText: { fontSize: 14, lineHeight: 20, fontWeight: "500", marginBottom: 15 },
  divider: { height: 1, marginBottom: 12 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateText: { fontSize: 11, fontWeight: '800' },
  valueText: { fontSize: 14, fontWeight: "900" },

  empty: { alignItems: 'center', marginTop: 120 },
  emptyText: { marginTop: 15, fontWeight: '700' },

  fab: { position: "absolute", bottom: 100, right: 20, width: 64, height: 64, borderRadius: 22, justifyContent: "center", alignItems: "center", elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalContent: { padding: 24, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: "90%" },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: "900" },
  
  label: { fontSize: 10, fontWeight: "900", marginBottom: 10, marginTop: 15, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderRadius: 16, padding: 16, fontSize: 15, fontWeight: "600" },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 },
  typeBtn: { width: "48%", padding: 18, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeBtnText: { fontSize: 12, fontWeight: "800" },

  confirmBtn: { marginTop: 35, padding: 20, borderRadius: 20, alignItems: "center", ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5 }, android: { elevation: 4 } }) },
  confirmBtnText: { color: "#FFF", fontWeight: "900", letterSpacing: 1.5, fontSize: 14 }
});