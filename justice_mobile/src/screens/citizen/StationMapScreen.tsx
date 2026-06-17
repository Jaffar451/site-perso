import React, { useEffect, useState, useMemo, useRef } from 'react';
import { StyleSheet, View, Alert, Linking, Platform, StatusBar } from 'react-native';
import { Text, Button, Card, IconButton, Searchbar } from 'react-native-paper';
import { Ionicons } from "@expo/vector-icons";

// ✅ 1. Imports Architecture
import { CitizenScreenProps } from '../../types/navigation';
import { useAppTheme } from '../../theme/AppThemeProvider';

// Composants
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';

// Services
import { getAllStations, PoliceStation } from '../../services/policeStation.service';

// ==========================================
// 🌍 2. GESTION DES IMPORTS (MOBILE vs WEB)
// ==========================================

// MOBILE : Google Maps
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;

// WEB : Leaflet (OpenStreetMap)
let MapContainer: any, TileLayer: any, LeafletMarker: any, Popup: any, L: any;

if (Platform.OS !== 'web') {
  // Chargement Mobile
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} else {
  // Chargement Web
  try {
    const RL = require('react-leaflet');
    MapContainer = RL.MapContainer;
    TileLayer = RL.TileLayer;
    LeafletMarker = RL.Marker;
    Popup = RL.Popup;
    L = require('leaflet');

    // 🔧 Fix pour les icônes Leaflet qui disparaissent souvent avec Webpack/Expo
    // On définit une icône par défaut
    if (L) {
       const iconDefault = L.icon({
         iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
         shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
         iconSize: [25, 41],
         iconAnchor: [12, 41],
         popupAnchor: [1, -34],
       });
       L.Marker.prototype.options.icon = iconDefault;
    }
  } catch (e) {
    console.error("Erreur chargement Leaflet", e);
  }
}

interface ValidStation extends PoliceStation {
  latitude: number;
  longitude: number;
}

