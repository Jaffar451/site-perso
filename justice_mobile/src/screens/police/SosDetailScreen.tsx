// PATH: src/screens/police/SosDetailScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Linking, Platform, StatusBar, Alert } from 'react-native';
import { Text, Button, Avatar, IconButton, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// ✅ Architecture & Theme
import { useAppTheme } from '../../theme/AppThemeProvider';
import { PoliceScreenProps } from '../../types/navigation';
import ScreenContainer from '../../components/layout/ScreenContainer';
import SmartFooter from '../../components/layout/SmartFooter';
import api from '../../services/api';

// ✅ Import conditionnel Maps (Sécurité Web/Simulateurs)
let MapView: any = View;
let Marker: any = View;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn("Service Maps non chargé.");
  }
}

export default function SosDetailScreen({ route, navigation }: PoliceScreenProps<'SosDetail'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const [isResolving, setIsResolving] = useState(false);
  
  // 🛡️ Récupération des paramètres (Typage via navigation.ts)
  const alertData = route.params?.alert;

  // Protection si les données sont perdues
  if (!alertData) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}>
        <Avatar.Icon size={60} icon="alert-circle-outline" style={{ backgroundColor: '#FEE2E2' }} color="#EF4444" />
        <Text style={{ marginTop: 15, fontWeight: '700' }}>Données de l'alerte introuvables.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>Retour</Button>
      </View>
    );
  }

  const colors = {
    bgMain: isDark ? "#0F172A" : "#F8FAFC",
    bgCard: isDark ? "#1E293B" : "#FFFFFF",
    textMain: isDark ? "#FFFFFF" : "#1E293B",
    textSub: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  /**
   * 🗺️ OUVRIR L'ITINÉRAIRE GPS
   */
  const openItinerary = () => {
    const latLng = `${alertData.latitude},${alertData.longitude}`;
    const label = encodeURIComponent("URGENCE SOS");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latLng}`
    });
    if (url) Linking.openURL(url);
  };

  /**
   * 📞 APPEL D'URGENCE
   */
  const handleCall = () => {
    if (alertData.senderPhone) {
      Linking.openURL(`tel:${alertData.senderPhone}`);
    } else {
      Alert.alert("Action impossible", "Aucun numéro de téléphone rattaché à cette alerte.");
    }
  };

  /**
   * ✅ CLÔTURER L'INTERVENTION
   */
  const handleResolve = () => {
    const doResolve = async () => {
      setIsResolving(true);
      try {
        await api.patch(`/sos/${alert.id}/resolve`);
        if (Platform.OS === 'web') {
          window.alert("Mission Terminée\n\nL'intervention a été enregistrée au rapport journalier.");
        } else {
          Alert.alert("Mission Terminée", "L'intervention a été enregistrée au rapport journalier.");
        }
        navigation.goBack();
      } catch (error) {
        if (Platform.OS === 'web') window.alert("Erreur\n\nImpossible de clôturer l'alerte.");
        else Alert.alert("Erreur", "Impossible de clôturer l'alerte.");
      } finally {
        setIsResolving(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Clôturer l'Intervention\n\nLe citoyen a-t-il été secouru ?")) doResolve();
    } else {
      Alert.alert("Clôturer l'Intervention", "Le citoyen a-t-il été secouru ? Cette action archivera l'alerte SOS.", [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer la clôture", onPress: doResolve }
      ]);
    }
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.container}>
        {/* 🗺️ CARTE GPS PLEIN ÉCRAN */}
        {Platform.OS !== 'web' ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: alertData.latitude,
              longitude: alertData.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker coordinate={{ latitude: alertData.latitude, longitude: alertData.longitude }}>
              <View style={styles.markerWrapper}>
                <View style={styles.markerPulse} />
                <Ionicons name="location" size={48} color="#EF4444" />
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={[styles.webPlaceholder, { backgroundColor: colors.bgMain }]}>
            <Avatar.Icon size={80} icon="map-marker-alert" style={{ backgroundColor: '#FEE2E2' }} color="#EF4444" />
            <Text style={[styles.webText, { color: colors.textMain }]}>Mode Web : Carte interactive limitée</Text>
            <Text style={{ color: colors.textSub }}>Coordonnées : {alertData.latitude}, {alertData.longitude}</Text>
          </View>
        )}

        {/* ⬅️ BOUTON RETOUR FLOTTANT */}
        <IconButton
          icon="arrow-left"
          mode="contained"
          containerColor={colors.bgCard}
          iconColor={colors.textMain}
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        />

        {/* 🚨 PANNEAU D'ACTION TACTIQUE */}
        <Surface style={[styles.detailsSheet, { backgroundColor: colors.bgCard }]} elevation={5}>
          <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
          
          <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text variant="headlineSmall" style={[styles.bold, { color: colors.textMain }]}>
                  {alertData.senderName || "Alerte Citoyenne"}
                </Text>
                <View style={styles.badgeRow}>
                  <Ionicons name="navigate-circle" size={16} color="#EF4444" />
                  <Text style={styles.distanceText}>Proximité : {alertData.distance || 'Zone Proche'}</Text>
                </View>
              </View>
              <Avatar.Image 
                size={55} 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1022/1022319.png' }} 
                style={{ backgroundColor: '#FEE2E2' }}
              />
          </View>

          <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text variant="labelSmall" style={{ color: colors.textSub, letterSpacing: 1 }}>SIGNALÉ LE</Text>
                <Text variant="bodyLarge" style={[styles.bold, { color: colors.textMain }]}>
                  {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text variant="labelSmall" style={{ color: colors.textSub, letterSpacing: 1 }}>NIVEAU D'URGENCE</Text>
                <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>CRITIQUE</Text>
                </View>
              </View>
          </View>

          {/* ACTIONS RAPIDES */}
          <View style={styles.actionRow}>
            <Button 
              mode="outlined" 
              icon="phone-outline" 
              onPress={handleCall} 
              style={[styles.btn, { borderColor: primaryColor }]} 
              textColor={primaryColor}
              contentStyle={{ height: 50 }}
            > APPELER </Button>
            
            <Button 
              mode="contained" 
              icon="navigate-outline" 
              onPress={openItinerary} 
              style={[styles.btn, { backgroundColor: '#EF4444' }]}
              contentStyle={{ height: 50 }}
            > ITINÉRAIRE </Button>
          </View>

          <Button 
            mode="contained-tonal" 
            onPress={handleResolve} 
            loading={isResolving}
            disabled={isResolving}
            style={styles.resolveBtn}
            contentStyle={{ height: 55 }}
            labelStyle={{ fontWeight: '900' }}
          > TERMINER L'INTERVENTION </Button>
        </Surface>

        <SmartFooter />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  markerWrapper: { alignItems: 'center', justifyContent: 'center' },
  markerPulse: { 
    position: 'absolute', 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: 'rgba(239, 68, 68, 0.15)', 
    borderWidth: 1.5, 
    borderColor: '#EF4444' 
  },
  webPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  webText: { marginTop: 15, fontWeight: '900', fontSize: 20, textAlign: 'center' },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, elevation: 5 },
  detailsSheet: { 
    position: 'absolute', bottom: 90, left: 10, right: 10, 
    borderRadius: 30, padding: 20, paddingBottom: 30,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)'
  },
  dragIndicator: { width: 45, height: 5, borderRadius: 10, alignSelf: 'center', marginBottom: 20, opacity: 0.3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  distanceText: { color: '#EF4444', fontWeight: '800', marginLeft: 6, fontSize: 13 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoItem: { flex: 1 },
  bold: { fontWeight: '900' },
  urgentBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 6 },
  urgentText: { color: '#B91C1C', fontWeight: '900', fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  btn: { flex: 1, borderRadius: 16 },
  resolveBtn: { borderRadius: 16, marginTop: 5 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }
});