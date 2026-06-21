import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

// ✅ Architecture
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { CitizenScreenProps } from "../../types/navigation";

// Composants
import ScreenContainer from "../../components/layout/ScreenContainer";
import AppHeader from "../../components/layout/AppHeader";
import SmartFooter from "../../components/layout/SmartFooter";
import ChatbotFAB from "../../components/ui/ChatbotFAB";

// 📐 Calcul précis des dimensions pour la grille
const { width } = Dimensions.get("window");
const PADDING = 16;
const GAP = 12;
// Largeur d'un item = (Largeur écran - Padding Gauche - Padding Droit - Espace milieu) / 2
const ITEM_WIDTH = (width - (PADDING * 2) - GAP) / 2;

export default function CitizenHomeScreen({ navigation }: CitizenScreenProps<'CitizenHome'>) {
  const { theme, isDark } = useAppTheme();
  const { user } = useAuthStore();
  
  const primaryColor = "#0891B2"; // Cyan e-Justice

  const [currentTime, setCurrentTime] = useState(new Date());

  // 🕒 Horloge temps réel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateFull = currentTime.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  // 🛠️ LISTE COMPLÈTE DES SERVICES
  const services = [
    { 
      id: "tracking", 
      title: "Suivi Dossier", 
      icon: "folder-open", 
      color: primaryColor, 
      route: "CitizenMyComplaints", 
      desc: "État d'avancement" 
    },
    { 
      id: "guide", 
      title: "Mes Droits", 
      icon: "library-outline", 
      color: "#8B5CF6", // Violet
      route: "CitizenLegalGuide", 
      desc: "Lois & Procédures" 
    },
    { 
      id: "scanner", 
      title: "Vérifier Acte", 
      icon: "qr-code-outline", 
      color: "#059669", // Vert
      route: "VerificationScanner", 
      desc: "Authenticité doc." 
    },
    { 
      id: "record", 
      title: "Casier Judiciaire", 
      icon: "ribbon-outline", 
      color: "#EA580C", // Orange
      route: "CitizenCriminalRecord", 
      desc: "Demande Extrait B3" 
    },
    { 
      id: "directory", 
      title: "Carte Services", 
      icon: "map-outline", 
      color: "#6366F1", // Indigo
      route: "StationMapScreen", 
      desc: "Police & Tribunaux" 
    },
    { 
      id: "sos", 
      title: "Urgences", 
      icon: "call-outline", 
      color: "#EF4444", // Rouge
      route: "CitizenDirectory", 
      desc: "Numéros Verts" 
    }
  ];

  // 🎨 Palette Dynamique
  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0", // Bordure plus visible en mode clair
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <AppHeader title="Portail Citoyen" showMenu={true} showSos={true} />

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.bgMain }]}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* 👋 HEADER BIENVENUE */}
        <View style={styles.welcomeSection}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.welcomeSub, { color: colors.textSub }]}>{dateFull}</Text>
              <Text style={[styles.welcomeTitle, { color: colors.textMain }]}>
                Bonjour, <Text style={{ color: primaryColor }}>{user?.firstname || "Citoyen"}</Text>
              </Text>
            </View>
            <LinearGradient 
              colors={[primaryColor, '#0E7490']} 
              style={styles.clockBadge}
            >
              <Text style={styles.clockText}>{timeString}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* 🏛️ HERO CARD : DÉPOSER PLAINTE */}
        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.heroCard, { backgroundColor: primaryColor }]}
          onPress={() => navigation.navigate("CitizenCreateComplaint")}
        >
          <View style={{ zIndex: 2, flex: 1 }}>
            <Text style={styles.heroTitle}>Déposer une Plainte</Text>
            <Text style={styles.heroSub}>
              Saisissez les autorités en toute sécurité. Service disponible 24h/24 sans déplacement.
            </Text>
            <View style={styles.heroBtn}>
              <Text style={[styles.heroBtnText, { color: primaryColor }]}>NOUVELLE PLAINTE</Text>
              <Ionicons name="arrow-forward" size={16} color={primaryColor} />
            </View>
          </View>
          <View style={styles.heroIconWrapper}>
            <Ionicons name="document-text" size={120} color="rgba(255,255,255,0.15)" />
          </View>
        </TouchableOpacity>

        {/* 🛠️ GRILLE DES SERVICES (ROBUSTE) */}
        <Text style={[styles.sectionTitle, { color: colors.textSub }]}>Services Numériques</Text>
        
        <View style={styles.gridContainer}>
          {services.map((service, index) => (
            <TouchableOpacity
              key={service.id}
              activeOpacity={0.8}
              style={[
                  styles.gridItem, 
                  { 
                    backgroundColor: colors.bgCard, 
                    borderColor: colors.border,
                    // Ajout d'une marge à droite seulement pour les éléments impairs (colonne gauche)
                    marginRight: index % 2 === 0 ? GAP : 0 
                  }
              ]}
              onPress={() => navigation.navigate(service.route as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: service.color + "15" }]}>
                <Ionicons name={service.icon as any} size={26} color={service.color} />
              </View>
              <View>
                <Text style={[styles.gridTitle, { color: colors.textMain }]} numberOfLines={1}>{service.title}</Text>
                <Text style={[styles.gridDesc, { color: colors.textSub }]} numberOfLines={1}>{service.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🔐 INFO SÉCURITÉ */}
        <View style={[styles.infoCard, { borderColor: isDark ? '#1E3A8A' : '#E0F2FE', backgroundColor: isDark ? '#172554' : '#F0F9FF' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                <Ionicons name="shield-checkmark" size={28} color={primaryColor} />
                <View style={{ flex: 1 }}>
                    <Text style={[styles.infoTitle, { color: colors.textMain }]}>Espace Sécurisé</Text>
                    <Text style={[styles.infoText, { color: colors.textSub }]}>
                        Vos données sont chiffrées et protégées par le Ministère de la Justice.
                    </Text>
                </View>
            </View>
        </View>

        {/* Espace pour ne pas cacher le dernier bouton derrière le footer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      <ChatbotFAB />
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 }, 
  scrollContent: { padding: PADDING, paddingTop: 10 },
  
  // Header
  welcomeSection: { marginBottom: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcomeSub: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  welcomeTitle: { fontSize: 22, fontWeight: "900" },
  clockBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, elevation: 3 },
  clockText: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  
  // Hero Card
  heroCard: { 
    borderRadius: 24, padding: 24, marginBottom: 30, overflow: "hidden", 
    elevation: 6, shadowColor: '#0891B2', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    minHeight: 160
  },
  heroTitle: { color: "#FFF", fontSize: 20, fontWeight: "900", marginBottom: 8 },
  heroSub: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginBottom: 20, lineHeight: 19, fontWeight: '600' },
  heroBtn: { 
    backgroundColor: "#FFF", alignSelf: "flex-start", paddingHorizontal: 18, 
    paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 
  },
  heroBtnText: { fontWeight: "900", fontSize: 11, letterSpacing: 0.5 },
  heroIconWrapper: { position: "absolute", right: -25, bottom: -25, opacity: 0.9 },
  
  // Grid
  sectionTitle: { fontSize: 12, fontWeight: "900", marginBottom: 15, letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 },
  gridContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    // Pas de 'gap' ici pour éviter les bugs sur vieux téléphones, on utilise margins dans l'item
  },
  gridItem: { 
    width: ITEM_WIDTH, 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    marginBottom: GAP,
    justifyContent: 'space-between',
    minHeight: 110,
    elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }
  },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  gridTitle: { fontSize: 14, fontWeight: "800", marginBottom: 3 },
  gridDesc: { fontSize: 11, fontWeight: "600" },
  
  // Info Security
  infoCard: { marginTop: 10, padding: 20, borderRadius: 20, borderWidth: 1 },
  infoTitle: { fontWeight: "900", fontSize: 14, marginBottom: 4 },
  infoText: { fontSize: 11, lineHeight: 16, fontWeight: '500' },
});