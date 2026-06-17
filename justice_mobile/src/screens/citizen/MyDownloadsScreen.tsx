// PATH: src/screens/citizen/MyDownloadsScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../theme/AppThemeProvider'; 
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import SmartFooter from '../../components/layout/SmartFooter';

import { getDownloads, deleteDownload, openFile, DownloadedItem } from '../../services/download.service';

export default function MyDownloadsScreen() {
  const { theme } = useAppTheme();
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [])
  );

  const loadFiles = async () => {
    const list = await getDownloads();
    setDownloads(list);
  };

  const handleDelete = (item: DownloadedItem) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer\n\nEffacer "${item.title}" ?`)) {
        deleteDownload(item.id).then(() => loadFiles());
      }
    } else {
      Alert.alert("Supprimer", `Effacer "${item.title}" ?`, [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
            await deleteDownload(item.id);
            loadFiles();
        }}
      ]);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader title="Mes Fichiers" showBack />
      
      <FlatList
        data={downloads}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={60} color="#ccc" />
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              Aucun document téléchargé.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            // ✅ CORRECTION ICI : utilisation de 'surface' au lieu de 'card'
            style={[styles.card, { backgroundColor: theme.colors.surface }]} 
            onPress={() => openFile(item.localUri)}
          >
            <View style={styles.iconBox}>
              <Ionicons name="document-text" size={28} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
              <Text style={styles.date}>Téléchargé le {new Date(item.downloadedAt).toLocaleDateString()}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.delBtn}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.danger || "#FF5252"} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      <SmartFooter />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 12, elevation: 2 },
  iconBox: { width: 50, height: 50, backgroundColor: '#E8F5E9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  title: { fontWeight: 'bold', fontSize: 16 },
  date: { color: '#888', fontSize: 12, marginTop: 4 },
  delBtn: { padding: 10 },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 15, fontSize: 16 }
});