export default function StationMapScreen({ navigation }: CitizenScreenProps<'StationMapScreen'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  const mapRef = useRef<any>(null);

  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<ValidStation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Centre de Niamey
  const NIAMEY_COORDS = { lat: 13.5127, lng: 2.1128 };
  
  const NIAMEY_REGION = {
    latitude: NIAMEY_COORDS.lat,
    longitude: NIAMEY_COORDS.lng,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  // 🎨 Palette dynamique
  const searchBarBg = isDark ? '#1E293B' : '#FFFFFF';
  const searchBarText = isDark ? '#FFFFFF' : '#1E293B';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardText = isDark ? '#FFFFFF' : '#1E293B';
  const cardSubText = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    loadStations();
    
    // 💉 Injection du CSS Leaflet pour le Web (sinon la carte est cassée)
    if (Platform.OS === 'web') {
      const style = document.createElement("style");
      style.innerHTML = `
        .leaflet-container { height: 100%; width: 100%; z-index: 1; }
        .leaflet-div-icon { background: transparent; border: none; }
      `;
      document.head.appendChild(style);
      
      // Import du CSS Leaflet via CDN pour être sûr
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  const loadStations = async () => {
    try {
      const data = await getAllStations();
      setStations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      if (Platform.OS !== 'web') Alert.alert("Erreur", "Impossible de charger la carte.");
    }
  };

  const filteredStations = useMemo(() => {
    return stations.filter((s): s is ValidStation => {
      const hasCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number';
      const query = searchQuery.toLowerCase().trim();
      if (!hasCoords) return false;
      if (!query) return s.status === 'active';
      return (s.name?.toLowerCase().includes(query) || s.city?.toLowerCase().includes(query));
    });
  }, [searchQuery, stations]);

  const handleSelectStation = (station: ValidStation) => {
    setSelectedStation(station);
    
    // Animation Mobile
    if (Platform.OS !== 'web' && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: station.latitude - 0.005,
        longitude: station.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }, 1000);
    }
    // Animation Web (Leaflet)
    else if (Platform.OS === 'web' && mapRef.current) {
       mapRef.current.flyTo([station.latitude, station.longitude], 14);
    }
  };

  const openInGmaps = (lat: number, lng: number, label: string) => {
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(label)}@${latLng}`,
      android: `geo:0,0?q=${latLng}(${encodeURIComponent(label)})`,
      web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    });
    if (url) Linking.openURL(url);
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader title="Carte des Services" showBack />
      
      <View style={styles.mainWrapper}>
        
        {/* 🗺️ ZONE CARTE (MOBILE OU WEB) */}
        {Platform.OS === 'web' ? (
          // 💻 WEB : OPENSTREETMAP (Leaflet)
          <View style={{ flex: 1, height: '100%', width: '100%' }}>
            {MapContainer && (
              <MapContainer 
                center={[NIAMEY_COORDS.lat, NIAMEY_COORDS.lng]} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
                whenCreated={(map: any) => { mapRef.current = map; }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredStations.map((station) => (
                  <LeafletMarker 
                    key={station.id} 
                    position={[station.latitude, station.longitude]}
                    eventHandlers={{
                      click: () => setSelectedStation(station),
                    }}
                  />
                ))}
              </MapContainer>
            )}
          </View>
        ) : (
          // 📱 MOBILE : GOOGLE MAPS NATIVE
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={NIAMEY_REGION}
            showsUserLocation={true}
            customMapStyle={isDark ? darkMapStyle : []}
            onPress={() => setSelectedStation(null)}
          >
            {filteredStations.map((station) => (
              <Marker
                key={station.id}
                coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                onPress={() => handleSelectStation(station)}
              >
                <View style={[styles.markerContainer, { backgroundColor: station.type === 'GENDARMERIE' ? '#065F46' : '#1E3A8A' }]}>
                  <Ionicons name="shield-checkmark" size={16} color="white" />
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {/* 🔍 BARRE DE RECHERCHE */}
        <View style={styles.searchOverlay}>
          <Searchbar
            placeholder="Rechercher une unité..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: searchBarBg, borderColor: borderColor }]}
            inputStyle={{ color: searchBarText, fontSize: 14 }}
            iconColor={primaryColor}
            placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
          />
        </View>

        {/* 📋 FICHE DÉTAILLÉE (Commun Web & Mobile) */}
        {selectedStation && (
          <Card style={[styles.floatingCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <Card.Title
              title={selectedStation.name}
              titleStyle={{ fontWeight: '900', color: cardText, fontSize: 15 }}
              subtitle={selectedStation.city}
              subtitleStyle={{ color: cardSubText }}
              right={(props) => <IconButton {...props} icon="close" onPress={() => setSelectedStation(null)} />}
            />
            <Card.Content>
               <Text style={{ color: cardSubText, fontSize: 12 }}>{selectedStation.address || "Adresse non spécifiée"}</Text>
            </Card.Content>
            <Card.Actions>
              <Button 
                 mode="contained"
                 buttonColor={primaryColor}
                 onPress={() => openInGmaps(selectedStation.latitude, selectedStation.longitude, selectedStation.name)}
              >
                ITINÉRAIRE (Google Maps)
              </Button>
            </Card.Actions>
          </Card>
        )}
      </View>

      <SmartFooter />
    </ScreenContainer>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, position: 'relative' }, // Important pour le web
  map: { ...StyleSheet.absoluteFillObject },
  markerContainer: { padding: 8, borderRadius: 15, borderWidth: 2, borderColor: 'white' },
  searchOverlay: { position: 'absolute', top: 15, left: 15, right: 15, zIndex: 1000 }, // Z-index élevé pour passer au-dessus de Leaflet
  searchbar: { borderRadius: 14, elevation: 4, borderWidth: 1 },
  floatingCard: { position: 'absolute', bottom: 100, left: 15, right: 15, borderRadius: 20, elevation: 8, zIndex: 1001 }
});