// PATH: src/screens/citizen/StationMapScreen.web.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Platform, Linking } from 'react-native';
import { Text, Button, Card, IconButton, Searchbar } from 'react-native-paper';

// ✅ ON UTILISE PIGEON MAPS (Léger & Déjà installé)
import { Map, Marker } from 'pigeon-maps';

// Architecture
import { CitizenScreenProps } from '../../types/navigation';
import { useAppTheme } from '../../theme/AppThemeProvider';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import { getAllStations, PoliceStation } from '../../services/policeStation.service';

export default function StationMapScreen({ navigation }: CitizenScreenProps<'StationMapScreen'>) {
  const { theme, isDark } = useAppTheme();
  const primaryColor = theme.colors.primary;
  
  // États
  const [stations, setStations] = useState<PoliceStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Centre de Niamey pour Pigeon Maps
  const [center, setCenter] = useState<[number, number]>([13.5127, 2.1128]);
  const [zoom, setZoom] = useState(12);

  // Couleurs dynamiques
  const searchBarBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      const data = await getAllStations();
      setStations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      // On vérifie qu'on a bien des nombres
      const hasCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number';
      const query = searchQuery.toLowerCase().trim();
      
      if (!hasCoords) return false;
      
      if (!query) return s.status === 'active';
      return (s.name?.toLowerCase().includes(query) || s.city?.toLowerCase().includes(query));
    });
  }, [searchQuery, stations]);

  const handleSelectStation = (station: PoliceStation) => {
    setSelectedStation(station);
    // ✅ CORRECTION ICI : Ajout de "|| 0" pour rassurer TypeScript
    setCenter([station.latitude || 0, station.longitude || 0]);
    setZoom(14);
  };

  return (
    <ScreenContainer withPadding={false}>
      <AppHeader title="Carte des Services" showBack />
      
      <View style={styles.mainWrapper}>
        
        {/* 🗺️ CARTE WEB (PIGEON MAPS) */}
        <View style={{ flex: 1, height: '100%', width: '100%', overflow: 'hidden' }}>
            <Map 
              height={800} 
              defaultCenter={[13.5127, 2.1128]} 
              center={center} 
              zoom={zoom} 
              onBoundsChanged={({ center, zoom }) => { 
                setCenter(center); 
                setZoom(zoom); 
              }}
            >
              {filteredStations.map((station) => (
                <Marker 
                  key={station.id} 
                  width={50}
                  // ✅ CORRECTION ICI : Ajout de "|| 0"
                  anchor={[station.latitude || 0, station.longitude || 0]} 
                  color={station.type === 'GENDARMERIE' ? '#065F46' : primaryColor}
                  onClick={() => handleSelectStation(station)}
                />
              ))}
            </Map>
        </View>

        {/* 🔍 RECHERCHE */}
        <View style={styles.searchOverlay}>
          <Searchbar
            placeholder="Rechercher..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchbar, { backgroundColor: searchBarBg, borderColor }]}
            inputStyle={{ color: isDark ? '#FFF' : '#000' }}
          />
        </View>

        {/* 📋 FICHE INFO */}
        {selectedStation && (
          <Card style={[styles.floatingCard, { backgroundColor: cardBg, borderColor }]}>
            <Card.Title
              title={selectedStation.name}
              subtitle={selectedStation.city}
              subtitleStyle={{ color: isDark ? '#94A3B8' : '#64748B' }}
              right={(props) => <IconButton {...props} icon="close" onPress={() => setSelectedStation(null)} />}
            />
            <Card.Content>
               <Text style={{color: isDark ? '#FFF' : '#000'}}>{selectedStation.address || "Adresse non spécifiée"}</Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedStation.latitude || 0},${selectedStation.longitude || 0}`)}>
                Voir sur Google Maps
              </Button>
            </Card.Actions>
          </Card>
        )}
      </View>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, position: 'relative' },
  searchOverlay: { position: 'absolute', top: 15, left: 15, right: 15, zIndex: 1000 },
  searchbar: { borderRadius: 14, elevation: 4, borderWidth: 1 },
  floatingCard: { position: 'absolute', bottom: 80, left: 15, right: 15, borderRadius: 20, elevation: 8, zIndex: 1000 }
});