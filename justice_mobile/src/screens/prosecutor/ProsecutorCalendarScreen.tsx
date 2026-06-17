// PATH: src/screens/prosecutor/ProsecutorCalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ✅ Architecture
import { useAppTheme } from '../../theme/AppThemeProvider';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';
import api from '../../services/api'; // Import API réel

// Interface locale pour les données d'audience
interface HearingEvent {
  id: string;
  time: string;
  caseRef: string;
  type: string;
  defendant: string;
  room: string;
  status: 'pending' | 'active' | 'finished';
  caseId: number;
}

export default function ProsecutorCalendarScreen({ navigation }: any) {
  const { theme, isDark } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hearings, setHearings] = useState<HearingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 🎨 Palette Justice (Bordeaux/Or pour le Parquet)
  const colors = {
    bg: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1E293B",
    subText: isDark ? "#94A3B8" : "#64748B",
    primary: "#7C2D12", // Bordeaux
    accent: "#F59E0B",
    border: isDark ? "#334155" : "#E2E8F0"
  };

  // 📡 RÉCUPÉRATION DES AUDIENCES DU JOUR
  
  useEffect(() => {
    let isMounted = true;

    const fetchHearings = async () => {
      setLoading(true);
      
      try {
        // Formatage YYYY-MM-DD pour l'API
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        console.log(`[API] Récupération audiences pour : ${dateStr}`);
        const response = await api.get(`/hearings`, { params: { date: dateStr } });

        if (isMounted) {
          // 🔧 CORRECTION : Extraction robuste des données API
          let hearingsData: any[] = [];
          
          // Détection automatique de la structure de réponse
          if (Array.isArray(response.data)) {
            // Cas 1 : API retourne directement un tableau
            hearingsData = response.data;
          } else if (Array.isArray(response.data?.data)) {
            // Cas 2 : API retourne { data: [...], count: X, ... }
            hearingsData = response.data.data;
          } else if (Array.isArray(response.data?.hearings)) {
            // Cas 3 : API retourne { hearings: [...] }
            hearingsData = response.data.hearings;
          } else if (Array.isArray(response.data?.items)) {
            // Cas 4 : API retourne { items: [...] }
            hearingsData = response.data.items;
          } else {
            console.warn('[API] Format de réponse inattendu:', response.data);
            hearingsData = [];
          }

          console.log(`[API] ${hearingsData.length} audiences reçues`);

          // Mapping sécurisé avec valeurs par défaut
          const mappedData: HearingEvent[] = hearingsData.map((h: any) => ({
            id: h.id?.toString() || Math.random().toString(36).substr(2, 9),
            time: h.hearingDate 
              ? new Date(h.hearingDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : "--:--",
            caseRef: h.complaint?.trackingCode || h.trackingCode || `Dossier #${h.complaintId || h.id || '?'}`,
            type: h.type || "Audience Générale",
            defendant: h.complaint?.defendantName || h.defendantName || "Inconnu",
            room: h.location || h.room || "Palais de Justice",
            status: h.status || 'pending',
            caseId: h.complaintId || h.id || 0
          }));
          
          // Tri chronologique
          mappedData.sort((a: HearingEvent, b: HearingEvent) => a.time.localeCompare(b.time));
          setHearings(mappedData);
        }
      } catch (error: any) {
        console.error("❌ Erreur chargement calendrier:", error.message);
        // On ne bloque pas l'UI, on vide juste la liste
        if (isMounted) setHearings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHearings();
    return () => { isMounted = false; };
  }, [selectedDate]);

  const renderItem = ({ item, index }: { item: HearingEvent, index: number }) => {
    const isLast = index === hearings.length - 1;
    
    let statusColor = colors.subText;
    let icon = "time-outline";
    
    if (item.status === 'active') { statusColor = "#10B981"; icon = "pulse"; }
    if (item.status === 'finished') { statusColor = "#64748B"; icon = "checkmark-circle"; }

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timeColumn}>
          <Text style={[styles.timeText, { color: colors.text }]}>{item.time}</Text>
          {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
        </View>

        <TouchableOpacity 
          style={[styles.card, { backgroundColor: colors.card, borderColor: item.status === 'active' ? colors.primary : colors.border }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ProsecutorCaseDetail', { caseId: item.caseId })}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.tag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.tagText, { color: colors.primary }]}>{item.caseRef}</Text>
            </View>
            {item.status === 'active' && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveText}>EN COURS</Text>
              </View>
            )}
          </View>

          <Text style={[styles.typeText, { color: colors.text }]}>{item.type}</Text>
          <Text style={[styles.defendant, { color: colors.subText }]}>Contre : {item.defendant}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.cardFooter}>
            <View style={styles.iconRow}>
              <Ionicons name="location-outline" size={14} color={colors.subText} />
              <Text style={[styles.footerText, { color: colors.subText }]}>{item.room}</Text>
            </View>
            <Ionicons name={icon as any} size={18} color={statusColor} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScreenContainer withPadding={false}>
      <StatusBar barStyle="light-content" />
      <AppHeader title="Planning Audiences" showBack />

      {/* 📅 SÉLECTEUR DE DATE */}
      <View style={[styles.dateStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          {[-2, -1, 0, 1, 2, 3, 4].map((dayOffset) => {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);
            
            const isSelected = 
               date.getDate() === selectedDate.getDate() && 
               date.getMonth() === selectedDate.getMonth();

            const dayNum = date.getDate();
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase();

            return (
              <TouchableOpacity 
                key={dayOffset} 
                style={[styles.dateItem, isSelected && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, { color: isSelected ? '#FFF' : colors.subText }]}>{dayName}</Text>
                <Text style={[styles.dayNum, { color: isSelected ? '#FFF' : colors.text }]}>{dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.content, { backgroundColor: colors.bg }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
             {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text style={[styles.summaryCount, { color: colors.primary }]}>
            {loading ? "..." : `${hearings.length} audiences`}
          </Text>
        </View>

        {loading ? (
            <View style={{ marginTop: 50 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: 10, color: colors.subText }}>Chargement du planning...</Text>
            </View>
        ) : (
            <FlatList
                data={hearings}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-clear-outline" size={64} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.subText }]}>Aucune audience programmée ce jour.</Text>
                    </View>
                }
            />
        )}
      </View>
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dateStrip: { paddingVertical: 15, borderBottomWidth: 1 },
  dateItem: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: 'transparent' },
  dayName: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  dayNum: { fontSize: 18, fontWeight: '900' },

  content: { flex: 1, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  summaryTitle: { fontSize: 16, fontWeight: '900', textTransform: 'capitalize' },
  summaryCount: { fontSize: 14, fontWeight: '700' },

  timelineItem: { flexDirection: 'row', marginBottom: 5 },
  timeColumn: { width: 50, alignItems: 'center', marginRight: 10 },
  timeText: { fontWeight: '800', fontSize: 13 },
  line: { width: 2, flex: 1, marginTop: 5, borderRadius: 2 },

  card: { flex: 1, borderRadius: 18, padding: 16, marginBottom: 15, borderWidth: 1, elevation: 2, shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: {width:0, height:2} },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '800' },
  liveBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  liveText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  typeText: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  defendant: { fontSize: 13, fontStyle: 'italic' },
  
  divider: { height: 1, marginVertical: 10, opacity: 0.5 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, fontSize: 14, fontStyle: 'italic' }
});